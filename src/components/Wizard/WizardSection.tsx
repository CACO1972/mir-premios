import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import WizardEntry from './WizardEntry';
import QuestionnaireStep from './QuestionnaireStep';
import IAScreeningStep from './IAScreeningStep';
import PathExplanationStep from './PathExplanationStep';
import PremiumEvaluationFlow from './PremiumEvaluationFlow';
import ExistingPatientFlow from './ExistingPatientFlow';
import WizardComplete from './WizardComplete';
import type { RouteType, RutaSugerida, EvaluacionData, WizardState } from './types';
import { initialWizardState } from './types';

interface ToothFinding {
  piece: string;
  x: number;
  y: number;
  status: 'green' | 'yellow' | 'red';
  diagnosis?: string;
  depth?: string;
  treatment?: string;
}

interface ExtendedWizardState extends WizardState {
  imageUrls: string[];
  findings: ToothFinding[];
}

const initialExtendedState: ExtendedWizardState = {
  ...initialWizardState,
  imageUrls: [],
  findings: []
};

const WizardSection = () => {
  const [state, setState] = useState<ExtendedWizardState>(initialExtendedState);

  const handleSelectRoute = useCallback((route: RouteType) => {
    setState(prev => ({ ...prev, routeType: route, currentStep: 1 }));
  }, []);

  const handleQuestionnaireComplete = useCallback((evaluationId: string, data: Partial<EvaluacionData>, imageUrls: string[]) => {
    setState(prev => ({ 
      ...prev, 
      evaluationId, 
      evaluacionData: data,
      imageUrls,
      currentStep: 2 
    }));
  }, []);

  const handleIAComplete = useCallback((rutaSugerida: RutaSugerida, resumen: string, findings: ToothFinding[]) => {
    setState(prev => ({ 
      ...prev, 
      rutaSugerida, 
      resumenIA: resumen,
      findings,
      currentStep: 3 
    }));
  }, []);

  const handlePathContinue = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 4 }));
  }, []);

  const handlePremiumComplete = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 5 }));
  }, []);

  const handleExistingPatientTreatment = useCallback((evaluationId: string, data: Partial<EvaluacionData>) => {
    setState(prev => ({ 
      ...prev, 
      evaluationId, 
      evaluacionData: data,
      currentStep: 4
    }));
  }, []);

  const handleControlOnly = useCallback(() => {
    window.open('https://wa.me/56912345678?text=Hola, soy paciente Miró y quiero agendar un control', '_blank');
  }, []);

  const handleBack = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 0, routeType: null }));
  }, []);

  const handleError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error }));
    setTimeout(() => setState(prev => ({ ...prev, error: null })), 5000);
  }, []);

  const handleReset = useCallback(() => {
    setState(initialExtendedState);
    document.getElementById('wizard')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const renderStep = () => {
    // Existing patient flow
    if (state.routeType === 'paciente_antiguo' && state.currentStep === 1) {
      return (
        <ExistingPatientFlow
          onStartTreatment={handleExistingPatientTreatment}
          onControlOnly={handleControlOnly}
          onBack={handleBack}
          onError={handleError}
        />
      );
    }

    // Segunda opinion and internacional
    if ((state.routeType === 'segunda_opinion' || state.routeType === 'internacional') && state.currentStep === 1) {
      return (
        <QuestionnaireStep
          routeType={state.routeType}
          onComplete={handleQuestionnaireComplete}
          onError={handleError}
        />
      );
    }

    switch (state.currentStep) {
      case 0:
        return <WizardEntry onSelectRoute={handleSelectRoute} />;
      
      case 1:
        return (
          <QuestionnaireStep
            routeType={state.routeType!}
            onComplete={handleQuestionnaireComplete}
            onError={handleError}
          />
        );
      
      case 2:
        return (
          <IAScreeningStep
            evaluationId={state.evaluationId!}
            evaluacionData={state.evaluacionData}
            imageUrls={state.imageUrls}
            onComplete={handleIAComplete}
            onError={handleError}
          />
        );
      
      case 3:
        return (
          <PathExplanationStep
            rutaSugerida={state.rutaSugerida!}
            resumenIA={state.resumenIA!}
            onContinue={handlePathContinue}
          />
        );
      
      case 4:
        return (
          <PremiumEvaluationFlow
            evaluationId={state.evaluationId!}
            evaluacionData={state.evaluacionData}
            routeType={state.routeType!}
            onComplete={handlePremiumComplete}
            onError={handleError}
          />
        );
      
      case 5:
        return <WizardComplete onReset={handleReset} />;
      
      default:
        return <WizardEntry onSelectRoute={handleSelectRoute} />;
    }
  };

  return (
    <section
      id="wizard"
      className="relative py-20 md:py-32 overflow-hidden"
      aria-labelledby="wizard-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-charcoal-light/30 to-transparent" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gold/3 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-teal-600/3 rounded-full blur-[80px]" />

      <div className="container relative">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            id="wizard-heading"
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-4"
          >
            Tu <span className="text-gradient-gold">Copiloto</span> Dental
          </h2>
          <p className="text-cream-muted text-lg max-w-xl mx-auto">
            Te guiamos paso a paso hacia el tratamiento ideal para ti
          </p>
        </motion.header>

        {/* Error message */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-destructive text-sm">{state.error}</p>
          </motion.div>
        )}

        {/* Wizard content */}
        <div className="bg-card/50 border border-border rounded-2xl p-6 md:p-10">
          {renderStep()}
        </div>
      </div>
    </section>
  );
};

export default WizardSection;
