import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { RutaSugerida, EvaluacionData } from './types';

interface IAScreeningStepProps {
  evaluationId: string;
  evaluacionData: Partial<EvaluacionData>;
  onComplete: (rutaSugerida: RutaSugerida, resumen: string) => void;
  onError: (error: string) => void;
}

const analysisSteps = [
  'Analizando cuestionario clínico...',
  'Procesando información médica...',
  'Evaluando factores de riesgo...',
  'Generando recomendación personalizada...'
];

const IAScreeningStep = ({ evaluationId, evaluacionData, onComplete, onError }: IAScreeningStepProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        // Simulate AI analysis steps
        for (let i = 0; i < analysisSteps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1200));
          setCurrentStep(i + 1);
        }

        // Determine route based on questionnaire (simplified logic)
        const motivo = evaluacionData.motivo_consulta?.toLowerCase() || '';
        const cuestionario = evaluacionData.cuestionario_clinico as Record<string, string> | undefined;
        
        let rutaSugerida: RutaSugerida = 'caries';
        let resumen = '';

        if (motivo.includes('implante') || motivo.includes('falta') || motivo.includes('perdi')) {
          rutaSugerida = 'implantes';
          resumen = 'Basándonos en tu consulta sobre pérdida dental, te recomendamos explorar nuestro programa Implant One que integra diagnóstico, planificación y ejecución con tecnología IA.';
        } else if (motivo.includes('ortodoncia') || motivo.includes('alinea') || motivo.includes('dientes torcidos')) {
          rutaSugerida = 'ortodoncia';
          resumen = 'Tu caso sugiere una evaluación ortodóncica. Nuestro programa ALIGN analiza tu caso con IA para determinar el mejor enfoque entre alineadores o ortodoncia convencional.';
        } else if (motivo.includes('bruxismo') || motivo.includes('rechina') || motivo.includes('aprieto')) {
          rutaSugerida = 'bruxismo';
          resumen = 'Los síntomas que describes sugieren bruxismo. Nuestro protocolo evalúa el desgaste dental y su relación con patrones de sueño para un plan de protección integral.';
        } else {
          rutaSugerida = 'caries';
          resumen = 'Te recomendamos iniciar con nuestro programa ZERO CARIES que incluye diagnóstico asistido por IA para detectar problemas antes de que causen dolor.';
        }

        // If dolor is intense, prioritize accordingly
        if (cuestionario?.dolor_actual === 'intenso') {
          resumen = 'Detectamos que tienes dolor intenso. ' + resumen + ' Tu caso será priorizado para atención rápida.';
        }

        // Update evaluation in database
        await supabase
          .from('evaluaciones')
          .update({
            ruta_sugerida: rutaSugerida,
            resumen_ia: resumen,
            estado_evaluacion: 'ia_analizada',
            analisis_ia: {
              timestamp: new Date().toISOString(),
              version: '1.0',
              factores_considerados: ['motivo_consulta', 'dolor_actual', 'ultima_visita']
            }
          })
          .eq('id', evaluationId);

        setIsComplete(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        onComplete(rutaSugerida, resumen);
      } catch (err) {
        console.error('Error in AI analysis:', err);
        onError('Error en el análisis. Por favor, intenta de nuevo.');
      }
    };

    runAnalysis();
  }, [evaluationId, evaluacionData, onComplete, onError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto text-center"
    >
      <div className="mb-8">
        <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-4">
          Paso 2 de 4
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
          Analizando tu caso
        </h2>
        <p className="text-cream-muted">
          Nuestra IA está evaluando la información para recomendarte la mejor ruta
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 mb-8">
        <motion.div
          animate={{ 
            scale: isComplete ? 1 : [1, 1.1, 1],
            rotate: isComplete ? 0 : [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: isComplete ? 0 : Infinity,
            ease: 'easeInOut'
          }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center"
        >
          {isComplete ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <Brain className="w-10 h-10 text-gold" />
          )}
        </motion.div>

        <div className="space-y-3">
          {analysisSteps.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index < currentStep ? 1 : index === currentStep ? 0.6 : 0.3,
                x: 0
              }}
              transition={{ delay: index * 0.3, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : index === currentStep ? (
                <Loader2 className="w-5 h-5 text-gold animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-border flex-shrink-0" />
              )}
              <span className={`text-sm ${index < currentStep ? 'text-foreground' : 'text-cream-muted'}`}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Este proceso toma solo unos segundos...
      </p>
    </motion.div>
  );
};

export default IAScreeningStep;
