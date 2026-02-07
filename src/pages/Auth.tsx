import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type AuthStep = 'rut' | 'otp' | 'signup';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const isProfessional = searchParams.get('role') === 'professional';
  
  const [step, setStep] = useState<AuthStep>('rut');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    rut: '',
    email: '',
    otp: '',
    nombre: '',
    telefono: '',
  });
  const [maskedContact, setMaskedContact] = useState<{ email: string; phone: string | null }>({
    email: '',
    phone: null,
  });

  // Format RUT as user types (without dots, with hyphen only)
  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length <= 1) return clean;
    
    const body = clean.slice(0, -1);
    const verifier = clean.slice(-1);
    return `${body}-${verifier}`;
  };

  // Normalize RUT for storage/API (same format)
  const normalizeRut = (value: string) => formatRut(value);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData(prev => ({ ...prev, rut: formatted }));
  };

  const handleRequestOTP = async () => {
    if (!formData.rut || formData.rut.length < 9) {
      toast({
        title: 'RUT inválido',
        description: 'Por favor ingresa un RUT válido',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Normalize RUT before sending to API (without dots)
      const normalizedRut = normalizeRut(formData.rut);
      
      const { data, error } = await supabase.functions.invoke('auth-login-rut', {
        body: { rut: normalizedRut, email: formData.email || undefined },
      });

      // Check for "not found" case - the edge function returns 404 with is_new_patient flag
      // supabase.functions.invoke treats non-2xx as error, but data may still contain the response
      if (error) {
        // Check if error message indicates it's a 404 "not found" scenario
        const errorMessage = error.message || '';
        
        // The response body might be in data even with an error
        if (data?.is_new_patient) {
          toast({
            title: 'Usuario no encontrado',
            description: 'No encontramos un registro con este RUT. ¿Deseas registrarte?',
          });
          setStep('signup');
          return;
        }
        
        // If it's a 404-like error (RUT not found), transition to signup
        if (errorMessage.includes('non-2xx') || errorMessage.includes('404')) {
          toast({
            title: 'Usuario no encontrado',
            description: 'No encontramos un registro con este RUT. ¿Deseas registrarte?',
          });
          setStep('signup');
          return;
        }
        
        throw new Error(errorMessage || 'Error al verificar RUT');
      }

      // Success case
      if (data?.success) {
        setMaskedContact({
          email: data.email_masked,
          phone: data.phone_masked,
        });
        setStep('otp');
        toast({
          title: 'Código enviado',
          description: 'Revisa tu correo/WhatsApp para el código de verificación',
        });
      } else if (data?.is_new_patient) {
        // Fallback check for is_new_patient in data
        toast({
          title: 'Usuario no encontrado',
          description: 'No encontramos un registro con este RUT. ¿Deseas registrarte?',
        });
        setStep('signup');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al enviar código',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Ingresa el código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('auth-verify-otp', {
        body: { rut: formData.rut, otp: formData.otp },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success) {
        // If we have a session URL, use it
        if (data.session_url) {
          window.location.href = data.session_url;
          return;
        }

        toast({
          title: '¡Bienvenido!',
          description: `Hola ${data.user?.nombre || 'usuario'}`,
        });

        // Navigate to appropriate portal
        navigate(isProfessional ? '/portal-profesional' : '/portal-paciente');
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      toast({
        title: 'Código incorrecto',
        description: 'El código ingresado no es válido o expiró',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!formData.nombre || !formData.email || !formData.rut) {
      toast({
        title: 'Datos incompletos',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Normalize RUT before sending to API
      const normalizedRut = normalizeRut(formData.rut);
      
      // Create lead first
      const leadResponse = await supabase.functions.invoke('funnel-lead', {
        body: {
          nombre: formData.nombre,
          email: formData.email,
          rut: normalizedRut,
          telefono: formData.telefono,
          origen: 'portal',
        },
      });

      if (leadResponse.error) {
        throw new Error(leadResponse.error.message);
      }

      // Now request OTP
      await handleRequestOTP();
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <button 
              onClick={() => navigate('/')}
              className="mx-auto mb-4"
            >
              <span className="font-serif text-2xl text-foreground tracking-tight">
                M<span className="text-gold-muted">iró</span>
              </span>
            </button>
            <CardTitle className="text-xl">
              {isProfessional ? 'Portal Profesional' : 'Portal Paciente'}
            </CardTitle>
            <CardDescription>
              {step === 'rut' && 'Ingresa tu RUT para acceder'}
              {step === 'otp' && 'Ingresa el código de verificación'}
              {step === 'signup' && 'Completa tu registro'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === 'rut' && (
                <motion.div
                  key="rut"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      placeholder="17190250-9"
                      value={formData.rut}
                      onChange={handleRutChange}
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ingresa sin puntos, solo con guión. Ej: 17190250-9
                    </p>
                  </div>

                  <Button
                    className="w-full bg-gold hover:bg-gold/90"
                    onClick={handleRequestOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verificando...' : 'Continuar'}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={() => setStep('signup')}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors"
                    >
                      ¿No tienes cuenta? Regístrate
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center text-sm text-muted-foreground mb-4">
                    Enviamos un código a:
                    <div className="font-medium text-foreground mt-1">
                      {maskedContact.email}
                      {maskedContact.phone && ` / ${maskedContact.phone}`}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">Código de verificación</Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      value={formData.otp}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        otp: e.target.value.replace(/\D/g, '').slice(0, 6) 
                      }))}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>

                  <Button
                    className="w-full bg-gold hover:bg-gold/90"
                    onClick={handleVerifyOTP}
                    disabled={isLoading || formData.otp.length !== 6}
                  >
                    {isLoading ? 'Verificando...' : 'Verificar'}
                  </Button>

                  <div className="flex justify-between text-sm">
                    <button
                      onClick={() => setStep('rut')}
                      className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver
                    </button>
                    <button
                      onClick={handleRequestOTP}
                      className="text-muted-foreground hover:text-gold transition-colors"
                      disabled={isLoading}
                    >
                      Reenviar código
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nombre"
                        placeholder="Juan Pérez"
                        value={formData.nombre}
                        onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-rut">RUT</Label>
                    <Input
                      id="signup-rut"
                      placeholder="17190250-9"
                      value={formData.rut}
                      onChange={handleRutChange}
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Sin puntos, solo con guión
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono (opcional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telefono"
                        placeholder="+56 9 1234 5678"
                        value={formData.telefono}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gold hover:bg-gold/90"
                    onClick={handleSignup}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Registrando...' : 'Registrarme'}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={() => setStep('rut')}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Ya tengo cuenta
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
