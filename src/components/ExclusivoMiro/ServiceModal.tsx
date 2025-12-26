import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ServiceModule } from './types';

interface ServiceModalProps {
  module: ServiceModule | null;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceModal = ({ module, isOpen, onClose }: ServiceModalProps) => {
  if (!module) return null;

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola, me interesa información sobre ${module.name}`);
    window.open(`https://wa.me/34600000000?text=${message}`, '_blank');
  };

  const handleAgendar = () => {
    // For now, scroll to a booking section or open a booking URL
    window.open('#agendar', '_self');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-border">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
                
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 id="modal-title" className="font-serif text-2xl md:text-3xl text-foreground pr-10">
                  {module.name}
                </h2>
                {module.tagline && (
                  <p className="mt-1 text-gold text-sm font-medium tracking-wide">
                    {module.tagline}
                  </p>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <p className="text-cream-muted leading-relaxed">
                  {module.modalCopy}
                </p>

                {module.disclaimer && (
                  <p className="mt-4 text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-gold text-sm leading-none">*</span>
                    <span>{module.disclaimer}</span>
                  </p>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAgendar}
                  className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-medium h-12"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Cita
                </Button>
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="flex-1 border-gold/40 text-gold hover:bg-gold/10 hover:border-gold font-medium h-12"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ServiceModal;