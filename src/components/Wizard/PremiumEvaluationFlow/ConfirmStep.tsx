import { motion } from 'framer-motion';
import { Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EvaluacionData, RouteType } from '../types';

interface ConfirmStepProps {
  evaluacionData: Partial<EvaluacionData>;
  routeType: RouteType;
  priceFormatted: string;
  isProcessing: boolean;
  onConfirm: () => void;
}

const ConfirmStep = ({
  evaluacionData,
  routeType,
  priceFormatted,
  isProcessing,
  onConfirm,
}: ConfirmStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <span className="text-cream-muted">Nombre</span>
          <span className="text-foreground font-medium">{evaluacionData.nombre}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <span className="text-cream-muted">Email</span>
          <span className="text-foreground font-medium">{evaluacionData.email}</span>
        </div>
        {evaluacionData.telefono && (
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-cream-muted">Teléfono</span>
            <span className="text-foreground font-medium">{evaluacionData.telefono}</span>
          </div>
        )}
        <div className="flex justify-between items-center pb-3 border-b border-border">
          <span className="text-cream-muted">Tipo</span>
          <span className="text-foreground font-medium capitalize">
            {routeType.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="bg-gold/5 border border-gold/20 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-foreground font-medium">Evaluación Premium</span>
          <span className="font-serif text-2xl text-gold">{priceFormatted}</span>
        </div>
        <p className="text-sm text-cream-muted flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Este monto se abona íntegramente a tu tratamiento futuro
        </p>
      </div>

      <Button
        onClick={onConfirm}
        disabled={isProcessing}
        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          'Confirmar y Continuar al Pago'
        )}
      </Button>
    </motion.div>
  );
};

export default ConfirmStep;
