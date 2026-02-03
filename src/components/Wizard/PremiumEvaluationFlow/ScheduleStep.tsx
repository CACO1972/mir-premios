import { motion } from 'framer-motion';
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RutaSugerida } from '../types';

// Booking links by route type
const BOOKING_LINKS: Record<string, string> = {
  ortodoncia: 'https://ff.healthatom.io/QVVP56',
  implantes: 'https://ff.healthatom.io/v68xCg',
  dentofacial: 'https://ff.healthatom.io/L4ngYV',
  estetica: 'https://ff.healthatom.io/L4ngYV',
  caries: 'https://ff.healthatom.io/TA6eA1',
  bruxismo: 'https://ff.healthatom.io/TA6eA1',
  general: 'https://ff.healthatom.io/TA6eA1',
};

interface ScheduleStepProps {
  evaluationId: string;
  patientId: string | null;
  rutaSugerida?: RutaSugerida | null;
  onComplete: () => void;
}

const ScheduleStep = ({
  rutaSugerida,
  onComplete,
}: ScheduleStepProps) => {
  const bookingLink = rutaSugerida 
    ? BOOKING_LINKS[rutaSugerida] || BOOKING_LINKS.general
    : BOOKING_LINKS.general;

  const getRouteLabel = () => {
    switch (rutaSugerida) {
      case 'ortodoncia': return 'Ortodoncia';
      case 'implantes': return 'Implantes';
      case 'caries': return 'Caries / Curodont';
      case 'bruxismo': return 'Bruxismo / General';
      default: return 'Consulta General';
    }
  };

  const handleOpenBooking = () => {
    window.open(bookingLink, '_blank');
    // Mark as complete after opening
    setTimeout(() => onComplete(), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-gold" />
        </div>
        <h3 className="font-serif text-xl text-foreground mb-2">¡Agenda tu Cita!</h3>
        <p className="text-cream-muted">
          Tu evaluación premium está lista. Ahora agenda tu cita con nuestro especialista.
        </p>
      </div>

      {/* Route info */}
      <div className="bg-secondary/50 rounded-lg p-4 text-center">
        <p className="text-sm text-cream-muted mb-1">Servicio recomendado:</p>
        <p className="text-foreground font-medium">{getRouteLabel()}</p>
      </div>

      <Button
        onClick={handleOpenBooking}
        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Agendar Cita
        <ExternalLink className="w-4 h-4 ml-2" />
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Serás redirigido a nuestra plataforma de agendamiento
      </p>
    </motion.div>
  );
};

export default ScheduleStep;
