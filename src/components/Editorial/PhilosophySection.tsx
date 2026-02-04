import { useLanguage } from '@/contexts/LanguageContext';

const PhilosophySection = () => {
  const { t } = useLanguage();

  return (
    <section id="philosophy" className="py-section px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="lg:sticky lg:top-32">
            <p className="caption text-muted-foreground mb-6">
              {t('philosophy.caption')}
            </p>
            <h2 className="display-large text-foreground">
              {t('philosophy.headline')}
            </h2>
          </div>
          <div className="space-y-12 lg:pt-24">
            <p className="body-large text-muted-foreground">
              {t('philosophy.p1')}
            </p>
            <p className="body-large text-muted-foreground">
              {t('philosophy.p2')}
            </p>
            <p className="body-large text-foreground font-medium">
              {t('philosophy.p3')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;
