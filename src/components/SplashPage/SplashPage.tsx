import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface SplashPageProps {
  onComplete: () => void;
}

const SplashPage = ({ onComplete }: SplashPageProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Auto-play video on mount
  useEffect(() => {
    if (videoRef.current && !prefersReducedMotion) {
      videoRef.current.play().catch(console.error);
    }
  }, [prefersReducedMotion]);

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

  // Skip animation if reduced motion preferred - go directly to main content
  if (prefersReducedMotion) {
    return (
      <section className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="font-serif text-3xl md:text-5xl text-foreground mb-4">
            Miró <span className="text-gradient-gold">Odontología Predictiva</span>
          </h1>
          <p className="text-muted-foreground mb-8">30 años de experiencia + IA</p>
          <button
            onClick={onComplete}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90 px-6 py-3 rounded-lg font-medium"
          >
            Continuar
          </button>
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
        {/* Video element - auto plays */}
        <video
          ref={videoRef}
          src="/videos/teaser-miro.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted={isMuted}
          onEnded={handleVideoEnd}
        />

        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 pointer-events-none" />

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
            className="p-3 rounded-full bg-background/20 backdrop-blur-sm border border-border/20 text-foreground hover:bg-background/40 transition-colors"
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
            className="px-6 py-3 rounded-full bg-background/20 backdrop-blur-sm border border-border/20 text-foreground text-sm font-medium hover:bg-background/40 transition-colors"
          >
            Saltar
          </button>
        </motion.div>
      </motion.section>
    </AnimatePresence>
  );
};

export default SplashPage;
