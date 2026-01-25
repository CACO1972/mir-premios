import { motion } from 'framer-motion';
import { UserPlus, User, MessageSquare, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RouteType } from './types';

interface WizardEntryProps {
  onSelectRoute: (route: RouteType) => void;
}

const routeOptions = [
  {
    type: 'paciente_nuevo' as RouteType,
    icon: UserPlus,
    label: 'Paciente nuevo',
    description: 'Primera visita en Miró'
  },
  {
    type: 'paciente_antiguo' as RouteType,
    icon: User,
    label: 'Paciente antiguo',
    description: 'Ya me atendí antes'
  },
  {
    type: 'segunda_opinion' as RouteType,
    icon: MessageSquare,
    label: 'Segunda opinión',
    description: 'Consulta desde otra clínica'
  },
  {
    type: 'internacional' as RouteType,
    icon: Globe,
    label: 'Región o extranjero',
    description: 'Vivo fuera de Santiago'
  }
];

const WizardEntry = ({ onSelectRoute }: WizardEntryProps) => {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
          ¡Empecemos!
        </h2>
        <p className="text-cream-muted text-lg mb-10">
          ¿Eres paciente nuevo, antiguo, segunda opinión o región?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {routeOptions.map((option, index) => (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Button
                onClick={() => onSelectRoute(option.type)}
                variant="outline"
                className="w-full h-auto p-6 flex flex-col items-center gap-3 border-border hover:border-gold/50 hover:bg-gold/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <option.icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <span className="block font-serif text-lg text-foreground">
                    {option.label}
                  </span>
                  <span className="block text-sm text-cream-muted mt-1">
                    {option.description}
                  </span>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default WizardEntry;
