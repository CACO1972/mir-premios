import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    quote: "Por primera vez entendí mi radiografía.",
    author: "María G.",
    treatment: "Evaluación predictiva"
  },
  {
    id: 2,
    quote: "Planeé mis implantes antes de viajar.",
    author: "Carlos R.",
    treatment: "Implant One"
  },
  {
    id: 3,
    quote: "Entendí qué pasa si no uso los retenedores.",
    author: "Sofía M.",
    treatment: "ALIGN"
  }
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const normalizedDiff = ((diff + testimonials.length) % testimonials.length);
    
    if (normalizedDiff === 0) {
      return { x: 0, scale: 1, zIndex: 3, opacity: 1, rotateY: 0 };
    } else if (normalizedDiff === 1 || normalizedDiff === -2) {
      return { x: prefersReducedMotion ? 120 : 180, scale: 0.85, zIndex: 2, opacity: 0.6, rotateY: prefersReducedMotion ? 0 : -15 };
    } else {
      return { x: prefersReducedMotion ? -120 : -180, scale: 0.85, zIndex: 2, opacity: 0.6, rotateY: prefersReducedMotion ? 0 : 15 };
    }
  };

  return (
    <section
      id="testimonials"
      className="relative py-20 md:py-32 overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      <div className="container relative">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            id="testimonials-heading"
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-4"
          >
            Lo que dicen nuestros{' '}
            <span className="text-gradient-gold">pacientes</span>
          </h2>
        </motion.header>

        {/* 3D Carousel */}
        <div className="relative h-[300px] md:h-[350px] flex items-center justify-center perspective-1000">
          <div className="relative w-full max-w-md">
            <AnimatePresence mode="sync">
              {testimonials.map((testimonial, index) => {
                const style = getCardStyle(index);
                return (
                  <motion.div
                    key={testimonial.id}
                    className="absolute inset-0"
                    initial={false}
                    animate={{
                      x: style.x,
                      scale: style.scale,
                      zIndex: style.zIndex,
                      opacity: style.opacity,
                      rotateY: style.rotateY
                    }}
                    transition={{ 
                      duration: prefersReducedMotion ? 0.2 : 0.5, 
                      ease: 'easeOut' 
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="bg-card border border-border rounded-xl p-8 h-full flex flex-col justify-between shadow-xl">
                      <div>
                        <Quote className="w-8 h-8 text-gold/40 mb-4" />
                        <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed">
                          "{testimonial.quote}"
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-foreground font-medium">{testimonial.author}</p>
                        <p className="text-cream-muted text-sm">{testimonial.treatment}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 z-10 p-3 rounded-full bg-card border border-border hover:border-gold/40 transition-colors"
            aria-label="Testimonio anterior"
          >
            <ChevronLeft className="w-5 h-5 text-cream-muted" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 z-10 p-3 rounded-full bg-card border border-border hover:border-gold/40 transition-colors"
            aria-label="Siguiente testimonio"
          >
            <ChevronRight className="w-5 h-5 text-cream-muted" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-gold w-6' 
                  : 'bg-gold/30 hover:bg-gold/50'
              }`}
              aria-label={`Ir al testimonio ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
