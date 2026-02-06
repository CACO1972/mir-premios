import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortalHeader, EvaluacionesTab, PagosTab, CitasTab } from '@/components/PortalPaciente';

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
  monto_pagado: number | null;
  paid_at: string | null;
  checkout_url: string | null;
  created_at: string;
}

interface EvaluacionData {
  id: string;
  nombre: string;
  email: string;
  tipo_ruta: string;
  ruta_sugerida: string | null;
  estado_evaluacion: string;
  resumen_ia: string | null;
  payment_status: string;
  created_at: string;
  cita_agendada_at: string | null;
}

const PortalPaciente = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionData[]>([]);
  const [userName, setUserName] = useState<string>('');
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

      const userEmail = session.user.email;

      // Fetch funnel_leads and evaluaciones in parallel
      const [leadsResult, evaluacionesResult] = await Promise.all([
        supabase
          .from('funnel_leads')
          .select('*')
          .eq('email', userEmail)
          .order('created_at', { ascending: false }),
        supabase
          .from('evaluaciones')
          .select('*')
          .eq('email', userEmail)
          .order('created_at', { ascending: false })
      ]);

      if (leadsResult.error) {
        console.error('Error loading leads:', leadsResult.error);
      } else {
        setLeads(leadsResult.data as LeadData[]);
        if (leadsResult.data?.[0]?.nombre) {
          setUserName(leadsResult.data[0].nombre.split(' ')[0]);
        }
      }

      if (evaluacionesResult.error) {
        console.error('Error loading evaluaciones:', evaluacionesResult.error);
      } else {
        setEvaluaciones(evaluacionesResult.data as EvaluacionData[]);
        if (!userName && evaluacionesResult.data?.[0]?.nombre) {
          setUserName(evaluacionesResult.data[0].nombre.split(' ')[0]);
        }
      }

      if (!leadsResult.data?.length && !evaluacionesResult.data?.length) {
        setError('No se encontraron datos asociados a tu cuenta');
      }

    } catch (err) {
      console.error('Auth check error:', err);
      setError('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform leads to pago format
  const pagos = leads.map(lead => ({
    id: lead.id,
    payment_status: lead.payment_status,
    monto_pagado: lead.monto_pagado,
    paid_at: lead.paid_at,
    checkout_url: lead.checkout_url,
    ia_ruta_sugerida: lead.ia_ruta_sugerida,
    created_at: lead.created_at,
  }));

  // Transform leads to cita format
  const citas = leads.map(lead => ({
    id: lead.id,
    cita_agendada_at: lead.cita_agendada_at,
    ia_ruta_sugerida: lead.ia_ruta_sugerida,
    stage: lead.stage,
    nombre: lead.nombre,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-serif text-foreground mb-2">
                Bienvenido{userName ? `, ${userName}` : ''}
              </h1>
              <p className="text-muted-foreground">
                Gestiona tus evaluaciones, pagos y citas desde un solo lugar
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="evaluaciones" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="evaluaciones">Mis Evaluaciones</TabsTrigger>
                <TabsTrigger value="pagos">Pagos</TabsTrigger>
                <TabsTrigger value="citas">Citas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="evaluaciones">
                <EvaluacionesTab 
                  evaluaciones={evaluaciones} 
                  isLoading={isLoading} 
                />
              </TabsContent>
              
              <TabsContent value="pagos">
                <PagosTab 
                  pagos={pagos} 
                  isLoading={isLoading} 
                />
              </TabsContent>
              
              <TabsContent value="citas">
                <CitasTab 
                  citas={citas} 
                  isLoading={isLoading} 
                />
              </TabsContent>
            </Tabs>

            {/* WhatsApp Contact */}
            <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
                <div className="flex items-center gap-4">
                  <MessageCircle className="h-10 w-10 text-green-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground">¿Necesitas ayuda?</h3>
                    <p className="text-sm text-muted-foreground">
                      Contáctanos directamente por WhatsApp
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
                  onClick={() => window.open('https://wa.me/56912345678', '_blank')}
                >
                  Abrir WhatsApp
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PortalPaciente;
