import { useState } from 'react';
import { SplashPage } from '@/components/SplashPage';
import EditorialHeader from '@/components/EditorialHeader';
import MenuOverlay from '@/components/MenuOverlay';
import { 
  EditorialHero, 
  PhilosophySection, 
  ApproachSection, 
  VisionSection,
  EditorialDivider 
} from '@/components/Editorial';
import { AIModuleSection } from '@/components/AIModule';
import { WizardSection } from '@/components/Wizard';
import { ExclusivoMiroSection } from '@/components/ExclusivoMiro';
import { TestimonialsSection } from '@/components/Testimonials';
import { AccreditationSection } from '@/components/Accreditation';
import { FooterSection } from '@/components/Footer';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background scrollbar-hide">
      {showSplash && (
        <SplashPage onComplete={() => setShowSplash(false)} />
      )}
      
      {!showSplash && (
        <>
          {/* Editorial Header */}
          <EditorialHeader onMenuOpen={() => setMenuOpen(true)} />
          
          {/* Menu Overlay */}
          <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

          {/* Editorial Hero - Institutional Declaration */}
          <EditorialHero />

          {/* Philosophy Section */}
          <PhilosophySection />

          {/* Editorial Divider */}
          <EditorialDivider />

          {/* Approach Section */}
          <ApproachSection />

          {/* Vision Section */}
          <VisionSection />

          {/* AI Module - Scanner functionality */}
          <AIModuleSection />
          
          {/* Wizard - Evaluation flow */}
          <WizardSection />
          
          {/* Exclusivo Miro - Premium treatments */}
          <ExclusivoMiroSection />
          
          {/* Testimonials */}
          <TestimonialsSection />
          
          {/* Accreditation */}
          <AccreditationSection />
          
          {/* Footer */}
          <FooterSection />
        </>
      )}
    </main>
  );
};

export default Index;
