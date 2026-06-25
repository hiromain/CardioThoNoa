import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Users, Settings, Plus, Shield, UserCog, ListChecks, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

function Tab({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end} className="flex-1">
      {({ isActive }) => (
        <div className="flex flex-col items-center justify-center gap-0.5 pb-1">
          <Icon
            size={20}
            className="transition-colors"
            style={{ color: isActive ? 'var(--primary)' : 'var(--text-3)' }}
          />
          <span
            className="text-[10px] tracking-wide transition-colors"
            style={{
              color: isActive ? 'var(--primary)' : 'var(--text-3)',
              fontWeight: isActive ? 700 : 500,
            }}
          >
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const isAdmin = useAuthStore(s => s.isAdmin);

  if (isAdmin) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-20 pb-safe glass border-t border-line z-[100] flex items-center px-2 md:hidden">
        <Tab to="/admin" icon={Shield} label="Accueil" end />
        <Tab to="/admin/comptes" icon={UserCog} label="Comptes" />
        <Tab to="/admin/catalogue" icon={ListChecks} label="Catalogue" />
        <Tab to="/admin/centres" icon={Building2} label="Centres" />
        <Tab to="/parametres" icon={Settings} label="Réglages" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 pb-safe glass border-t border-line z-[100] flex items-center px-2 md:hidden">
      <Tab to="/" icon={Home} label="Accueil" end />
      <Tab to="/statistiques" icon={BarChart3} label="Stats" />

      <div className="flex-1 flex items-center justify-center">
        <div className="fab-wrap">
          <button
            type="button"
            onClick={() => navigate('/interventions/nouvelle')}
            aria-label="Nouvelle intervention"
            className="relative z-[1] w-14 h-14 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform"
            style={{ boxShadow: '0 4px 16px rgba(30,58,95,0.4)' }}
          >
            <Plus size={24} className="text-white" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <Tab to="/patients" icon={Users} label="Patients" />
      <Tab to="/parametres" icon={Settings} label="Réglages" />
    </div>
  );
}
