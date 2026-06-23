import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TopBar } from '../../components/layout/TopBar';
import { Card, StatCard, EmptyState } from '../../components/ui';
import { listInterns, listCentres, getInternData, slugify } from '../../lib/adminQueries';
import { useStore } from '../../store/useStore';
import { interventionsPerMonth, specialtySplit } from '../../lib/stats';
import { getSpecialty, getPositionStyle, POSITIONS } from '../../data/constants';
import { formatDate, formatDateShort } from '../../lib/dates';

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
        <div className="px-5 py-10 text-center text-ink-3 text-sm">Chargement…</div>
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
        subtitle={[
          centre.city,
          `${internOnly.length} interne${internOnly.length !== 1 ? 's' : ''}`,
          `${basicStats.total} interv.`,
        ]
          .filter(Boolean)
          .join(' · ')}
        onBack={() => navigate('/admin/centres')}
      />

      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-4xl mx-auto flex flex-col gap-5">

        {/* ── KPIs ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard value={internOnly.length} label="Internes" />
          <StatCard value={basicStats.total} label="Interventions" />
          <StatCard value={basicStats.avg} label="Moy. / interne" />
          <StatCard
            value={detail ? `${detail.operateurPct}%` : '…'}
            label="% Opérateur"
          />
        </div>

        {loadingDetail && (
          <div className="text-center text-ink-3 text-sm py-6">
            Chargement des statistiques détaillées…
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
            <Card>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
            <Card padding="p-0">
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-ink-1">Internes rattachés</h2>
                <span className="text-[13px] text-ink-3">({detail.internDetail.length})</span>
              </div>
              {detail.internDetail.length === 0 ? (
                <div className="px-4 pb-4">
                  <p className="text-sm text-ink-3">Aucun interne rattaché à ce centre.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {detail.internDetail.map((intern) => (
                    <li key={intern.user_id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/internes/${intern.user_id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {(intern.display_name || intern.email || '?')
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[15px] font-semibold text-ink-1 truncate">
                              {intern.display_name || intern.email || 'Sans nom'}
                            </span>
                            {intern.role === 'admin' && (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-ink-3">
                              {intern.intervention_count} interv.
                            </span>
                            {intern.posRatio !== null && (
                              <span
                                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                                style={{
                                  background: `${getPositionStyle('opérateur principal').color}18`,
                                  color: getPositionStyle('opérateur principal').color,
                                }}
                              >
                                {intern.posRatio}% opé
                              </span>
                            )}
                            {intern.last_activity && (
                              <span className="text-xs text-ink-3">
                                · {formatDate(intern.last_activity)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-ink-3 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
