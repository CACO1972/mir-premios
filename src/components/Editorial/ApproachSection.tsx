import { useLanguage } from '@/contexts/LanguageContext';

const ApproachSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-section px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <p className="caption text-muted-foreground mb-6">
            {t('approach.caption')}
          </p>
          <h2 className="display-medium text-foreground mb-16">
            {t('approach.headline')}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16 pt-8">
          <div className="space-y-4">
            <p className="body-small text-foreground">01</p>
            <p className="body-large text-muted-foreground">
              {t('approach.step1')}
            </p>
          </div>
          <div className="space-y-4">
            <p className="body-small text-foreground">02</p>
            <p className="body-large text-muted-foreground">
              {t('approach.step2')}
            </p>
          </div>
          <div className="space-y-4">
            <p className="body-small text-foreground">03</p>
            <p className="body-large text-muted-foreground">
              {t('approach.step3')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApproachSection;
