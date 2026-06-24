import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  UserX,
  RefreshCw,
  Search,
} from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, Select, EmptyState } from '../../components/ui';
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
  const [search, setSearch]   = useState('');

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

  const now = useMemo(() => Date.now(), []);
  const interns = useMemo(() => rows.filter((r) => r.role === 'intern'), [rows]);

  const kpi = useMemo(() => {
    const total      = interns.reduce((a, r) => a + (r.intervention_count || 0), 0);
    const avg        = interns.length ? Math.round(total / interns.length) : 0;
    const actifs30   = interns.filter(
      (r) => r.last_activity && now - new Date(r.last_activity).getTime() < THIRTY_DAYS_MS
    ).length;
    const sansCentre   = interns.filter((r) => !r.centre_id).length;
    const jamaisSynced = interns.filter((r) => !r.last_activity).length;
    const inactifs60   = interns.filter(
      (r) => !r.last_activity || now - new Date(r.last_activity).getTime() >= SIXTY_DAYS_MS
    ).length;
    return { total, avg, actifs30, sansCentre, jamaisSynced, inactifs60 };
  }, [interns, now]);

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

  const filtered = useMemo(() => {
    let list = interns;
    if (centreFilter) list = list.filter((r) => r.centre_id === centreFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.display_name || '').toLowerCase().includes(q) ||
          (r.email || '').toLowerCase().includes(q) ||
          (r.centre_name || '').toLowerCase().includes(q)
      );
    }
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
      const da = a.last_activity ? new Date(a.last_activity).getTime() : 0;
      const db = b.last_activity ? new Date(b.last_activity).getTime() : 0;
      return db - da;
    });
  }, [interns, centreFilter, tab, sort, search, now]);

  const centreOptions = [
    { value: '', label: 'Tous les centres' },
    ...centres.map((c) => ({ value: c.id, label: c.name })),
  ];

  const TABS = [
    { value: 'tous',        label: `Tous (${interns.length})` },
    { value: 'sans-centre', label: `Sans centre (${kpi.sansCentre})` },
    { value: 'inactifs',    label: `Inactifs 60j+ (${kpi.inactifs60})` },
  ];

  const SORT_OPTIONS = [
    { value: 'activite',      label: 'Dernière activité' },
    { value: 'interventions', label: 'Interventions' },
    { value: 'nom',           label: 'Nom' },
  ];

  return (
    <div>
      <TopBar title="Administration" />

      {/* ── Hero full-bleed ──────────────────────────────────────────────── */}
      <div className="header-gradient px-6 py-6 lg:px-10 lg:py-7 relative overflow-hidden">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={12} className="text-white/40" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Espace Administrateur
            </span>
          </div>
          <div className="flex flex-wrap gap-8 sm:gap-12">
            <HeroStat value={loading ? '…' : interns.length} label="internes" />
            <HeroStat value={loading ? '…' : centres.length} label="centres" />
            <HeroStat value={loading ? '…' : kpi.total}      label="interventions" />
            <HeroStat
              value={loading ? '…' : kpi.actifs30}
              label="actifs ce mois"
              dim={!loading && kpi.actifs30 === 0}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-5 lg:px-8 lg:py-6 max-w-6xl mx-auto flex flex-col gap-5">

        {loading ? (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0,1,2,3].map((i) => <div key={i} className="rounded-xl h-24 skeleton" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-xl h-52 skeleton" />
              <div className="flex flex-col gap-3">
                {[0,1,2].map((i) => <div key={i} className="rounded-xl h-16 skeleton" />)}
              </div>
            </div>
            <div className="rounded-xl h-64 skeleton" />
          </div>
        ) : (
          <>
            {/* ── KPIs ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 anim-fade-up">
              <KpiCard
                icon={TrendingUp}
                iconBg="#EBF3FF"
                iconColor="#1A5CB8"
                value={kpi.avg}
                label="Moy. / interne"
                sub="interventions"
              />
              <KpiCard
                icon={Activity}
                iconBg="#DCFCE7"
                iconColor="#15803D"
                value={kpi.actifs30}
                label="Actifs ce mois"
                sub="derniers 30 jours"
                highlight={kpi.actifs30 > 0 ? '#15803D' : undefined}
              />
              <KpiCard
                icon={Clock}
                iconBg="#FEF3C7"
                iconColor="#D97706"
                value={kpi.inactifs60}
                label="Inactifs 60j+"
                sub="à recontacter"
                highlight={kpi.inactifs60 > 0 ? '#D97706' : undefined}
              />
              <KpiCard
                icon={UserX}
                iconBg="#FEE2E2"
                iconColor="#DC2626"
                value={kpi.sansCentre}
                label="Sans centre"
                sub="à assigner"
                highlight={kpi.sansCentre > 0 ? '#DC2626' : undefined}
              />
            </div>

            {/* ── Vue d'ensemble ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 anim-fade-up stagger-1">

              {/* Classement des centres */}
              <Card className="lg:col-span-2">
                <h2 className="text-[15px] font-bold text-ink-1 mb-0.5">Classement des centres</h2>
                <p className="text-[11px] text-ink-3 mb-4">Par total d'interventions</p>
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
                            <span className="text-[11px] text-ink-3 ml-1.5">({c.internCount} int.)</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
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
                  icon={kpi.sansCentre > 0 ? AlertCircle : CheckCircle}
                  title={
                    kpi.sansCentre > 0
                      ? `${kpi.sansCentre} interne${kpi.sansCentre > 1 ? 's' : ''} sans centre`
                      : 'Tous rattachés'
                  }
                  sub={
                    kpi.sansCentre > 0
                      ? 'Centre de formation manquant'
                      : 'Tous les internes ont un centre'
                  }
                  action={
                    kpi.sansCentre > 0
                      ? { label: 'Assigner →', onClick: () => navigate('/admin/comptes') }
                      : undefined
                  }
                />
                <AlertCard
                  level={kpi.jamaisSynced > 0 ? 'warn' : 'ok'}
                  icon={kpi.jamaisSynced > 0 ? RefreshCw : CheckCircle}
                  title={
                    kpi.jamaisSynced > 0
                      ? `${kpi.jamaisSynced} compte${kpi.jamaisSynced > 1 ? 's' : ''} sans sync`
                      : 'Tous ont synchronisé'
                  }
                  sub={
                    kpi.jamaisSynced > 0
                      ? 'Aucune donnée de formation reçue'
                      : 'Toutes les données sont à jour'
                  }
                />
                <AlertCard
                  level={kpi.inactifs60 > 0 ? 'warn' : 'ok'}
                  icon={kpi.inactifs60 > 0 ? Clock : CheckCircle}
                  title={
                    kpi.inactifs60 > 0
                      ? `${kpi.inactifs60} interne${kpi.inactifs60 > 1 ? 's' : ''} inactif${kpi.inactifs60 > 1 ? 's' : ''}`
                      : 'Activité normale'
                  }
                  sub={
                    kpi.inactifs60 > 0
                      ? 'Inactif depuis plus de 60 jours'
                      : 'Aucune inactivité prolongée'
                  }
                />
              </div>
            </div>

            {/* ── Table internes ────────────────────────────────────────── */}
            <Card padding="p-0" className="anim-fade-up stagger-2">
              {/* Header */}
              <div className="px-4 pt-4 pb-3 border-b border-line flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap gap-2">
                    {TABS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTab(t.value)}
                        className={`text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                          tab === t.value
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-surface-2 text-ink-2 hover:bg-surface-2/80'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
                      <input
                        type="search"
                        placeholder="Rechercher…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-7 pr-3 py-1.5 text-[13px] rounded-lg border border-line bg-surface text-ink-1 outline-none focus:border-primary transition-colors w-36"
                      />
                    </div>
                    {centres.length > 0 && (
                      <Select
                        value={centreFilter}
                        onChange={(e) => setCentreFilter(e.target.value)}
                        options={centreOptions}
                        className="text-[13px] w-44"
                      />
                    )}
                    <Select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      options={SORT_OPTIONS}
                      className="text-[13px] w-40"
                    />
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="Aucun interne"
                  subtitle="Aucun compte ne correspond à ce filtre."
                />
              ) : (
                <>
                  {/* Table desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-line">
                          {['INTERNE', 'EMAIL', 'CENTRE', 'INTERV.', 'DERNIÈRE ACTIVITÉ', 'STATUT'].map((h) => (
                            <th
                              key={h}
                              className="text-left text-[10px] font-bold text-ink-3 uppercase tracking-wider px-4 py-2.5"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {filtered.map((r) => {
                          const isStale =
                            !r.last_activity ||
                            now - new Date(r.last_activity).getTime() >= SIXTY_DAYS_MS;
                          return (
                            <tr
                              key={r.user_id}
                              onClick={() => navigate(`/admin/internes/${r.user_id}`)}
                              className="hover:bg-surface-2 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                    {(r.display_name || r.email || '?').slice(0, 1).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-ink-1 leading-tight">
                                      {r.display_name || 'Sans nom'}
                                    </div>
                                    {r.role === 'admin' && (
                                      <span className="text-[10px] font-bold text-primary">Admin</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-ink-3 max-w-[180px] truncate">
                                {r.email}
                              </td>
                              <td className="px-4 py-3">
                                {r.centre_name ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/admin/centres/${slugify(r.centre_name)}`);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.stopPropagation();
                                        navigate(`/admin/centres/${slugify(r.centre_name)}`);
                                      }
                                    }}
                                    className="text-primary font-medium hover:underline cursor-pointer text-[12px]"
                                  >
                                    {r.centre_name}
                                  </span>
                                ) : (
                                  <span className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                                    Sans centre
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-bold text-ink-1 tabular-nums">
                                {r.intervention_count || 0}
                              </td>
                              <td className="px-4 py-3 text-ink-3 text-[12px]">
                                {r.last_activity ? formatDate(r.last_activity) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
                                  style={{ color: isStale ? '#D97706' : '#15803D' }}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ background: isStale ? '#D97706' : '#15803D' }}
                                  />
                                  {r.last_activity ? (isStale ? 'Inactif' : 'Actif') : 'Jamais sync.'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Liste mobile */}
                  <ul className="sm:hidden divide-y divide-line">
                    {filtered.map((r) => {
                      const isStale =
                        !r.last_activity ||
                        now - new Date(r.last_activity).getTime() >= SIXTY_DAYS_MS;
                      return (
                        <li key={r.user_id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/internes/${r.user_id}`)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                              {(r.display_name || r.email || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[15px] font-semibold text-ink-1 truncate">
                                  {r.display_name || r.email || 'Compte sans nom'}
                                </span>
                                {r.role === 'admin' && (
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-ink-3 flex-wrap">
                                {r.centre_name ? (
                                  <span className="text-primary font-medium">{r.centre_name}</span>
                                ) : (
                                  <span className="font-semibold" style={{ color: '#DC2626' }}>Sans centre</span>
                                )}
                                <span>·</span>
                                <span>{r.intervention_count || 0} interv.</span>
                                {r.last_activity && (
                                  <span
                                    style={{ color: isStale ? '#D97706' : 'var(--text-3)' }}
                                  >
                                    · {formatDate(r.last_activity)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-ink-3 shrink-0" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ── Composants locaux ───────────────────────────────────────────────────────

function HeroStat({ value, label, dim }) {
  return (
    <div>
      <div
        className="text-[36px] font-extrabold leading-none"
        style={{ color: dim ? 'rgba(255,255,255,0.3)' : 'white' }}
      >
        {value}
      </div>
      <div
        className="text-[12px] font-semibold mt-1"
        style={{ color: dim ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)' }}
      >
        {label}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, iconBg, iconColor, value, label, sub, highlight }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div
        className="text-[28px] font-extrabold leading-none"
        style={{ color: highlight ?? 'var(--text-1)' }}
      >
        {value}
      </div>
      <div className="text-[13px] font-semibold text-ink-1 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>}
    </div>
  );
}

function AlertCard({ level, icon: Icon, title, sub, action }) {
  const isOk   = level === 'ok';
  const color  = isOk ? '#15803D' : '#D97706';
  const bg     = isOk ? 'rgba(21,128,61,0.06)'  : 'rgba(217,119,6,0.06)';
  const border = isOk ? 'rgba(21,128,61,0.2)'   : 'rgba(217,119,6,0.2)';
  const iconBg = isOk ? 'rgba(21,128,61,0.12)'  : 'rgba(217,119,6,0.12)';

  return (
    <div
      className="rounded-2xl p-3.5 flex gap-3 items-start"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: iconBg }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold leading-tight" style={{ color }}>
          {title}
        </div>
        {sub && <div className="text-[11px] text-ink-3 mt-0.5 leading-tight">{sub}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1.5 text-[11px] font-bold text-primary hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
