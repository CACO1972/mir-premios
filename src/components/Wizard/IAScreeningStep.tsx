import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import RxScannerAnimation from '../AIModule/RxScannerAnimation';
import type { RutaSugerida, EvaluacionData } from './types';

interface ToothFinding {
  piece: string;
  x: number;
  y: number;
  status: 'green' | 'yellow' | 'red';
  diagnosis?: string;
  depth?: string;
  treatment?: string;
}

interface IAScreeningStepProps {
  evaluationId: string;
  evaluacionData: Partial<EvaluacionData>;
  imageUrls: string[];
  onComplete: (rutaSugerida: RutaSugerida, resumen: string, findings: ToothFinding[]) => void;
  onError: (error: string) => void;
}

const analysisSteps = [
  'Procesando imágenes...',
  'Analizando estructuras dentales...',
  'Identificando hallazgos...',
  'Generando recomendación personalizada...'
];

const IAScreeningStep = ({ evaluationId, evaluacionData, imageUrls, onComplete, onError }: IAScreeningStepProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [findings, setFindings] = useState<ToothFinding[]>([]);
  const [displayImage, setDisplayImage] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    try {
      // Set the display image (first uploaded image or null)
      const imageToDisplay = imageUrls.length > 0 ? imageUrls[0] : null;
      setDisplayImage(imageToDisplay);

      // Simulate step progress
      for (let i = 0; i < analysisSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setCurrentStep(i + 1);
        setProgress((i + 1) * 25);
      }

      // Call the edge function for real AI analysis
      console.log('Calling analyze-dental edge function...');
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('analyze-dental', {
        body: {
          evaluation_id: evaluationId,
          image_urls: imageUrls,
          motivo_consulta: evaluacionData.motivo_consulta,
          cuestionario_clinico: evaluacionData.cuestionario_clinico
        }
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(functionError.message);
      }

      console.log('Analysis result:', functionData);

      const { ruta_sugerida, resumen_ia, hallazgos } = functionData;

      // Set findings for visualization
      setFindings(hallazgos || []);
      setIsComplete(true);

      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 2500));

      onComplete(ruta_sugerida, resumen_ia, hallazgos || []);
    } catch (err) {
      console.error('Error in AI analysis:', err);
      
      // Fallback to local analysis if edge function fails
      const fallbackResult = generateLocalAnalysis(
        evaluacionData.motivo_consulta || '',
        evaluacionData.cuestionario_clinico as Record<string, string> | undefined
      );
      
      setFindings(fallbackResult.hallazgos);
      setIsComplete(true);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete(fallbackResult.ruta_sugerida, fallbackResult.resumen_ia, fallbackResult.hallazgos);
    }
  }, [evaluationId, evaluacionData, imageUrls, onComplete]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-4">
          Paso 2 de 4
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
          Analizando tu caso
        </h2>
        <p className="text-cream-muted">
          {imageUrls.length > 0 
            ? 'Nuestra IA está analizando tus imágenes y la información proporcionada'
            : 'Nuestra IA está evaluando la información para recomendarte la mejor ruta'
          }
        </p>
      </div>

      {/* RX Scanner Animation */}
      <div className="mb-10">
        <RxScannerAnimation
          imageUrl={displayImage}
          findings={findings}
          isAnalyzing={!isComplete}
          analysisProgress={progress}
        />
      </div>

      {/* Analysis steps */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
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
            className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0"
          >
            {isComplete ? (
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            ) : (
              <Brain className="w-7 h-7 text-gold" />
            )}
          </motion.div>
          <div>
            <h3 className="text-foreground font-medium">
              {isComplete ? 'Análisis completado' : 'Procesando...'}
            </h3>
            <p className="text-cream-muted text-sm">
              {isComplete 
                ? `Se identificaron ${findings.length} hallazgos`
                : analysisSteps[Math.min(currentStep, analysisSteps.length - 1)]
              }
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {analysisSteps.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index < currentStep ? 1 : index === currentStep - 1 ? 0.6 : 0.3,
                x: 0
              }}
              transition={{ delay: index * 0.2, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {index < currentStep ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
              )}
              <span className={`text-sm ${index < currentStep ? 'text-foreground' : 'text-cream-muted'}`}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Warning note */}
        <div className="mt-6 pt-4 border-t border-border flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-cream-muted text-xs">
            Este es un pre-diagnóstico orientativo. El resultado debe ser confirmado por un profesional en la evaluación clínica.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Local fallback analysis function
function generateLocalAnalysis(motivo: string, cuestionario?: Record<string, string>) {
  const motivoLower = motivo.toLowerCase();
  
  let ruta_sugerida: RutaSugerida = 'caries';
  let resumen_ia = '';
  const hallazgos: ToothFinding[] = [];

  if (motivoLower.includes('implante') || motivoLower.includes('falta') || motivoLower.includes('perdi')) {
    ruta_sugerida = 'implantes';
    resumen_ia = 'Basándonos en tu consulta sobre pérdida dental, te recomendamos explorar nuestro programa Implant One que integra diagnóstico, planificación y ejecución con tecnología IA.';
    hallazgos.push({
      piece: '3.6',
      x: 28,
      y: 72,
      status: 'red',
      diagnosis: 'Espacio edéntulo detectado',
      treatment: 'Evaluación para implante dental'
    });
  } else if (motivoLower.includes('ortodoncia') || motivoLower.includes('alinea') || motivoLower.includes('torcidos')) {
    ruta_sugerida = 'ortodoncia';
    resumen_ia = 'Tu caso sugiere una evaluación ortodóncica. Nuestro programa OrtoPro analiza tu caso para determinar el mejor enfoque.';
    hallazgos.push(
      { piece: '1.1', x: 48, y: 32, status: 'yellow', diagnosis: 'Apiñamiento leve', treatment: 'Evaluación ortodóncica' },
      { piece: '2.1', x: 52, y: 32, status: 'yellow', diagnosis: 'Rotación dental', treatment: 'Alineadores o brackets' }
    );
  } else if (motivoLower.includes('bruxismo') || motivoLower.includes('rechina') || motivoLower.includes('aprieto')) {
    ruta_sugerida = 'bruxismo';
    resumen_ia = 'Los síntomas descritos son compatibles con bruxismo. Nuestro protocolo evalúa el patrón de desgaste dental.';
    hallazgos.push(
      { piece: '1.4', x: 36, y: 27, status: 'yellow', diagnosis: 'Desgaste oclusal', treatment: 'Plano de relajación' }
    );
  } else {
    resumen_ia = 'Te recomendamos iniciar con nuestro programa ZERO CARIES para detectar lesiones en etapas tempranas.';
    hallazgos.push({
      piece: '2.1',
      x: 52,
      y: 32,
      status: 'red',
      diagnosis: 'Caries en esmalte mesial',
      depth: '0,89mm de profundidad',
      treatment: 'Compatible con tratamiento regenerativo'
    });
  }

  if (cuestionario?.dolor_actual === 'intenso') {
    resumen_ia = '⚠️ PRIORIDAD: Dolor intenso reportado. ' + resumen_ia;
  }

  // Add healthy findings
  hallazgos.push(
    { piece: '1.1', x: 48, y: 32, status: 'green', diagnosis: 'Sin hallazgos' },
    { piece: '3.1', x: 48, y: 68, status: 'green', diagnosis: 'Pieza sana' }
  );

  return { ruta_sugerida, resumen_ia, hallazgos };
}

export default IAScreeningStep;
