import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import rxImage from '@/assets/rx-panoramica.png';

interface ToothMarker {
  id: string;
  x: number;
  y: number;
  status: 'green' | 'yellow' | 'red';
  delay: number;
  diagnosis?: string;
  depth?: string;
  treatment?: string;
}

interface ToothFinding {
  piece: string;
  x: number;
  y: number;
  status: 'green' | 'yellow' | 'red';
  diagnosis?: string;
  depth?: string;
  treatment?: string;
}

interface RxScannerAnimationProps {
  imageUrl?: string | null;
  findings?: ToothFinding[];
  isAnalyzing?: boolean;
  analysisProgress?: number;
  onScanComplete?: () => void;
}

const defaultMarkers: ToothMarker[] = [
  { id: '1.1', x: 48, y: 32, status: 'green', delay: 0.2 },
  { id: '1.2', x: 44, y: 30, status: 'green', delay: 0.3 },
  { id: '1.3', x: 40, y: 28, status: 'yellow', delay: 0.4 },
  { id: '2.1', x: 52, y: 32, status: 'red', delay: 0.5 },
  { id: '2.2', x: 56, y: 30, status: 'green', delay: 0.6 },
  { id: '3.1', x: 48, y: 68, status: 'green', delay: 0.7 },
  { id: '4.1', x: 52, y: 68, status: 'green', delay: 0.8 },
];

const RxScannerAnimation = ({ 
  imageUrl, 
  findings, 
  isAnalyzing = false,
  analysisProgress = 0,
  onScanComplete 
}: RxScannerAnimationProps) => {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'marking' | 'result'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [showMarkers, setShowMarkers] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<ToothFinding | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const hasCompletedRef = useRef(false);

  // Convert findings to markers
  const markers: ToothMarker[] = findings?.length 
    ? findings.map((f, i) => ({
        id: f.piece,
        x: f.x,
        y: f.y,
        status: f.status,
        delay: 0.1 + (i * 0.15),
        diagnosis: f.diagnosis,
        depth: f.depth,
        treatment: f.treatment
      }))
    : defaultMarkers;

  // Find the first red (critical) finding for display
  const criticalFinding = findings?.find(f => f.status === 'red') || findings?.[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Respond to external analysis state
  useEffect(() => {
    if (isAnalyzing) {
      setPhase('scanning');
      setScanProgress(analysisProgress);
      setShowMarkers(false);
      setShowResult(false);
      hasCompletedRef.current = false;
    }
  }, [isAnalyzing, analysisProgress]);

  // When analysis completes (findings arrive)
  useEffect(() => {
    if (findings && findings.length > 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      
      // Complete scan
      setScanProgress(100);
      
      // Show markers
      setTimeout(() => {
        setPhase('marking');
        setShowMarkers(true);
      }, prefersReducedMotion ? 100 : 500);

      // Show result
      setTimeout(() => {
        setPhase('result');
        setShowResult(true);
        if (criticalFinding) {
          setSelectedFinding(criticalFinding);
        }
        onScanComplete?.();
      }, prefersReducedMotion ? 200 : 2000);
    }
  }, [findings, prefersReducedMotion, criticalFinding, onScanComplete]);

  // Auto-run demo animation when no external control
  useEffect(() => {
    if (findings || isAnalyzing) return; // Skip if externally controlled

    const startAnimation = () => {
      setPhase('scanning');
      setScanProgress(0);
      setShowMarkers(false);
      setShowResult(false);

      const scanDuration = prefersReducedMotion ? 0 : 2500;
      const scanInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(scanInterval);
            return 100;
          }
          return prev + 2;
        });
      }, scanDuration / 50);

      setTimeout(() => {
        setPhase('marking');
        setShowMarkers(true);
      }, prefersReducedMotion ? 100 : scanDuration);

      setTimeout(() => {
        setPhase('result');
        setShowResult(true);
        setSelectedFinding({
          piece: '2.1',
          x: 52,
          y: 32,
          status: 'red',
          diagnosis: 'Caries en esmalte mesial',
          depth: '0,89mm de profundidad',
          treatment: 'Compatible con tratamiento regenerativo'
        });
      }, prefersReducedMotion ? 200 : scanDuration + 2000);

      setTimeout(startAnimation, prefersReducedMotion ? 8000 : 12000);
    };

    const timeout = setTimeout(startAnimation, 1000);
    return () => clearTimeout(timeout);
  }, [findings, isAnalyzing, prefersReducedMotion]);

  const getStatusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-emerald-500 shadow-emerald-500/50';
      case 'yellow': return 'bg-amber-500 shadow-amber-500/50';
      case 'red': return 'bg-red-500 shadow-red-500/50';
    }
  };

  const getStatusRingColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'border-emerald-500/50';
      case 'yellow': return 'border-amber-500/50';
      case 'red': return 'border-red-500/50';
    }
  };

  const displayImage = imageUrl || rxImage;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* RX Container */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm">
        <div className="relative aspect-[16/9] md:aspect-[2/1]">
          <img
            src={displayImage}
            alt="Radiografía panorámica dental"
            className="w-full h-full object-cover opacity-90"
          />
          
          {/* Scanner overlay */}
          <AnimatePresence>
            {phase === 'scanning' && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
                  style={{ 
                    top: `${scanProgress}%`,
                    boxShadow: '0 0 20px 10px rgba(212, 175, 55, 0.3)'
                  }}
                />
                <motion.div
                  className="absolute left-0 right-0 h-32 bg-gradient-to-b from-gold/10 to-transparent"
                  style={{ top: `${Math.max(0, scanProgress - 15)}%` }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid overlay during scan */}
          <AnimatePresence>
            {phase === 'scanning' && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
            )}
          </AnimatePresence>

          {/* Tooth markers */}
          <AnimatePresence>
            {showMarkers && markers.map((marker) => (
              <motion.div
                key={marker.id}
                className="absolute cursor-pointer group"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: prefersReducedMotion ? 0 : marker.delay,
                  type: 'spring',
                  stiffness: 500,
                  damping: 25
                }}
                onClick={() => {
                  if (marker.diagnosis) {
                    setSelectedFinding({
                      piece: marker.id,
                      x: marker.x,
                      y: marker.y,
                      status: marker.status,
                      diagnosis: marker.diagnosis,
                      depth: marker.depth,
                      treatment: marker.treatment
                    });
                    setShowResult(true);
                  }
                }}
              >
                {/* Pulse ring for red markers */}
                {marker.status === 'red' && !prefersReducedMotion && (
                  <motion.div
                    className={`absolute -inset-2 rounded-full border-2 ${getStatusRingColor(marker.status)}`}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                
                {/* Marker dot */}
                <div
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${getStatusColor(marker.status)} shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-125`}
                />
                
                {/* Marker label */}
                <motion.div
                  className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                  animate={{ x: 0 }}
                >
                  <span className="text-[10px] md:text-xs text-gold font-mono bg-card/90 px-1.5 py-0.5 rounded border border-gold/20">
                    {marker.id}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Status indicator */}
          <AnimatePresence>
            {phase === 'scanning' && (
              <motion.div
                className="absolute top-4 left-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gold/30"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <motion.div
                  className="w-2 h-2 bg-gold rounded-full"
                  animate={prefersReducedMotion ? {} : { opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="text-gold text-sm font-medium">Analizando...</span>
                <span className="text-cream-muted text-sm">{Math.round(scanProgress)}%</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === 'result' && (
              <motion.div
                className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-emerald-500/30"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-emerald-400 text-sm font-medium">Análisis completado</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Analysis Result Card */}
      <AnimatePresence>
        {showResult && selectedFinding && (
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] md:w-[80%]"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-card/95 backdrop-blur-md border border-gold/30 rounded-xl p-4 md:p-6 shadow-2xl shadow-gold/10">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${
                  selectedFinding.status === 'red' 
                    ? 'bg-red-500/20 border-red-500/30' 
                    : selectedFinding.status === 'yellow'
                    ? 'bg-amber-500/20 border-amber-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/30'
                } border flex items-center justify-center`}>
                  <span className={`font-serif font-bold ${
                    selectedFinding.status === 'red' 
                      ? 'text-red-400' 
                      : selectedFinding.status === 'yellow'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>{selectedFinding.piece}</span>
                </div>
                <div>
                  <h4 className="text-foreground font-medium">
                    {selectedFinding.status === 'red' ? 'Hallazgo detectado' : 
                     selectedFinding.status === 'yellow' ? 'Observación' : 'Sin hallazgos'}
                  </h4>
                  <p className="text-cream-muted text-sm">Pieza {selectedFinding.piece}</p>
                </div>
              </div>

              <div className="space-y-2 pl-13">
                {selectedFinding.diagnosis && (
                  <motion.div
                    className="flex items-start gap-2"
                    initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-gold">•</span>
                    <p className="text-foreground text-sm md:text-base">{selectedFinding.diagnosis}</p>
                  </motion.div>
                )}
                
                {selectedFinding.depth && (
                  <motion.div
                    className="flex items-start gap-2"
                    initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <span className="text-gold">•</span>
                    <p className="text-cream-muted text-sm md:text-base">{selectedFinding.depth}</p>
                  </motion.div>
                )}
                
                {selectedFinding.treatment && (
                  <motion.div
                    className="flex items-start gap-2"
                    initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <span className="text-emerald-500">✓</span>
                    <p className="text-emerald-400 text-sm md:text-base font-medium">{selectedFinding.treatment}</p>
                  </motion.div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-cream-muted text-xs">Análisis IA v2.0</span>
                <span className="text-gold/60 text-xs">Revisión clínica pendiente</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <motion.div
        className="flex items-center justify-center gap-6 mt-20 md:mt-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-cream-muted text-sm">Sin riesgo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-cream-muted text-sm">Monitorear</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-cream-muted text-sm">Atención</span>
        </div>
      </motion.div>
    </div>
  );
};

export default RxScannerAnimation;
