import { motion } from 'framer-motion';
import { ArrowRight, Calendar, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { routeKeyToModule } from '@/components/ExclusivoMiro';

interface WizardStep6Props {
  routeKey: 'implants' | 'dentofacial' | 'ortho' | 'caries';
}

const WizardStep6 = ({ routeKey }: WizardStep6Props) => {
  const recommendedModule = routeKeyToModule[routeKey];

  if (!recommendedModule) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró una ruta recomendada.</p>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola, completé el cuestionario y me recomendaron ${recommendedModule.name}. Me gustaría más información.`);
    window.open(`https://wa.me/34600000000?text=${message}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto text-center"
    >
      {/* Step indicator */}
      <div className="mb-8">
        <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium">
          Paso 6 de 6
        </span>
      </div>

      {/* Title */}
      <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
        Tu Ruta Recomendada
      </h2>
      <p className="text-cream-muted mb-10">
        Basándonos en tus respuestas, te recomendamos:
      </p>

      {/* Recommended Module Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-8 mb-8 relative overflow-hidden"
      >
        {/* Gold accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold" />
        <div className="absolute top-4 right-4 w-24 h-24 bg-gold/10 rounded-full blur-2xl" />

        <div className="relative">
          <ArrowRight className="w-8 h-8 text-gold mx-auto mb-4" />
          
          <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
            {recommendedModule.name}
          </h3>
          
          {recommendedModule.tagline && (
            <p className="text-gold text-sm font-medium tracking-wide mb-4">
              {recommendedModule.tagline}
            </p>
          )}
          
          <p className="text-cream-muted leading-relaxed max-w-md mx-auto">
            {recommendedModule.modalCopy}
          </p>

          {recommendedModule.disclaimer && (
            <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <span className="text-gold">*</span>
              <span>{recommendedModule.disclaimer}</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-medium h-12 px-8">
          <Calendar className="w-4 h-4 mr-2" />
          Agendar Cita
        </Button>
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="border-gold/40 text-gold hover:bg-gold/10 hover:border-gold font-medium h-12 px-8"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Consultar por WhatsApp
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default WizardStep6;