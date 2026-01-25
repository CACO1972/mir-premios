import { motion } from 'framer-motion';
import { CheckCircle, Calendar, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardCompleteProps {
  onReset: () => void;
}

const WizardComplete = ({ onReset }: WizardCompleteProps) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hola, acabo de agendar mi evaluación premium. ¿Pueden confirmar mi cita?');
    window.open(`https://wa.me/56912345678?text=${message}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2, duration: 0.6 }}
        className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center"
      >
        <CheckCircle className="w-12 h-12 text-green-500" />
      </motion.div>

      <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
        ¡Todo listo!
      </h2>
      <p className="text-cream-muted text-lg mb-8">
        Tu evaluación premium ha sido agendada. Recibirás un email de confirmación con todos los detalles.
      </p>

      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h3 className="font-serif text-xl text-foreground mb-4">Próximos pasos</h3>
        <ul className="space-y-3 text-left">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gold text-sm font-medium">1</span>
            </div>
            <span className="text-cream-muted">
              Revisa tu email para confirmar la cita
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gold text-sm font-medium">2</span>
            </div>
            <span className="text-cream-muted">
              Trae radiografías o imágenes si las tienes
            </span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gold text-sm font-medium">3</span>
            </div>
            <span className="text-cream-muted">
              Llega 10 minutos antes de tu cita
            </span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={handleWhatsApp}
          className="bg-gradient-gold text-primary-foreground hover:opacity-90 h-12 px-6"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Confirmar por WhatsApp
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="border-gold/40 text-gold hover:bg-gold/10 hover:border-gold h-12 px-6"
        >
          <Home className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2">
        <Calendar className="w-4 h-4 text-cream-muted" />
        <span className="text-sm text-cream-muted">
          Te esperamos en Av. Providencia 1234, Santiago
        </span>
      </div>
    </motion.div>
  );
};

export default WizardComplete;
