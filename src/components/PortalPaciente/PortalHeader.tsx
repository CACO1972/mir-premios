import { useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PortalHeaderProps {
  title?: string;
}

const PortalHeader = ({ title = "Portal Paciente" }: PortalHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <span className="font-serif text-xl text-foreground tracking-tight">
              M<span className="text-gold-muted">iró</span>
            </span>
          </button>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Inicio
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
