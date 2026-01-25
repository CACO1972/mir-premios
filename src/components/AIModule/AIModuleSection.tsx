import { motion } from 'framer-motion';
import { MapPin, MessageCircle, GitBranch } from 'lucide-react';

const modules = [
  {
    icon: MapPin,
    title: 'Mapa de Riesgo',
    description: 'Tus radiografías se convierten en un mapa simple: piezas en verde, amarillo o rojo según su riesgo. Lo vemos juntos en pantalla.',
    color: 'from-green-500/20 via-yellow-500/20 to-red-500/20'
  },
  {
    icon: MessageCircle,
    title: 'Explicación',
    description: 'La IA marca zonas de riesgo. El dentista las revisa y te explica con palabras simples qué significa cada color.',
    color: 'from-gold/20 to-gold/5'
  },
  {
    icon: GitBranch,
    title: 'Decisión',
    description: 'No damos órdenes. Te mostramos opciones con sus ventajas y riesgos, y eliges junto al equipo qué camino seguir.',
    color: 'from-teal-500/20 to-teal-500/5'
  }
];

const AIModuleSection = () => {
  return (
    <section
      id="ai-module"
      className="relative py-20 md:py-32 overflow-hidden"
      aria-labelledby="ai-module-heading"
    >
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      
      <div className="container relative">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2
            id="ai-module-heading"
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-4"
          >
            Cómo usamos la{' '}
            <span className="text-gradient-gold">IA</span>{' '}
            en tu caso
          </h2>
          <p className="text-cream-muted text-lg max-w-2xl mx-auto">
            Tecnología al servicio de decisiones claras y tranquilas
          </p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {modules.map((module, index) => (
            <motion.article
              key={module.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative"
            >
              <div className="relative h-full bg-card border border-border rounded-xl p-6 md:p-8 overflow-hidden transition-all duration-300 hover:border-gold/30">
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
                    <module.icon className="w-6 h-6 text-gold" />
                  </div>
                  
                  <h3 className="font-serif text-xl md:text-2xl text-foreground mb-3">
                    {module.title}
                  </h3>
                  
                  <p className="text-cream-muted leading-relaxed">
                    {module.description}
                  </p>
                </div>

                {/* Number indicator */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center">
                  <span className="text-gold text-sm font-medium">{index + 1}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIModuleSection;
