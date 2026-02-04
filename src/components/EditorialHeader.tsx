import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

interface EditorialHeaderProps {
  onMenuOpen: () => void;
}

const EditorialHeader = ({ onMenuOpen }: EditorialHeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="font-serif text-xl md:text-2xl text-foreground tracking-tight">
              M<span className="text-gold-muted">iró</span>
            </span>
          </Link>

          {/* Navigation controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="caption text-muted-foreground hover:text-foreground transition-colors"
            >
              {language === 'es' ? 'EN' : 'ES'}
            </button>
            <button
              onClick={toggleTheme}
              className="caption text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === 'light' ? 'NIGHT' : 'DAY'}
            </button>
            <button
              onClick={onMenuOpen}
              className="caption text-muted-foreground hover:text-gold transition-colors duration-300"
            >
              {t('menu.open')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default EditorialHeader;
