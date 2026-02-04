import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Calendar, FileText, Brain, Settings, LogOut, Home,
  TrendingUp, Clock, CheckCircle, AlertCircle, Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface LeadSummary {
  id: string;
  nombre: string;
  email: string;
  stage: string;
  ia_ruta_sugerida: string | null;
  created_at: string;
  cita_agendada_at: string | null;
}

const PortalProfesional = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth?role=professional');
        return;
      }

      // Load leads data
      const { data: leadsData, error } = await supabase
        .from('funnel_leads')
        .select('id, nombre, email, stage, ia_ruta_sugerida, created_at, cita_agendada_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading leads:', error);
      } else {
        setLeads(leadsData as LeadSummary[]);
        
        // Calculate stats
        const total = leadsData.length;
        const pending = leadsData.filter(l => ['LEAD', 'IA_DONE', 'CHECKOUT_CREATED'].includes(l.stage)).length;
        const scheduled = leadsData.filter(l => l.stage === 'SCHEDULED').length;
        const completed = leadsData.filter(l => l.stage === 'COMPLETED').length;
        
        setStats({ total, pending, scheduled, completed });
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'LEAD': 'bg-blue-500/20 text-blue-400',
      'IA_DONE': 'bg-purple-500/20 text-purple-400',
      'CHECKOUT_CREATED': 'bg-yellow-500/20 text-yellow-400',
      'PAID': 'bg-green-500/20 text-green-400',
      'SCHEDULED': 'bg-gold/20 text-gold',
      'COMPLETED': 'bg-emerald-500/20 text-emerald-400',
      'CANCELLED': 'bg-red-500/20 text-red-400',
    };
    return colors[stage] || 'bg-muted text-muted-foreground';
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      'LEAD': 'Nuevo',
      'IA_DONE': 'IA Lista',
      'CHECKOUT_CREATED': 'Pago Pendiente',
      'PAID': 'Pagado',
      'SCHEDULED': 'Agendado',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado',
    };
    return labels[stage] || stage;
  };

  const filteredLeads = leads.filter(lead => 
    lead.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <span className="text-sm text-muted-foreground">Portal Profesional</span>
            <Badge variant="outline" className="text-gold border-gold/50">
              MIRO 4P Copilot
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Config
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <Users className="h-10 w-10 text-gold/50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Agendados</p>
                    <p className="text-3xl font-bold text-gold">{stats.scheduled}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-gold/50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completados</p>
                    <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-emerald-400/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MIRO 4P Modules */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="hover:border-gold/50 transition-colors cursor-pointer bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-400" />
                  MIRO 4P Implants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Planificación implantológica con IA predictiva
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:border-gold/50 transition-colors cursor-pointer bg-gradient-to-br from-purple-500/10 to-purple-600/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  MIRO 4P Ortho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Análisis ortodóncico y simulación de tratamiento
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:border-gold/50 transition-colors cursor-pointer bg-gradient-to-br from-pink-500/10 to-pink-600/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-pink-400" />
                  MIRO 4P Aesthetics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Diseño de sonrisa y armonía dentofacial
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:border-gold/50 transition-colors cursor-pointer bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-emerald-400" />
                  MIRO 4P Perio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Seguimiento periodontal y mantenimiento
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Leads Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pacientes Recientes</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Paciente</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ruta IA</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cita</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.slice(0, 10).map((lead) => (
                      <tr 
                        key={lead.id} 
                        className="border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-foreground">{lead.nombre}</p>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStageColor(lead.stage)}>
                            {getStageLabel(lead.stage)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground capitalize">
                            {lead.ia_ruta_sugerida || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {lead.cita_agendada_at 
                              ? new Date(lead.cita_agendada_at).toLocaleDateString('es-CL')
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString('es-CL')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredLeads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron pacientes
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default PortalProfesional;
