import { motion } from 'framer-motion';
import { FileText, Calendar, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Evaluacion {
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

interface EvaluacionesTabProps {
  evaluaciones: Evaluacion[];
  isLoading: boolean;
}

const getEstadoConfig = (estado: string) => {
  const configs: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    'iniciada': { label: 'Iniciada', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
    'cuestionario_completado': { label: 'Cuestionario completado', variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> },
    'ia_analizada': { label: 'Análisis IA listo', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    'pago_pendiente': { label: 'Pago pendiente', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
    'pago_completado': { label: 'Pagado', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    'cita_agendada': { label: 'Cita agendada', variant: 'default', icon: <Calendar className="h-3 w-3" /> },
    'completada': { label: 'Completada', variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> },
    'cancelada': { label: 'Cancelada', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
  };
  return configs[estado] || { label: estado, variant: 'outline' as const, icon: null };
};

const getRutaLabel = (ruta: string | null) => {
  if (!ruta) return 'General';
  const labels: Record<string, string> = {
    'implantes': 'Implant One',
    'ortodoncia': 'OrtoPro',
    'caries': 'Cero Caries',
    'bruxismo': 'Bruxismo-Sueño',
    'estetica': 'Estética Dental',
    'dentofacial': 'Revive FACE.SMILE™'
  };
  return labels[ruta] || ruta;
};

const EvaluacionesTab = ({ evaluaciones, isLoading }: EvaluacionesTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (evaluaciones.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Sin evaluaciones</h3>
          <p className="text-muted-foreground mb-4">
            Aún no tienes evaluaciones registradas
          </p>
          <Button variant="outline">
            Iniciar evaluación
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {evaluaciones.map((evaluacion, index) => {
        const estadoConfig = getEstadoConfig(evaluacion.estado_evaluacion);
        
        return (
          <motion.div
            key={evaluacion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:border-gold/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gold" />
                      {getRutaLabel(evaluacion.ruta_sugerida)}
                    </CardTitle>
                    <CardDescription>
                      {new Date(evaluacion.created_at).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={estadoConfig.variant} className="flex items-center gap-1">
                    {estadoConfig.icon}
                    {estadoConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {evaluacion.resumen_ia ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {evaluacion.resumen_ia}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        Tipo: {evaluacion.tipo_ruta.replace('_', ' ')}
                      </span>
                      <Button variant="ghost" size="sm" className="text-gold hover:text-gold/80">
                        Ver detalle
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Análisis IA pendiente
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default EvaluacionesTab;
