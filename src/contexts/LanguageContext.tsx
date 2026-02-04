import { createContext, useContext, useState, ReactNode } from "react";

type Language = "es" | "en";

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

const translations: Translations = {
  // Menu
  "menu.open": { es: "MENÚ", en: "MENU" },
  "menu.close": { es: "CERRAR", en: "CLOSE" },
  
  // Hero
  "hero.headline": { es: "Odontología Predictiva", en: "Predictive Dentistry" },
  "hero.subline": { es: "Clarity before treatment", en: "Clarity before treatment" },
  
  // Philosophy section
  "philosophy.caption": { es: "NUESTRA FILOSOFÍA", en: "OUR PHILOSOPHY" },
  "philosophy.headline": { es: "Prevenir es precisión.", en: "Prevention is precision." },
  "philosophy.p1": {
    es: "La odontología tradicional espera los problemas. Nosotros elegimos un camino diferente. A través de imágenes avanzadas e inteligencia artificial, leemos las señales que tu sonrisa envía antes de que aparezcan los síntomas.",
    en: "Traditional dentistry waits for problems. We choose a different path. Through advanced imaging and artificial intelligence, we read the signals your smile sends before symptoms appear."
  },
  "philosophy.p2": {
    es: "Cada examen se convierte en una conversación entre tecnología y experiencia humana. Cada diagnóstico, una ventana hacia tu futuro dental.",
    en: "Every exam becomes a conversation between technology and human expertise. Every diagnosis, a window into your dental future."
  },
  "philosophy.p3": {
    es: "Esto no es innovación por sí misma. Es cuidado, redefinido.",
    en: "This isn't innovation for its own sake. It's care, redefined."
  },
  
  // Approach section
  "approach.caption": { es: "EL ENFOQUE", en: "THE APPROACH" },
  "approach.headline": {
    es: "Vemos lo que permanece invisible para la práctica convencional. Nuestra tecnología mapea trayectorias, no solo condiciones.",
    en: "We see what remains invisible to conventional practice. Our technology maps trajectories, not just conditions."
  },
  "approach.step1": {
    es: "Imágenes tridimensionales que capturan la arquitectura completa de tu salud oral.",
    en: "Three-dimensional images capturing the complete architecture of your oral health."
  },
  "approach.step2": {
    es: "Algoritmos predictivos que analizan patrones invisibles al ojo humano.",
    en: "Predictive algorithms analyzing patterns invisible to the human eye."
  },
  "approach.step3": {
    es: "Protocolos de prevención diseñados para tu biología única.",
    en: "Prevention protocols designed for your unique biology."
  },
  
  // Vision section
  "vision.headline": {
    es: "El futuro de la salud dental comienza con previsión.",
    en: "The future of dental health begins with foresight."
  },
  "vision.subline": {
    es: "En un mundo que se mueve rápido, nos tomamos el tiempo de mirar hacia adelante. Tu sonrisa no merece menos que certeza.",
    en: "In a fast-moving world, we take the time to look ahead. Your smile deserves nothing less than certainty."
  },
  
  // CTA
  "cta.headline": { es: "¿Listo para comenzar?", en: "Ready to begin?" },
  "cta.button": { es: "COMENZAR EVALUACIÓN", en: "START EVALUATION" },
  
  // Footer
  "footer.tagline": { es: "Odontología Predictiva", en: "Predictive Dentistry" },
  "location": { es: "Santiago, Chile", en: "Santiago, Chile" },
  
  // AI Module
  "ai.caption": { es: "TECNOLOGÍA IA", en: "AI TECHNOLOGY" },
  "ai.headline": { es: "Análisis Predictivo", en: "Predictive Analysis" },
  "ai.description": {
    es: "Nuestra inteligencia artificial detecta patrones y riesgos antes de que se conviertan en problemas.",
    en: "Our artificial intelligence detects patterns and risks before they become problems."
  },
  
  // Wizard
  "wizard.caption": { es: "TU EVALUACIÓN", en: "YOUR EVALUATION" },
  "wizard.headline": { es: "Comienza tu camino", en: "Begin your journey" },
  
  // Exclusivo Miro
  "exclusivo.caption": { es: "EXCLUSIVO MIRÓ", en: "EXCLUSIVE MIRÓ" },
  "exclusivo.headline": { es: "Tratamientos Premium", en: "Premium Treatments" },
  
  // Testimonials
  "testimonials.caption": { es: "TESTIMONIOS", en: "TESTIMONIALS" },
  "testimonials.headline": { es: "Lo que dicen nuestros pacientes", en: "What our patients say" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("es");

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
