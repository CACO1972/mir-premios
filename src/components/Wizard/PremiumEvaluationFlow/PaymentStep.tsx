import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Loader2, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentStepProps {
  priceFormatted: string;
  mpCheckoutUrl: string | null;
  paymentComplete: boolean;
  checkingPayment: boolean;
  onOpenCheckout: () => void;
}

const PaymentStep = ({
  priceFormatted,
  mpCheckoutUrl,
  paymentComplete,
  checkingPayment,
  onOpenCheckout,
}: PaymentStepProps) => {
  if (paymentComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
          <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
        </motion.div>
        <h3 className="font-serif text-xl text-foreground mb-2">¡Pago Exitoso!</h3>
        <p className="text-cream-muted">Tu pago ha sido procesado correctamente</p>
      </div>
    </motion.div>
    );
  }

  if (checkingPayment) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <h3 className="font-serif text-xl text-foreground mb-2">Verificando pago...</h3>
          <p className="text-cream-muted">Estamos confirmando tu transacción</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-gold" />
        </div>
        <p className="text-cream-muted">
          Serás redirigido a Mercado Pago para completar tu pago de forma segura
        </p>
      </div>

      <div className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
        <span className="text-foreground">Total a pagar</span>
        <span className="font-serif text-xl text-gold">{priceFormatted}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
        <Shield className="w-4 h-4" />
        <span>Pago 100% seguro con Mercado Pago</span>
      </div>

      <Button
        onClick={onOpenCheckout}
        disabled={!mpCheckoutUrl}
        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Ir a Mercado Pago
      </Button>
    </motion.div>
  );
};

export default PaymentStep;
