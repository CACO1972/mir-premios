import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle2, CalendarPlus, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Cita {
  id: string;
  cita_agendada_at: string | null;
  ia_ruta_sugerida: string | null;
  stage: string;
  nombre: string;
}

interface CitasTabProps {
  citas: Cita[];
  isLoading: boolean;
}

const getRutaLabel = (ruta: string | null) => {
  if (!ruta) return 'Consulta General';
  const labels: Record<string, string> = {
    'implantes': 'Evaluación Implant One',
    'ortodoncia': 'Evaluación OrtoPro',
    'caries': 'Evaluación Cero Caries',
    'bruxismo': 'Evaluación Bruxismo-Sueño',
    'estetica': 'Evaluación Estética Dental',
    'dentofacial': 'Evaluación Revive FACE.SMILE™'
  };
  return labels[ruta] || 'Consulta General';
};

const getScheduleLink = (ruta: string | null) => {
  const links: Record<string, string> = {
    'ortodoncia': 'https://ff.healthatom.io/QVVP56',
    'implantes': 'https://ff.healthatom.io/v68xCg',
    'estetica': 'https://ff.healthatom.io/L4ngYV',
    'dentofacial': 'https://ff.healthatom.io/L4ngYV',
    'caries': 'https://ff.healthatom.io/TA6eA1',
    'bruxismo': 'https://ff.healthatom.io/TA6eA1',
  };
  return links[ruta || ''] || 'https://ff.healthatom.io/TA6eA1';
};

const CitasTab = ({ citas, isLoading }: CitasTabProps) => {
  const citasAgendadas = citas.filter(c => c.cita_agendada_at && c.stage === 'SCHEDULED');
  const citasPendientes = citas.filter(c => c.stage === 'PAID' && !c.cita_agendada_at);
  const citasCompletadas = citas.filter(c => c.stage === 'COMPLETED');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Próximas Citas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              Próximas citas
            </CardTitle>
            <CardDescription>
              Tus citas programadas con el equipo de Clínica Miró
            </CardDescription>
          </CardHeader>
          <CardContent>
            {citasAgendadas.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-muted-foreground mb-4">No tienes citas programadas</p>
                  {citasPendientes.length > 0 && (
                    <Button 
                      className="bg-gold hover:bg-gold/90 text-background"
                      onClick={() => {
                        const pending = citasPendientes[0];
                        window.open(getScheduleLink(pending.ia_ruta_sugerida), '_blank');
                      }}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Agendar mi cita
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {citasAgendadas.map((cita, index) => (
                  <motion.div
                    key={cita.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gold/20 bg-gold/5"
                  >
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gold/10 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gold">
                        {cita.cita_agendada_at 
                          ? new Date(cita.cita_agendada_at).getDate()
                          : '-'
                        }
                      </span>
                      <span className="text-xs text-gold uppercase">
                        {cita.cita_agendada_at 
                          ? new Date(cita.cita_agendada_at).toLocaleDateString('es-CL', { month: 'short' })
                          : ''
                        }
                      </span>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-foreground">
                        {getRutaLabel(cita.ia_ruta_sugerida)}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cita.cita_agendada_at 
                            ? new Date(cita.cita_agendada_at).toLocaleTimeString('es-CL', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : 'Por confirmar'
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Clínica Miró
                        </span>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-gold/20 text-gold border-gold/30">
                      Confirmada
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pendientes de Agendar */}
      {citasPendientes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                Pendientes de agendar
              </CardTitle>
              <CardDescription>
                Tienes evaluaciones pagadas que requieren agendar cita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {citasPendientes.map((cita) => (
                  <div 
                    key={cita.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border"
                  >
                    <div>
                      <p className="font-medium">{getRutaLabel(cita.ia_ruta_sugerida)}</p>
                      <p className="text-sm text-muted-foreground">Pago confirmado - Pendiente agendar</p>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-gold hover:bg-gold/90 text-background"
                      onClick={() => window.open(getScheduleLink(cita.ia_ruta_sugerida), '_blank')}
                    >
                      Agendar
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Citas Completadas */}
      {citasCompletadas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5" />
                Historial de citas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {citasCompletadas.map((cita) => (
                  <div 
                    key={cita.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-muted-foreground">{getRutaLabel(cita.ia_ruta_sugerida)}</p>
                      <p className="text-sm text-muted-foreground">
                        {cita.cita_agendada_at 
                          ? new Date(cita.cita_agendada_at).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Fecha no disponible'
                        }
                      </p>
                    </div>
                    <Badge variant="secondary">Completada</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default CitasTab;
