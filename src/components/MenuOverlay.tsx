import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { key: 'technology', href: '#ai-module', labelEs: 'Tecnología IA', labelEn: 'AI Technology' },
  { key: 'evaluation', href: '#wizard', labelEs: 'Evaluación', labelEn: 'Evaluation' },
  { key: 'treatments', href: '#exclusivo-miro', labelEs: 'Tratamientos', labelEn: 'Treatments' },
  { key: 'testimonials', href: '#testimonials', labelEs: 'Testimonios', labelEn: 'Testimonials' },
  { key: 'contact', href: '#footer', labelEs: 'Contacto', labelEn: 'Contact' },
];

const MenuOverlay = ({ isOpen, onClose }: MenuOverlayProps) => {
  const { language, t } = useLanguage();

  const handleLinkClick = (href: string) => {
    onClose();
    // Small delay to let the menu close before scrolling
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close button */}
          <div className="absolute top-0 right-0 p-6 lg:p-12">
            <button
              onClick={onClose}
              className="caption text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <span>{t('menu.close')}</span>
              <X className="w-4 h-4" strokeWidth={1} />
            </button>
          </div>

          {/* Menu content */}
          <div className="h-full flex flex-col justify-center items-center px-6">
            <nav className="space-y-8 text-center">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                >
                  <button
                    onClick={() => handleLinkClick(item.href)}
                    className="display-large text-foreground hover:text-gold-muted transition-colors duration-300 block"
                  >
                    {language === 'es' ? item.labelEs : item.labelEn}
                  </button>
                </motion.div>
              ))}
            </nav>

            {/* Footer info */}
            <motion.div
              className="absolute bottom-12 left-0 right-0 px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="caption text-muted-foreground">
                  {t('location')}
                </p>
                <p className="caption text-gold-muted">
                  info@clinicamiro.cl
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MenuOverlay;
