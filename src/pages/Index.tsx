import { useState } from 'react';
import { SplashPage } from '@/components/SplashPage';
import HeroSection from '@/components/Hero/HeroSection';
import { AIModuleSection } from '@/components/AIModule';
import { WizardSection } from '@/components/Wizard';
import { ExclusivoMiroSection } from '@/components/ExclusivoMiro';
import { TestimonialsSection } from '@/components/Testimonials';
import { AccreditationSection } from '@/components/Accreditation';
import { FooterSection } from '@/components/Footer';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <main className="min-h-screen bg-background">
      {showSplash && (
        <SplashPage onComplete={() => setShowSplash(false)} />
      )}
      
      {!showSplash && (
        <>
          <HeroSection />
          <AIModuleSection />
          <WizardSection />
          <ExclusivoMiroSection />
          <TestimonialsSection />
          <AccreditationSection />
          <FooterSection />
        </>
      )}
    </main>
  );
};

export default Index;
