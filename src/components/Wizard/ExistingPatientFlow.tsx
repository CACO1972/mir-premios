import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import type { EvaluacionData } from './types';

interface ExistingPatientFlowProps {
  onStartTreatment: (evaluationId: string, data: Partial<EvaluacionData>) => void;
  onControlOnly: () => void;
  onBack: () => void;
  onError: (error: string) => void;
}

const ExistingPatientFlow = ({ 
  onStartTreatment, 
  onControlOnly, 
  onBack,
  onError 
}: ExistingPatientFlowProps) => {
  const [step, setStep] = useState<'login' | 'choice' | 'questionnaire'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ rut: '', email: '' });
  const [patientData, setPatientData] = useState<{ nombre: string; dentalinkId: string } | null>(null);
  const [choice, setChoice] = useState<'control' | 'treatment' | ''>('');
  const [treatmentMotivo, setTreatmentMotivo] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate patient lookup (would integrate with Dentalink)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock patient data
      setPatientData({
        nombre: 'Paciente Existente',
        dentalinkId: `dnk_${loginData.rut.replace(/[^0-9]/g, '')}`
      });
      
      setStep('choice');
    } catch (err) {
      console.error('Error logging in:', err);
      onError('No pudimos verificar tus datos. Verifica e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = (value: 'control' | 'treatment') => {
    setChoice(value);
    if (value === 'control') {
      onControlOnly();
    } else {
      setStep('questionnaire');
    }
  };

  const handleSubmitTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const evaluacionData: Partial<EvaluacionData> = {
        nombre: patientData?.nombre || '',
        email: loginData.email,
        rut: loginData.rut,
        tipo_ruta: 'paciente_antiguo',
        motivo_consulta: treatmentMotivo,
        dentalink_patient_id: patientData?.dentalinkId,
        payment_status: 'pending',
        estado_evaluacion: 'iniciada'
      };

      const { data, error } = await supabase
        .from('evaluaciones')
        .insert({
          nombre: evaluacionData.nombre!,
          email: evaluacionData.email!,
          rut: evaluacionData.rut,
          tipo_ruta: 'paciente_antiguo',
          motivo_consulta: evaluacionData.motivo_consulta,
          dentalink_patient_id: evaluacionData.dentalink_patient_id,
          payment_status: 'pending',
          estado_evaluacion: 'cuestionario_completado'
        })
        .select('id')
        .single();

      if (error) throw error;

      onStartTreatment(data.id, evaluacionData);
    } catch (err) {
      console.error('Error creating evaluation:', err);
      onError('Error al procesar. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6 text-cream-muted hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      {step === 'login' && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
              <User className="w-8 h-8 text-gold" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-cream-muted">
              Ingresa tus datos para acceder a tu historial
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                value={loginData.rut}
                onChange={(e) => setLoginData({ ...loginData, rut: e.target.value })}
                placeholder="12.345.678-9"
                required
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email registrado</Label>
              <Input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="tu@email.com"
                required
                className="bg-card border-border"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </>
      )}

      {step === 'choice' && patientData && (
        <>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-500" />
            </motion.div>
            <h2 className="font-serif text-2xl text-foreground mb-2">
              ¡Hola, {patientData.nombre}!
            </h2>
            <p className="text-cream-muted">
              ¿Qué te gustaría hacer hoy?
            </p>
          </div>

          <RadioGroup
            value={choice}
            onValueChange={(v) => handleChoice(v as 'control' | 'treatment')}
            className="space-y-4"
          >
            <label
              className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors"
            >
              <RadioGroupItem value="control" id="control" />
              <div>
                <span className="block text-foreground font-medium">Solo control</span>
                <span className="block text-sm text-cream-muted">Revisión de rutina</span>
              </div>
            </label>
            <label
              className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:border-gold/50 transition-colors"
            >
              <RadioGroupItem value="treatment" id="treatment" />
              <div>
                <span className="block text-foreground font-medium">Nuevo tratamiento</span>
                <span className="block text-sm text-cream-muted">Evaluación premium preferente</span>
              </div>
            </label>
          </RadioGroup>
        </>
      )}

      {step === 'questionnaire' && (
        <>
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl text-foreground mb-2">
              Cuéntanos más
            </h2>
            <p className="text-cream-muted">
              ¿Qué nuevo tratamiento te interesa?
            </p>
          </div>

          <form onSubmit={handleSubmitTreatment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de consulta</Label>
              <Input
                id="motivo"
                value={treatmentMotivo}
                onChange={(e) => setTreatmentMotivo(e.target.value)}
                placeholder="Describe brevemente qué te gustaría evaluar..."
                required
                className="bg-card border-border"
              />
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-lg p-4">
              <p className="text-sm text-cream-muted">
                <strong className="text-gold">Copago preferente:</strong> $25.000 CLP
                <br />
                <span className="text-xs">Precio especial para pacientes Miró</span>
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Continuar a Evaluación'
              )}
            </Button>
          </form>
        </>
      )}
    </motion.div>
  );
};

export default ExistingPatientFlow;
