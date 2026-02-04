import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const EditorialHero = () => {
  const { t } = useLanguage();

  const scrollToNext = () => {
    const philosophySection = document.querySelector('#philosophy');
    if (philosophySection) {
      philosophySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-[100svh] md:min-h-[110svh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 bg-background relative">
      <div className="max-w-7xl mx-auto w-full text-center px-2">
        {/* Primary headline - maximum visual authority */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <h1 className="display-institutional text-foreground relative inline-block leading-[0.95]">
            {t('hero.headline')}
            {/* Subtle gold underline accent */}
            <span
              className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-px bg-gradient-to-r from-transparent via-gold-muted/50 to-transparent"
              style={{ animation: 'fadeIn 1.5s ease-out 1s forwards', opacity: 0 }}
            />
          </h1>
        </div>

        {/* Subheadline - clearly separated, deliberate reading */}
        <div className="mt-12 sm:mt-16 lg:mt-32 animate-slide-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
          <p className="text-xs sm:text-sm font-light text-muted-foreground/70 tracking-[0.2em] sm:tracking-[0.25em] uppercase">
            {t('hero.subline')}
          </p>
        </div>
      </div>

      {/* Minimal scroll indicator */}
      <button 
        onClick={scrollToNext}
        className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 animate-fade-in cursor-pointer hover:opacity-70 transition-opacity" 
        style={{ animationDelay: '1.5s', animationFillMode: 'both' }}
        aria-label="Scroll to next section"
      >
        <ChevronDown className="w-4 h-4 text-muted-foreground/30 animate-gentle-bounce" strokeWidth={1} />
      </button>
    </section>
  );
};

export default EditorialHero;
