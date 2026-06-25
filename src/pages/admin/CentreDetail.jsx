import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Users, Activity, TrendingUp, Target } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TopBar } from '../../components/layout/TopBar';
import { Card, EmptyState } from '../../components/ui';
import { listInterns, listCentres, getInternData, slugify } from '../../lib/adminQueries';
import { useStore } from '../../store/useStore';
import { interventionsPerMonth, specialtySplit } from '../../lib/stats';
import { getSpecialty, getPositionStyle, POSITIONS } from '../../data/constants';
import { formatDate } from '../../lib/dates';

const TOOLTIP = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--text-1)',
  boxShadow: 'var(--shadow-md)',
};
const TICK = { fontSize: 10, fill: 'var(--text-3)' };

export default function CentreDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const procedureTypes = useStore((s) => s.procedureTypes);

  const [internRows, setInternRows] = useState([]);
  const [centre, setCentre] = useState(null);
  const [loadingBasic, setLoadingBasic] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [snapshots, setSnapshots] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Phase 1 : liste légère ───────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    Promise.all([listInterns(), listCentres()]).then(([rows, centres]) => {
      if (!alive) return;
      const found = centres.find((c) => slugify(c.city || c.name) === slug);
      if (!found) {
        setNotFound(true);
        setLoadingBasic(false);
        return;
      }
      setCentre(found);
      setInternRows(rows.filter((r) => r.centre_id === found.id));
      setLoadingBasic(false);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  // ── Phase 2 : app_data de chaque interne (en parallèle) ─────────────────
  useEffect(() => {
    if (loadingBasic || !internRows.length) return;
    let alive = true;
    setLoadingDetail(true);
    Promise.all(
      internRows.map((r) =>
        getInternData(r.user_id).then((snap) => ({ userId: r.user_id, snap }))
      )
    ).then((results) => {
      if (!alive) return;
      const map = {};
      results.forEach(({ userId, snap }) => {
        if (snap) map[userId] = { ...snap, procedureTypes };
      });
      setSnapshots(map);
      setLoadingDetail(false);
    });
    return () => {
      alive = false;
    };
  }, [internRows, loadingBasic, procedureTypes]);

  // ── Stats de base (Phase 1) ───────────────────────────────────────────────
  const internOnly = useMemo(() => internRows.filter((r) => r.role !== 'admin'), [internRows]);

  const basicStats = useMemo(() => {
    const total = internRows.reduce((s, r) => s + (r.intervention_count || 0), 0);
    const avg = internOnly.length ? Math.round(total / internOnly.length) : 0;
    const lastActivity = internRows
      .map((r) => r.last_activity)
      .filter(Boolean)
      .sort()
      .at(-1);
    return { total, avg, lastActivity };
  }, [internRows, internOnly]);

  // ── Stats détaillées (Phase 2) ────────────────────────────────────────────
  const detail = useMemo(() => {
    if (!snapshots) return null;

    const allInterventions = Object.values(snapshots).flatMap((s) => s.interventions);

    // Activité mensuelle
    const monthly = interventionsPerMonth(allInterventions);

    // Positions
    const posCounts = Object.fromEntries(POSITIONS.map((p) => [p, 0]));
    allInterventions.forEach((i) => {
      if (i.position && posCounts[i.position] !== undefined) posCounts[i.position]++;
    });
    const posTotal = allInterventions.length;
    const operateurPct = posTotal
      ? Math.round((posCounts['opérateur principal'] / posTotal) * 100)
      : 0;

    // Spécialités (par interne pour résoudre service→semestre, puis agrégation)
    const specAgg = { cardiaque: 0, thoracique: 0, congenitale: 0 };
    Object.values(snapshots).forEach((state) => {
      specialtySplit(state, state.interventions).forEach((s) => {
        if (s.type in specAgg) specAgg[s.type] += s.value;
      });
    });
    const specTotal = Object.values(specAgg).reduce((a, b) => a + b, 0);

    // Détail par interne avec stats enrichies
    const internDetail = internRows
      .map((r) => {
        const state = snapshots[r.user_id];
        if (!state) return { ...r };
        const pc = Object.fromEntries(POSITIONS.map((p) => [p, 0]));
        state.interventions.forEach((i) => {
          if (i.position && pc[i.position] !== undefined) pc[i.position]++;
        });
        const n = state.interventions.length;
        return {
          ...r,
          intervention_count: n,
          posRatio: n ? Math.round((pc['opérateur principal'] / n) * 100) : null,
        };
      })
      .sort((a, b) => b.intervention_count - a.intervention_count);

    return { monthly, posCounts, posTotal, operateurPct, specAgg, specTotal, internDetail };
  }, [snapshots, internRows]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (loadingBasic) {
    return (
      <div>
        <TopBar title="…" onBack={() => navigate('/admin/centres')} />
        <div className="px-4 py-5 lg:px-8 max-w-4xl mx-auto flex flex-col gap-5">
          <div className="rounded-2xl h-28 skeleton" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0,1,2,3].map((i) => <div key={i} className="rounded-xl h-24 skeleton" />)}
          </div>
          <div className="rounded-xl h-48 skeleton" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl h-40 skeleton" />
            <div className="rounded-xl h-40 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div>
        <TopBar title="Centre introuvable" onBack={() => navigate('/admin/centres')} />
        <div className="px-4 py-8">
          <EmptyState
            icon="🏥"
            title="Centre introuvable"
            subtitle="Ce centre n'existe pas ou a été supprimé."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title={centre.name}
        subtitle={[centre.city, `${internOnly.length} interne${internOnly.length !== 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
        onBack={() => navigate('/admin/centres')}
      />

      <div className="px-4 py-5 lg:px-8 lg:py-6 max-w-4xl mx-auto flex flex-col gap-5">

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 anim-fade-up">
          <KpiCard icon={Users}     iconBg="#EBF3FF" iconColor="#1A5CB8"
            value={internOnly.length} label="Internes"      sub="rattachés" />
          <KpiCard icon={Activity}  iconBg="#DCFCE7" iconColor="#15803D"
            value={basicStats.total} label="Interventions"  sub="au total" />
          <KpiCard icon={TrendingUp} iconBg="#FEF3C7" iconColor="#D97706"
            value={basicStats.avg}   label="Moy. / interne" sub="interventions" />
          <KpiCard icon={Target}    iconBg="#F3E8FF" iconColor="#7C3AED"
            value={detail ? `${detail.operateurPct}%` : '…'} label="% Opérateur" sub="principal" />
        </div>

        {loadingDetail && (
          <div className="flex flex-col gap-4 anim-fade-up stagger-1">
            <div className="rounded-xl h-44 skeleton" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl h-36 skeleton" />
              <div className="rounded-xl h-36 skeleton" />
            </div>
          </div>
        )}

        {!loadingDetail && !detail && (
          <EmptyState
            icon="📊"
            title="Aucune donnée"
            subtitle="Les internes de ce centre n'ont pas encore synchronisé d'interventions."
          />
        )}

        {detail && basicStats.total > 0 && (
          <>
            {/* ── Activité mensuelle ──────────────────────────────────────── */}
            <Card className="anim-fade-up stagger-1">
              <h2 className="text-[15px] font-bold text-ink-1 mb-0.5">Activité mensuelle</h2>
              <p className="text-xs text-ink-3 mb-4">Tous internes confondus</p>
              {detail.monthly.length === 0 ? (
                <p className="text-sm text-ink-3">Pas encore de données.</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={detail.monthly} barCategoryGap="30%">
                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP}
                      formatter={(v) => [v, 'Interventions']}
                      cursor={{ fill: 'var(--surface-2)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* ── Positions + Spécialités ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 anim-fade-up stagger-2">

              {/* Position opératoire */}
              <Card>
                <h2 className="text-[15px] font-bold text-ink-1 mb-4">Position opératoire</h2>
                <div className="flex flex-col gap-3">
                  {POSITIONS.map((pos) => {
                    const count = detail.posCounts[pos] || 0;
                    const pct = detail.posTotal
                      ? Math.round((count / detail.posTotal) * 100)
                      : 0;
                    const st = getPositionStyle(pos);
                    return (
                      <div key={pos}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] text-ink-2">{st.short}</span>
                          <span className="text-[13px] font-bold text-ink-1">
                            {count}{' '}
                            <span className="text-ink-3 font-normal text-[12px]">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: st.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Spécialités */}
              <Card>
                <h2 className="text-[15px] font-bold text-ink-1 mb-4">Spécialités</h2>
                <div className="flex flex-col gap-3">
                  {[
                    { type: 'cardiaque', label: 'Cardiaque' },
                    { type: 'thoracique', label: 'Thoracique' },
                    { type: 'congenitale', label: 'Congénitale' },
                  ].map(({ type, label }) => {
                    const count = detail.specAgg[type] || 0;
                    const pct = detail.specTotal
                      ? Math.round((count / detail.specTotal) * 100)
                      : 0;
                    const sp = getSpecialty(type);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-2 text-[13px] text-ink-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: sp.color }}
                            />
                            {label}
                          </span>
                          <span className="text-[13px] font-bold text-ink-1">
                            {count}{' '}
                            <span className="text-ink-3 font-normal text-[12px]">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: sp.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* ── Liste des internes ───────────────────────────────────────── */}
            <Card padding="p-0" className="anim-fade-up stagger-3">
              <div className="px-4 pt-4 pb-2.5 border-b border-line flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-ink-1">Internes rattachés</h2>
                <span className="text-[13px] text-ink-3">({detail.internDetail.length})</span>
              </div>
              {detail.internDetail.length === 0 ? (
                <div className="px-4 py-6">
                  <p className="text-sm text-ink-3">Aucun interne rattaché à ce centre.</p>
                </div>
              ) : (
                <>
                  {/* Table desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-line">
                          {['INTERNE', 'INTERV.', '% OPÉ.', 'DERNIÈRE ACTIVITÉ'].map((h) => (
                            <th key={h} className="text-left text-[10px] font-bold text-ink-3 uppercase tracking-wider px-4 py-2.5">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {detail.internDetail.map((intern) => (
                          <tr
                            key={intern.user_id}
                            onClick={() => navigate(`/admin/internes/${intern.user_id}`)}
                            className="hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                  {(intern.display_name || intern.email || '?').slice(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-ink-1 leading-tight">
                                    {intern.display_name || intern.email || 'Sans nom'}
                                  </div>
                                  {intern.role === 'admin' && (
                                    <span className="text-[10px] font-bold text-primary">Admin</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-ink-1 tabular-nums">
                              {intern.intervention_count ?? 0}
                            </td>
                            <td className="px-4 py-3">
                              {intern.posRatio !== null ? (
                                <span
                                  className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{
                                    background: `${getPositionStyle('opérateur principal').color}18`,
                                    color: getPositionStyle('opérateur principal').color,
                                  }}
                                >
                                  {intern.posRatio}%
                                </span>
                              ) : (
                                <span className="text-ink-3">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-ink-3 text-[12px]">
                              {intern.last_activity ? formatDate(intern.last_activity) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Liste mobile */}
                  <ul className="sm:hidden divide-y divide-line">
                    {detail.internDetail.map((intern) => (
                      <li key={intern.user_id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/internes/${intern.user_id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                            {(intern.display_name || intern.email || '?').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[15px] font-semibold text-ink-1 truncate">
                              {intern.display_name || intern.email || 'Sans nom'}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-ink-3 flex-wrap mt-0.5">
                              <span>{intern.intervention_count ?? 0} interv.</span>
                              {intern.posRatio !== null && (
                                <span
                                  className="font-semibold px-1.5 py-0.5 rounded"
                                  style={{
                                    background: `${getPositionStyle('opérateur principal').color}18`,
                                    color: getPositionStyle('opérateur principal').color,
                                  }}
                                >
                                  {intern.posRatio}% opé
                                </span>
                              )}
                              {intern.last_activity && (
                                <span>· {formatDate(intern.last_activity)}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-ink-3 shrink-0" />
                        </button>
                      </li>
                    ))}
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

// ── Composant local ─────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, value, label, sub }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="text-[28px] font-extrabold leading-none text-ink-1">{value}</div>
      <div className="text-[13px] font-semibold text-ink-1 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>}
    </div>
  );
}
