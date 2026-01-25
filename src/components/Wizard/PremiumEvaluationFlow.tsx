import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, Loader2, Shield, Info } from 'lucide-react';
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
      await supabase
        .from('evaluaciones')
        .update({ estado_evaluacion: 'pago_pendiente' })
        .eq('id', evaluationId);
      
      setStep('payment');
    } catch (err) {
      console.error('Error updating evaluation:', err);
      onError('Error al procesar. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate payment processing (Mercado Pago integration placeholder)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentId = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await supabase
        .from('evaluaciones')
        .update({ 
          payment_status: 'approved',
          payment_id: paymentId,
          monto_pagado: price,
          estado_evaluacion: 'pago_completado'
        })
        .eq('id', evaluationId);

      setPaymentComplete(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('schedule');
    } catch (err) {
      console.error('Error processing payment:', err);
      onError('Error en el pago. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
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
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 h-12"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar {priceFormatted}
                    </>
                  )}
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
