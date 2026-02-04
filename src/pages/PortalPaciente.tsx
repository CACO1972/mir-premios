import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, FileText, CreditCard, MessageCircle, LogOut, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LeadData {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rut: string | null;
  stage: string;
  ia_ruta_sugerida: string | null;
  ia_resumen: string | null;
  cita_agendada_at: string | null;
  payment_status: string | null;
}

const PortalPaciente = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Get lead data by email
      const { data: lead, error: leadError } = await supabase
        .from('funnel_leads')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (leadError) {
        console.error('Error loading lead data:', leadError);
        setError('No se encontraron datos del paciente');
      } else {
        setLeadData(lead as LeadData);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'LEAD': 'Registrado',
      'IA_DONE': 'Análisis IA completado',
      'CHECKOUT_CREATED': 'Pendiente de pago',
      'PAID': 'Pagado - Pendiente agendar',
      'SCHEDULED': 'Cita agendada',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado',
    };
    return labels[stage] || stage;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <span className="font-serif text-xl text-foreground tracking-tight">
                M<span className="text-gold-muted">iró</span>
              </span>
            </button>
            <span className="text-sm text-muted-foreground">Portal Paciente</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        ) : leadData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif text-foreground mb-2">
                Bienvenido, {leadData.nombre.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground">
                Estado actual: <span className="text-gold">{getStageLabel(leadData.stage)}</span>
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <User className="h-8 w-8 text-gold mb-2" />
                  <CardTitle className="text-lg">Mi Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Ver y actualizar mis datos personales
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <Calendar className="h-8 w-8 text-gold mb-2" />
                  <CardTitle className="text-lg">Mis Citas</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {leadData.cita_agendada_at 
                      ? `Próxima cita: ${new Date(leadData.cita_agendada_at).toLocaleDateString('es-CL')}`
                      : 'No hay citas programadas'
                    }
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <FileText className="h-8 w-8 text-gold mb-2" />
                  <CardTitle className="text-lg">Resultados IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {leadData.ia_resumen 
                      ? 'Ver análisis de tu evaluación'
                      : 'Pendiente de análisis'
                    }
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CreditCard className="h-8 w-8 text-gold mb-2" />
                  <CardTitle className="text-lg">Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {leadData.payment_status === 'approved' 
                      ? 'Pago confirmado'
                      : 'Ver estado de pagos'
                    }
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* IA Summary Card */}
            {leadData.ia_resumen && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gold" />
                    Resumen de tu Análisis IA
                  </CardTitle>
                  <CardDescription>
                    Ruta sugerida: {leadData.ia_ruta_sugerida || 'General'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {leadData.ia_resumen}
                  </p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    ⚠️ Este análisis es orientativo y no constituye un diagnóstico definitivo.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* WhatsApp Contact */}
            <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="flex items-center justify-between py-6">
                <div className="flex items-center gap-4">
                  <MessageCircle className="h-10 w-10 text-green-500" />
                  <div>
                    <h3 className="font-medium text-foreground">¿Necesitas ayuda?</h3>
                    <p className="text-sm text-muted-foreground">
                      Contáctanos directamente por WhatsApp
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => window.open('https://wa.me/56912345678', '_blank')}
                >
                  Abrir WhatsApp
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No se encontraron datos</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PortalPaciente;
