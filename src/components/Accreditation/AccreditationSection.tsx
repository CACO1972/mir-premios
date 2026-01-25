import { motion } from 'framer-motion';
import { Shield, FileText, Lightbulb } from 'lucide-react';

const blocks = [
  {
    icon: Shield,
    title: 'Superintendencia',
    keywords: ['Prestador acreditado', 'Fiscalización vigente']
  },
  {
    icon: FileText,
    title: 'Protección de Datos',
    keywords: ['Ficha clínica segura', 'Consentimiento digital']
  },
  {
    icon: Lightbulb,
    title: 'Actualización Científica',
    keywords: ['Propiedad intelectual', 'Formación continua']
  }
];

const AccreditationSection = () => {
  return (
    <section
      id="accreditation"
      className="relative py-16 md:py-24 bg-charcoal-light/50"
      aria-labelledby="accreditation-heading"
    >
      <div className="container">
        <motion.h2
          id="accreditation-heading"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="sr-only"
        >
          Acreditación y Cumplimiento
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blocks.map((block, index) => (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start gap-4 p-6 rounded-lg bg-card/50 border border-border/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <block.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  {block.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {block.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="text-xs text-cream-muted bg-secondary/50 px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AccreditationSection;
