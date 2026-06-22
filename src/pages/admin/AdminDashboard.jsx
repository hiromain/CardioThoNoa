import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Activity, ListChecks, UserCog, ChevronRight } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, StatCard, Select, EmptyState } from '../../components/ui';
import { formatDate } from '../../lib/dates';
import { listInterns, listCentres } from '../../lib/adminQueries';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [centres, setCentres] = useState([]);
  const [centreFilter, setCentreFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listInterns(), listCentres()]).then(([r, c]) => {
      if (!alive) return;
      setRows(r);
      setCentres(c);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (centreFilter ? rows.filter((r) => r.centre_id === centreFilter) : rows),
    [rows, centreFilter]
  );

  const totalInterventions = filtered.reduce((a, r) => a + (r.intervention_count || 0), 0);
  const internCount = filtered.filter((r) => r.role === 'intern').length;

  const centreOptions = [
    { value: '', label: 'Tous les centres' },
    ...centres.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div>
      <TopBar title="Administration" subtitle="Supervision des internes et des centres" />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-6xl mx-auto flex flex-col gap-4">
        {/* Raccourcis */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NavCard icon={<UserCog size={18} />} title="Comptes & rôles" sub="Promouvoir, rattacher" onClick={() => navigate('/admin/comptes')} />
          <NavCard icon={<ListChecks size={18} />} title="Catalogue de gestes" sub="Liste partagée" onClick={() => navigate('/admin/catalogue')} />
          <NavCard icon={<Building2 size={18} />} title="Stats par centre" sub="Comparer les centres" onClick={() => navigate('/admin/centres')} />
        </div>

        {/* KPIs */}
        <div className="flex gap-3">
          <StatCard value={internCount} label="Internes" icon={<Users size={18} className="text-primary" />} />
          <StatCard value={centres.length} label="Centres" icon={<Building2 size={18} className="text-primary" />} />
          <StatCard value={totalInterventions} label="Interventions" icon={<Activity size={18} className="text-primary" />} />
        </div>

        {/* Filtre centre */}
        <div className="max-w-xs">
          <Select value={centreFilter} onChange={(e) => setCentreFilter(e.target.value)} options={centreOptions} />
        </div>

        {/* Liste des comptes */}
        <Card padding="p-0">
          {loading ? (
            <div className="px-5 py-10 text-center text-ink-3 text-sm">Chargement…</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="👥" title="Aucun compte" subtitle="Aucun interne ne correspond à ce filtre." />
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((r) => (
                <li key={r.user_id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/internes/${r.user_id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                      {(r.display_name || r.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-ink-1 truncate flex items-center gap-2">
                        {r.display_name || r.email || 'Compte sans nom'}
                        {r.role === 'admin' && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">Admin</span>
                        )}
                      </div>
                      <div className="text-xs text-ink-3 truncate">
                        {r.centre_name || 'Centre non rattaché'}
                        {' · '}
                        {r.intervention_count || 0} interv.
                        {r.last_activity ? ` · ${formatDate(r.last_activity)}` : ''}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-3 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function NavCard({ icon, title, sub, onClick }) {
  return (
    <Card onClick={onClick} className="flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-ink-1 truncate">{title}</div>
        <div className="text-xs text-ink-3 truncate">{sub}</div>
      </div>
    </Card>
  );
}
