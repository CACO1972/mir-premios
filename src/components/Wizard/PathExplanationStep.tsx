import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RutaSugerida } from './types';
import { rutaExplanations } from './types';

interface PathExplanationStepProps {
  rutaSugerida: RutaSugerida;
  resumenIA: string;
  onContinue: () => void;
}

const PathExplanationStep = ({ rutaSugerida, resumenIA, onContinue }: PathExplanationStepProps) => {
  const explanation = rutaExplanations[rutaSugerida];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-4">
          Paso 3 de 4
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
          Tu Ruta Recomendada
        </h2>
      </div>

      {/* Main recommendation card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-6 md:p-8 mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
        <div className="absolute top-4 right-4 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />

        <div className="relative">
          <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
            {explanation.title}
          </h3>
          <p className="text-cream-muted leading-relaxed mb-6">
            {explanation.description}
          </p>

          <div className="space-y-3">
            {explanation.features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-secondary/50 border border-border rounded-lg p-4 mb-6"
      >
        <p className="text-cream-muted text-sm leading-relaxed">
          {resumenIA}
        </p>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-start gap-3 p-4 bg-gold/5 border border-gold/20 rounded-lg mb-8"
      >
        <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
        <p className="text-sm text-cream-muted">
          Este es un <strong>prediagnóstico orientativo</strong>. Para confirmarlo y diseñar tu plan definitivo, el siguiente paso es tu evaluación premium con nuestro equipo clínico.
        </p>
      </motion.div>

      <Button
        onClick={onContinue}
        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
      >
        Continuar a Evaluación Premium
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};

export default PathExplanationStep;
