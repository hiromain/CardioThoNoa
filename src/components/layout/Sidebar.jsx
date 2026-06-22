import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Users, Settings, Plus, Calendar, Shield } from 'lucide-react';
import { useData, useCurrentSemester } from '../../store/hooks';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';

function SidebarItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end} className="block">
      {({ isActive }) => (
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
          style={{
            backgroundColor: isActive ? 'rgba(30,58,95,0.10)' : 'transparent',
            color: isActive ? 'var(--primary)' : 'var(--text-2)',
          }}
        >
          <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-sm font-medium">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const data = useData();
  const currentSemester = useCurrentSemester();
  const syncStatus = useStore(s => s.syncStatus);
  const user = useAuthStore(s => s.user);
  const isAdmin = useAuthStore(s => s.isAdmin);

  const syncDotColor =
    syncStatus === 'idle' ? '#27AE60' :
    syncStatus === 'syncing' || syncStatus === 'pending' ? '#60AEFE' :
    '#C0392B';

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 z-50 glass border-r border-line">
      <div className="px-5 pt-7 pb-5 border-b border-line">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            <span className="text-white text-[11px] font-bold tracking-wider">CT</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text-1)' }}>
              CardioThoNoa
            </p>
            <p className="text-[11px] leading-tight" style={{ color: 'var(--text-3)' }}>
              Formation CTCV
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        <SidebarItem to="/" icon={Home} label="Accueil" end />
        <SidebarItem to="/semestres" icon={Calendar} label="Semestres" />
        <SidebarItem to="/statistiques" icon={BarChart3} label="Statistiques" />
        <SidebarItem to="/patients" icon={Users} label="Patients" />
        <SidebarItem to="/parametres" icon={Settings} label="Réglages" />
        {isAdmin && <SidebarItem to="/admin" icon={Shield} label="Administration" />}
      </nav>

      <div className="px-3 py-3 border-t border-line">
        <div className="flex items-center gap-2.5">
          <div
            className="shrink-0 flex items-center justify-center rounded-full text-white text-sm font-bold"
            style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            {data.profile?.initiales || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
              {data.profile?.prenom && data.profile?.nom
                ? `${data.profile.prenom} ${data.profile.nom}`
                : data.profile?.prenom || data.profile?.nom || ''}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
              {user?.email}
            </p>
          </div>
          <div
            className="shrink-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: syncDotColor }}
          />
        </div>
      </div>

      <div className="p-4 border-t border-line">
        <button
          type="button"
          onClick={() => navigate('/interventions/nouvelle')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'var(--primary)',
            boxShadow: '0 4px 14px rgba(30,58,95,0.35)',
          }}
        >
          <Plus size={17} strokeWidth={2.5} />
          Nouvelle intervention
        </button>
      </div>
    </aside>
  );
}
