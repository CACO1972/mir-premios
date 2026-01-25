import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SplashPageProps {
  onComplete: () => void;
}

const SplashPage = ({ onComplete }: SplashPageProps) => {
  const [isActivated, setIsActivated] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleActivate = () => {
    setIsActivated(true);
    
    // Phase transitions
    setTimeout(() => setCurrentPhase(1), 1200);
    setTimeout(() => setCurrentPhase(2), 2400);
    setTimeout(() => setCurrentPhase(3), 3600);
    setTimeout(() => onComplete(), 4500);
  };

  const phrases = [
    "De apagar incendios a prevenir problemas.",
    "30 años de experiencia + IA para potenciar nuestros tratamientos.",
    "Miró Odontología Predictiva"
  ];

  // Skip animation if reduced motion preferred
  if (prefersReducedMotion) {
    return (
      <section className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="font-serif text-3xl md:text-5xl text-foreground mb-4">
            Miró <span className="text-gradient-gold">Odontología Predictiva</span>
          </h1>
          <p className="text-cream-muted mb-8">30 años de experiencia + IA</p>
          <Button
            onClick={onComplete}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90"
          >
            Continuar
          </Button>
        </div>
      </section>
    );
  }

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-50 bg-background overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]"
            animate={isActivated ? { scale: [1, 1.5, 1], opacity: [0.05, 0.15, 0.05] } : {}}
            transition={{ duration: 3, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-600/5 rounded-full blur-[80px]"
            animate={isActivated ? { scale: [1, 1.3, 1], opacity: [0.03, 0.1, 0.03] } : {}}
            transition={{ duration: 2.5, delay: 0.3, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative h-full flex items-center justify-center">
          {!isActivated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center px-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8"
              >
                <h2 className="font-serif text-2xl md:text-4xl text-foreground mb-2">
                  Miró
                </h2>
                <p className="text-cream-muted text-sm tracking-widest uppercase">
                  Odontología Predictiva
                </p>
              </motion.div>

              <Button
                onClick={handleActivate}
                size="lg"
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-medium h-14 px-8 gap-3"
              >
                <Play className="w-5 h-5" />
                <span>Ver teaser</span>
                <Volume2 className="w-4 h-4 opacity-60" />
              </Button>

              <p className="mt-4 text-xs text-muted-foreground">
                Click para iniciar con sonido
              </p>
            </motion.div>
          ) : (
            <div className="text-center px-6 max-w-3xl">
              <AnimatePresence mode="wait">
                {currentPhase <= 2 && (
                  <motion.p
                    key={currentPhase}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className={`font-serif text-xl md:text-3xl lg:text-4xl leading-relaxed ${
                      currentPhase === 2 ? 'text-gradient-gold' : 'text-foreground'
                    }`}
                  >
                    {phrases[currentPhase]}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Progress indicator */}
              <motion.div
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gold/30"
                    animate={{
                      backgroundColor: currentPhase >= i ? 'hsl(43 74% 49%)' : 'hsl(43 74% 49% / 0.3)',
                      scale: currentPhase === i ? 1.3 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
};

export default SplashPage;
