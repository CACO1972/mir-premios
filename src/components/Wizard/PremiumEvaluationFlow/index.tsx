import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { RouteType, EvaluacionData } from '../types';
import StepProgress from './StepProgress';
import ConfirmStep from './ConfirmStep';
import PaymentStep from './PaymentStep';
import ScheduleStep from './ScheduleStep';

interface PremiumEvaluationFlowProps {
  evaluationId: string;
  evaluacionData: Partial<EvaluacionData>;
  routeType: RouteType;
  onComplete: () => void;
  onError: (error: string) => void;
}

type Step = 'confirm' | 'payment' | 'schedule';

const PremiumEvaluationFlow = ({
  evaluationId,
  evaluacionData,
  routeType,
  onComplete,
  onError,
}: PremiumEvaluationFlowProps) => {
  const [step, setStep] = useState<Step>('confirm');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [dentalinkPatientId, setDentalinkPatientId] = useState<string | null>(null);

  // Pricing based on route type
  const isExistingPatient = routeType === 'paciente_antiguo';
  const price = isExistingPatient ? 25000 : 49000;
  const priceFormatted = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);

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
        await createDentalinkPatient();
        await new Promise((resolve) => setTimeout(resolve, 1500));
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
            await createDentalinkPatient();
            await new Promise((resolve) => setTimeout(resolve, 1500));
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

  const createDentalinkPatient = async () => {
    try {
      console.log('Creating patient in Dentalink...');
      const { data, error } = await supabase.functions.invoke('dentalink-integration', {
        body: {
          action: 'create-patient',
          evaluation_id: evaluationId,
          nombre: evaluacionData.nombre,
          email: evaluacionData.email,
          telefono: evaluacionData.telefono,
          rut: evaluacionData.rut,
          fecha_nacimiento: evaluacionData.fecha_nacimiento,
        },
      });

      if (error) {
        console.error('Dentalink patient creation error:', error);
        return;
      }

      if (data?.patient_id) {
        console.log('Patient created/found with ID:', data.patient_id);
        setDentalinkPatientId(data.patient_id.toString());
      }
    } catch (err) {
      console.error('Error creating Dentalink patient:', err);
    }
  };

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
        },
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

  const handleSchedule = async (date: string, time: string) => {
    setIsProcessing(true);
    try {
      if (dentalinkPatientId) {
        // Schedule in Dentalink
        const { data, error } = await supabase.functions.invoke('dentalink-integration', {
          body: {
            action: 'schedule-appointment',
            evaluation_id: evaluationId,
            patient_id: dentalinkPatientId,
            date: date,
            time: time,
            duration_minutes: 60,
            notes: `Evaluación Premium - ${evaluacionData.motivo_consulta || 'Consulta general'}`,
          },
        });

        if (error) {
          console.error('Dentalink scheduling error:', error);
        } else {
          console.log('Appointment scheduled:', data);
        }
      } else {
        // Fallback: just update local state
        await supabase
          .from('evaluaciones')
          .update({
            estado_evaluacion: 'cita_agendada',
            cita_agendada_at: new Date().toISOString(),
          })
          .eq('id', evaluationId);
      }

      onComplete();
    } catch (err) {
      console.error('Error scheduling:', err);
      onError('Error al agendar. Por favor, intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'confirm':
        return 'Confirma tus datos para continuar';
      case 'payment':
        return 'Procesa tu pago de forma segura';
      case 'schedule':
        return '¡Listo! Agenda tu cita';
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
        <p className="text-cream-muted">{getStepDescription()}</p>
      </div>

      <StepProgress currentStep={step} />

      <div className="bg-card border border-border rounded-xl p-6 md:p-8">
        {step === 'confirm' && (
          <ConfirmStep
            evaluacionData={evaluacionData}
            routeType={routeType}
            priceFormatted={priceFormatted}
            isProcessing={isProcessing}
            onConfirm={handleConfirm}
          />
        )}

        {step === 'payment' && (
          <PaymentStep
            priceFormatted={priceFormatted}
            mpCheckoutUrl={mpCheckoutUrl}
            paymentComplete={paymentComplete}
            checkingPayment={checkingPayment}
            onOpenCheckout={handleOpenCheckout}
          />
        )}

        {step === 'schedule' && (
          <ScheduleStep
            evaluationId={evaluationId}
            patientId={dentalinkPatientId}
            rutaSugerida={evaluacionData.ruta_sugerida}
            onComplete={onComplete}
          />
        )}
      </div>
    </motion.div>
  );
};

export default PremiumEvaluationFlow;
