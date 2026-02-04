import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SplashPageProps {
  onComplete: () => void;
}

const SplashPage = ({ onComplete }: SplashPageProps) => {
  const [isActivated, setIsActivated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleActivate = () => {
    setIsActivated(true);
    
    // Start video playback
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleVideoEnd = () => {
    onComplete();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onComplete();
  };

  // Skip animation if reduced motion preferred
  if (prefersReducedMotion) {
    return (
      <section className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="font-serif text-3xl md:text-5xl text-foreground mb-4">
            Miró <span className="text-gradient-gold">Odontología Predictiva</span>
          </h1>
          <p className="text-muted-foreground mb-8">30 años de experiencia + IA</p>
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
        {/* Video element (hidden until activated) */}
        <video
          ref={videoRef}
          src="/videos/teaser-miro.mp4"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isActivated ? 'opacity-100' : 'opacity-0'
          }`}
          playsInline
          onEnded={handleVideoEnd}
        />

        {/* Overlay gradient for better text readability when video plays */}
        {isActivated && (
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 pointer-events-none" />
        )}

        {/* Animated background (only when not activated) */}
        {!isActivated && (
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]"
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-600/5 rounded-full blur-[80px]"
            />
          </div>
        )}

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
                <p className="text-muted-foreground text-sm tracking-widest uppercase">
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
            <>
              {/* Controls overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10"
              >
                {/* Mute toggle */}
                <button
                  onClick={toggleMute}
                  className="p-3 rounded-full bg-background/20 backdrop-blur-sm border border-white/10 text-foreground hover:bg-background/40 transition-colors"
                  aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                {/* Skip button */}
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-full bg-background/20 backdrop-blur-sm border border-white/10 text-foreground text-sm font-medium hover:bg-background/40 transition-colors"
                >
                  Saltar
                </button>
              </motion.div>
            </>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
};

export default SplashPage;
