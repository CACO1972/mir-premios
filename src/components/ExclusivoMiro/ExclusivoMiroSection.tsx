import { useState } from 'react';
import { motion } from 'framer-motion';
import ServiceCard from './ServiceCard';
import ServiceModal from './ServiceModal';
import { exclusivoModules, type ServiceModule } from './types';

const ExclusivoMiroSection = () => {
  const [selectedModule, setSelectedModule] = useState<ServiceModule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (module: ServiceModule) => {
    setSelectedModule(module);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedModule(null), 300);
  };

  return (
    <section
      id="exclusivo-miro"
      className="relative py-20 md:py-32 overflow-hidden"
      aria-labelledby="exclusivo-heading"
    >
      {/* Animated background accents */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl animate-subtle-float" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-gold/3 rounded-full blur-3xl animate-subtle-float" style={{ animationDelay: '-3s' }} />

      <div className="container relative">
        {/* Section Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2
            id="exclusivo-heading"
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4"
          >
            Exclusivo{' '}
            <span className="text-gradient-gold">Miró</span>
          </h2>
          <p className="text-cream-muted text-lg md:text-xl max-w-2xl mx-auto">
            Tratamientos premium diseñados con precisión, tecnología e IA
          </p>
        </motion.header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {exclusivoModules.map((module, index) => (
            <ServiceCard
              key={module.id}
              module={module}
              index={index}
              onOpenModal={handleOpenModal}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      <ServiceModal
        module={selectedModule}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};

export default ExclusivoMiroSection;