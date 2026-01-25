import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Globe } from 'lucide-react';

const FooterSection = () => {
  return (
    <footer className="bg-charcoal-light border-t border-border">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="font-serif text-2xl text-foreground mb-4">
              Miró
            </h3>
            <p className="text-cream-muted text-sm leading-relaxed mb-4">
              Odontología Predictiva con más de 30 años de experiencia clínica e inteligencia artificial.
            </p>
            <div className="flex items-center gap-2 text-sm text-cream-muted">
              <Globe className="w-4 h-4" />
              <select 
                className="bg-transparent border-none text-cream-muted cursor-pointer hover:text-gold transition-colors"
                defaultValue="es"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h4 className="font-serif text-lg text-foreground mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-cream-muted">
                <MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                <span>Av. Providencia 1234, Of. 501<br />Providencia, Santiago</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-cream-muted">
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <a href="tel:+56223456789" className="hover:text-gold transition-colors">
                  +56 2 2345 6789
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-cream-muted">
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <a href="mailto:contacto@clinicamiro.cl" className="hover:text-gold transition-colors">
                  contacto@clinicamiro.cl
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-cream-muted">
                <Clock className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                <span>Lun - Vie: 9:00 - 19:00<br />Sáb: 9:00 - 14:00</span>
              </li>
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h4 className="font-serif text-lg text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#privacy" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#consent" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  Consentimiento Informado Digital
                </a>
              </li>
              <li>
                <a href="#terms" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  Términos de Uso
                </a>
              </li>
              <li>
                <a href="#cookies" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  Política de Cookies
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <h4 className="font-serif text-lg text-foreground mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li>
                <a href="#implant-one" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  Implant One
                </a>
              </li>
              <li>
                <a href="#revive" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  Revive FACE.SMILE™
                </a>
              </li>
              <li>
                <a href="#align" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  ALIGN
                </a>
              </li>
              <li>
                <a href="#zero-caries" className="text-sm text-cream-muted hover:text-gold transition-colors">
                  ZERO CARIES
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Clínica Dental Miró. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Desarrollado con IA por Miró Odontología Predictiva
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
