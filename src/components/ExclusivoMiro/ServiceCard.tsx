import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ServiceModule } from './types';

interface ServiceCardProps {
  module: ServiceModule;
  index: number;
  onOpenModal: (module: ServiceModule) => void;
}

const ServiceCard = ({ module, index, onOpenModal }: ServiceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative aspect-[4/5] overflow-hidden rounded-lg cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onClick={() => onOpenModal(module)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenModal(module)}
      aria-label={`Ver más sobre ${module.name}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-charcoal-light to-charcoal" />
      
      {/* Subtle animated accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl animate-pulse-gold" />
      
      {/* Content container */}
      <div className="relative h-full flex flex-col justify-end p-6">
        {/* Service name */}
        <div className="mb-auto pt-4">
          <h3 className="font-serif text-2xl md:text-3xl text-foreground tracking-tight">
            {module.name}
          </h3>
          {module.tagline && (
            <p className="mt-2 text-sm text-gold font-medium tracking-wide">
              {module.tagline}
            </p>
          )}
        </div>

        {/* Fade overlay with text - appears on hover/tap */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/90 to-charcoal/70 flex items-end p-6"
        >
          <p className="text-cream-muted text-sm md:text-base leading-relaxed line-clamp-3">
            {module.fadeText}
          </p>
        </motion.div>

        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-gold"
          initial={{ width: 0 }}
          animate={{ width: isHovered ? '100%' : '30%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg border border-gold/0 pointer-events-none"
        animate={{ borderColor: isHovered ? 'hsl(43 74% 49% / 0.4)' : 'hsl(43 74% 49% / 0)' }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  );
};

export default ServiceCard;