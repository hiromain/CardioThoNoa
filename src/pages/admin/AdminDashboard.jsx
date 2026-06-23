import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Activity, ChevronRight } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, StatCard, Select, EmptyState } from '../../components/ui';
import { formatDate } from '../../lib/dates';
import { listInterns, listCentres, slugify } from '../../lib/adminQueries';

const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;
const SIXTY_DAYS_MS  = 60 * 24 * 3600 * 1000;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [rows, setRows]       = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centreFilter, setCentreFilter] = useState('');
  const [sort, setSort]       = useState('activite');
  const [tab, setTab]         = useState('tous');

  useEffect(() => {
    let alive = true;
    Promise.all([listInterns(), listCentres()]).then(([r, c]) => {
      if (!alive) return;
      setRows(r);
      setCentres(c);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  // Stable timestamp pour cette session
  const now = useMemo(() => Date.now(), []);

  // ── Internes seulement ──────────────────────────────────────────────────
  const interns = useMemo(() => rows.filter((r) => r.role === 'intern'), [rows]);

  // ── KPIs globaux ────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const total   = interns.reduce((a, r) => a + (r.intervention_count || 0), 0);
    const avg     = interns.length ? Math.round(total / interns.length) : 0;
    const actifs30  = interns.filter(
      (r) => r.last_activity && now - new Date(r.last_activity).getTime() < THIRTY_DAYS_MS
    ).length;
    const sansCentre = interns.filter((r) => !r.centre_id).length;
    const jamaisSynced = interns.filter((r) => !r.last_activity).length;
    const inactifs60   = interns.filter(
      (r) => !r.last_activity || now - new Date(r.last_activity).getTime() >= SIXTY_DAYS_MS
    ).length;
    return { total, avg, actifs30, sansCentre, jamaisSynced, inactifs60 };
  }, [interns, now]);

  // ── Classement centres ──────────────────────────────────────────────────
  const centreRanking = useMemo(() => {
    const map = new Map();
    centres.forEach((c) =>
      map.set(c.id, { id: c.id, name: c.name, city: c.city, internCount: 0, interventions: 0 })
    );
    interns.forEach((r) => {
      if (r.centre_id && map.has(r.centre_id)) {
        const b = map.get(r.centre_id);
        b.internCount++;
        b.interventions += r.intervention_count || 0;
      }
    });
    return [...map.values()]
      .filter((c) => c.internCount > 0)
      .sort((a, b) => b.interventions - a.interventions);
  }, [centres, interns]);

  const maxCentreInterventions = Math.max(1, ...centreRanking.map((c) => c.interventions));

  // ── Liste filtrée + triée ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = interns;
    if (centreFilter) list = list.filter((r) => r.centre_id === centreFilter);
    switch (tab) {
      case 'sans-centre':
        list = list.filter((r) => !r.centre_id);
        break;
      case 'inactifs':
        list = list.filter(
          (r) => !r.last_activity || now - new Date(r.last_activity).getTime() >= SIXTY_DAYS_MS
        );
        break;
      default:
        break;
    }
    return [...list].sort((a, b) => {
      if (sort === 'nom')
        return (a.display_name || a.email || '').localeCompare(b.display_name || b.email || '');
      if (sort === 'interventions')
        return (b.intervention_count || 0) - (a.intervention_count || 0);
      // par défaut : activité décroissante, jamais sync à la fin
      const da = a.last_activity ? new Date(a.last_activity).getTime() : 0;
      const db = b.last_activity ? new Date(b.last_activity).getTime() : 0;
      return db - da;
    });
  }, [interns, centreFilter, tab, sort, now]);

  const centreOptions = [
    { value: '', label: 'Tous les centres' },
    ...centres.map((c) => ({ value: c.id, label: c.name })),
  ];

  const TABS = [
    { value: 'tous',        label: `Tous (${interns.length})` },
    { value: 'sans-centre', label: `Sans centre (${kpi.sansCentre})` },
    { value: 'inactifs',    label: `Inactifs (${kpi.inactifs60})` },
  ];

  const SORT_OPTIONS = [
    { value: 'activite',      label: 'Dernière activité' },
    { value: 'interventions', label: 'Interventions' },
    { value: 'nom',           label: 'Nom alphabétique' },
  ];

  return (
    <div>
      <TopBar title="Administration" subtitle="Supervision des internes et des centres" />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-6xl mx-auto flex flex-col gap-5">

        {loading ? (
          <div className="text-center text-ink-3 text-sm py-10">Chargement…</div>
        ) : (
          <>
            {/* ── KPIs ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard value={interns.length}       label="Internes" />
              <StatCard value={centres.length}       label="Centres" />
              <StatCard value={kpi.total}            label="Interventions" />
              <StatCard value={kpi.avg}              label="Moy. / interne" />
              <StatCard
                value={kpi.actifs30}
                label="Actifs (30 j)"
                color={kpi.actifs30 > 0 ? '#27AE60' : 'var(--text-3)'}
              />
              <StatCard
                value={kpi.sansCentre}
                label="Sans centre"
                color={kpi.sansCentre > 0 ? '#E67E22' : 'var(--text-3)'}
              />
            </div>

            {/* ── Vue d'ensemble ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Classement des centres */}
              <Card className="lg:col-span-2">
                <h2 className="text-[15px] font-bold text-ink-1 mb-1">Classement des centres</h2>
                <p className="text-[11px] text-ink-3 mb-4">Par nombre d'interventions totales</p>
                {centreRanking.length === 0 ? (
                  <p className="text-sm text-ink-3">Aucun centre avec des internes rattachés.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {centreRanking.map((c, i) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => navigate(`/admin/centres/${slugify(c.city || c.name)}`)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-bold text-ink-3 w-4 text-right shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-[14px] font-semibold text-ink-1 group-hover:text-primary transition-colors">
                              {c.name}
                            </span>
                            {c.city && (
                              <span className="text-[11px] text-ink-3 hidden sm:inline">{c.city}</span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[13px] font-bold text-ink-1">{c.interventions}</span>
                            <span className="text-[11px] text-ink-3 ml-1.5">
                              {c.internCount} int.
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${(c.interventions / maxCentreInterventions) * 100}%` }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              {/* Alertes */}
              <div className="flex flex-col gap-3">
                <AlertCard
                  level={kpi.sansCentre > 0 ? 'warn' : 'ok'}
                  emoji="🏥"
                  title={
                    kpi.sansCentre > 0
                      ? `${kpi.sansCentre} interne${kpi.sansCentre > 1 ? 's' : ''} sans centre`
                      : 'Tous les internes sont rattachés'
                  }
                  sub={
                    kpi.sansCentre > 0
                      ? 'Aucun centre de formation rattaché'
                      : undefined
                  }
                  action={
                    kpi.sansCentre > 0
                      ? { label: 'Assigner un centre', onClick: () => navigate('/admin/comptes') }
                      : undefined
                  }
                />
                <AlertCard
                  level={kpi.jamaisSynced > 0 ? 'warn' : 'ok'}
                  emoji="🔄"
                  title={
                    kpi.jamaisSynced > 0
                      ? `${kpi.jamaisSynced} compte${kpi.jamaisSynced > 1 ? 's' : ''} jamais synchronisé${kpi.jamaisSynced > 1 ? 's' : ''}`
                      : 'Tous les comptes ont synchronisé'
                  }
                  sub={
                    kpi.jamaisSynced > 0
                      ? 'Aucune donnée de formation reçue'
                      : undefined
                  }
                />
                <AlertCard
                  level={kpi.inactifs60 > 0 ? 'warn' : 'ok'}
                  emoji="⏱"
                  title={
                    kpi.inactifs60 > 0
                      ? `${kpi.inactifs60} interne${kpi.inactifs60 > 1 ? 's' : ''} inactif${kpi.inactifs60 > 1 ? 's' : ''} (60 j)`
                      : 'Aucun interne inactif'
                  }
                  sub={
                    kpi.inactifs60 > 0
                      ? 'Pas de synchronisation depuis 60 jours'
                      : undefined
                  }
                />
              </div>
            </div>

            {/* ── Liste des internes ───────────────────────────────────── */}
            <Card padding="p-0">
              {/* Header filtres */}
              <div className="px-4 pt-4 pb-3 border-b border-line flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[15px] font-bold text-ink-1">
                    Internes
                    <span className="ml-1.5 text-ink-3 font-normal text-[13px]">
                      ({filtered.length}/{interns.length})
                    </span>
                  </h2>
                  <div className="w-44 shrink-0">
                    <Select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      options={SORT_OPTIONS}
                    />
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 flex-wrap">
                  {TABS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTab(t.value)}
                      className={`text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                        tab === t.value
                          ? 'bg-primary text-white'
                          : 'bg-surface-2 text-ink-2 hover:bg-surface-2'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {/* Filtre par centre */}
                {centres.length > 0 && (
                  <div className="max-w-xs">
                    <Select
                      value={centreFilter}
                      onChange={(e) => setCentreFilter(e.target.value)}
                      options={centreOptions}
                    />
                  </div>
                )}
              </div>

              {/* Liste */}
              {filtered.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="Aucun interne"
                  subtitle="Aucun compte ne correspond à ce filtre."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {filtered.map((r) => {
                    const daysSinceActivity = r.last_activity
                      ? (now - new Date(r.last_activity).getTime()) / (24 * 3600 * 1000)
                      : null;
                    const isStale = daysSinceActivity === null || daysSinceActivity >= 60;

                    return (
                      <li key={r.user_id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/internes/${r.user_id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                            {(r.display_name || r.email || '?').slice(0, 1).toUpperCase()}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-[15px] font-semibold text-ink-1 truncate">
                                {r.display_name || r.email || 'Compte sans nom'}
                              </span>
                              {r.role === 'admin' && (
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {r.centre_name ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/admin/centres/${slugify(r.centre_name)}`);
                                  }}
                                  className="text-xs text-primary font-medium hover:underline"
                                >
                                  {r.centre_name}
                                </button>
                              ) : (
                                <span className="text-xs font-semibold" style={{ color: '#E67E22' }}>
                                  Sans centre
                                </span>
                              )}
                              <span className="text-xs text-ink-3">·</span>
                              <span className="text-xs text-ink-3">
                                {r.intervention_count || 0} interv.
                              </span>
                              {r.last_activity ? (
                                <span
                                  className="text-xs"
                                  style={{ color: isStale ? '#E67E22' : 'var(--text-3)' }}
                                >
                                  · {formatDate(r.last_activity)}
                                </span>
                              ) : (
                                <span className="text-xs text-ink-3">· jamais synchronisé</span>
                              )}
                            </div>
                          </div>

                          <ChevronRight size={16} className="text-ink-3 shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ── Composants internes ─────────────────────────────────────────────────────


function AlertCard({ level, emoji, title, sub, action }) {
  const bg    = level === 'ok'   ? 'rgba(39,174,96,0.08)'
              : level === 'warn' ? 'rgba(230,126,34,0.08)'
              : 'var(--surface-2)';
  const border= level === 'ok'   ? 'rgba(39,174,96,0.25)'
              : level === 'warn' ? 'rgba(230,126,34,0.25)'
              : 'var(--border)';
  const titleColor = level === 'ok'   ? '#27AE60'
                   : level === 'warn' ? '#E67E22'
                   : 'var(--text-1)';
  return (
    <div
      className="rounded-2xl p-3.5 flex gap-3 items-start"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span className="text-xl leading-none mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold" style={{ color: titleColor }}>
          {title}
        </div>
        {sub && <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-[11px] font-bold text-primary hover:underline"
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  );
}
