import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, Loader2, Shield, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { RouteType, EvaluacionData } from './types';

interface PremiumEvaluationFlowProps {
  evaluationId: string;
  evaluacionData: Partial<EvaluacionData>;
  routeType: RouteType;
  onComplete: () => void;
  onError: (error: string) => void;
}

const PremiumEvaluationFlow = ({ 
  evaluationId, 
  evaluacionData, 
  routeType,
  onComplete, 
  onError 
}: PremiumEvaluationFlowProps) => {
  const [step, setStep] = useState<'confirm' | 'payment' | 'schedule'>('confirm');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Check for payment return from MP
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const returnedEvalId = urlParams.get('evaluation_id');
    
    if (paymentStatus && returnedEvalId === evaluationId) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      if (paymentStatus === 'success') {
        setCheckingPayment(true);
        checkPaymentStatus();
      } else if (paymentStatus === 'failure') {
        onError('El pago fue rechazado. Por favor, intenta con otro método de pago.');
        setStep('payment');
      } else if (paymentStatus === 'pending') {
        setStep('payment');
      }
    }
  }, [evaluationId]);

  const checkPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluaciones')
        .select('payment_status')
        .eq('id', evaluationId)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.payment_status === 'approved') {
        setPaymentComplete(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStep('schedule');
      } else {
        // Poll a few more times in case webhook is slow
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          const { data: pollData } = await supabase
            .from('evaluaciones')
            .select('payment_status')
            .eq('id', evaluationId)
            .maybeSingle();
          
          if (pollData?.payment_status === 'approved') {
            clearInterval(pollInterval);
            setPaymentComplete(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStep('schedule');
          } else if (attempts >= 5) {
            clearInterval(pollInterval);
            setStep('payment');
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error checking payment:', err);
      setStep('payment');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Pricing based on route type
  const isExistingPatient = routeType === 'paciente_antiguo';
  const price = isExistingPatient ? 25000 : 49000;
  const priceFormatted = new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // Create Mercado Pago preference
      const { data, error } = await supabase.functions.invoke('create-mp-preference', {
        body: {
          evaluation_id: evaluationId,
          amount: price,
          description: isExistingPatient 
            ? 'Copago Evaluación Premium - Paciente Miró' 
            : 'Evaluación Premium Miró',
          payer_email: evaluacionData.email || '',
          payer_name: evaluacionData.nombre || '',
        }
      });

      if (error) throw error;
      
      if (data?.init_point) {
        setMpCheckoutUrl(data.init_point);
        setStep('payment');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      onError('Error al preparar el pago. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCheckout = () => {
    if (mpCheckoutUrl) {
      window.location.href = mpCheckoutUrl;
    }
  };

  const handleSchedule = async () => {
    setIsProcessing(true);
    try {
      // Create patient in Dentalink (placeholder)
      const dentalinkId = `dnk_${Date.now()}`;
      
      await supabase
        .from('evaluaciones')
        .update({ 
          estado_evaluacion: 'cita_agendada',
          dentalink_patient_id: dentalinkId,
          cita_agendada_at: new Date().toISOString()
        })
        .eq('id', evaluationId);

      onComplete();
    } catch (err) {
      console.error('Error scheduling:', err);
      onError('Error al agendar. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto"
    >
      <div className="text-center mb-8">
        <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-4">
          Paso 4 de 4
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
          Evaluación Premium
        </h2>
        <p className="text-cream-muted">
          {step === 'confirm' && 'Confirma tus datos para continuar'}
          {step === 'payment' && 'Procesa tu pago de forma segura'}
          {step === 'schedule' && '¡Listo! Agenda tu cita'}
        </p>
      </div>

      {/* Progress indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['confirm', 'payment', 'schedule'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s 
                ? 'bg-gold text-primary-foreground' 
                : i < ['confirm', 'payment', 'schedule'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary text-muted-foreground'
            }`}>
              {i < ['confirm', 'payment', 'schedule'].indexOf(step) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div className={`w-12 h-0.5 ${
                i < ['confirm', 'payment', 'schedule'].indexOf(step)
                  ? 'bg-green-500'
                  : 'bg-border'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 md:p-8">
        {step === 'confirm' && (
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
              onClick={handleConfirm}
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
        )}

        {step === 'payment' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {paymentComplete ? (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="font-serif text-xl text-foreground mb-2">¡Pago Exitoso!</h3>
                <p className="text-cream-muted">Tu pago ha sido procesado correctamente</p>
              </div>
            ) : checkingPayment ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
                <h3 className="font-serif text-xl text-foreground mb-2">Verificando pago...</h3>
                <p className="text-cream-muted">Estamos confirmando tu transacción</p>
              </div>
            ) : (
              <>
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
                  onClick={handleOpenCheckout}
                  disabled={!mpCheckoutUrl}
                  className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ir a Mercado Pago
                </Button>
              </>
            )}
          </motion.div>
        )}

        {step === 'schedule' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-xl text-foreground mb-2">Agenda tu Cita</h3>
              <p className="text-cream-muted">
                Selecciona el día y hora que más te acomode
              </p>
            </div>

            {/* Calendar placeholder */}
            <div className="border border-border rounded-lg p-6 text-center">
              <p className="text-cream-muted mb-4">
                Próximas horas disponibles:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Lun 10:00', 'Mar 15:00', 'Mié 11:00', 'Jue 16:00'].map((time) => (
                  <button
                    key={time}
                    className="p-3 border border-border rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-colors text-sm text-foreground"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSchedule}
              disabled={isProcessing}
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirmando cita...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Confirmar Cita
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PremiumEvaluationFlow;
