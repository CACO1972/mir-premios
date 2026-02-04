import { useLanguage } from '@/contexts/LanguageContext';

const VisionSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-section px-6 lg:px-12 bg-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="display-large text-foreground">
            {t('vision.headline')}
          </h2>
          <p className="body-large text-muted-foreground max-w-2xl mx-auto">
            {t('vision.subline')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;
