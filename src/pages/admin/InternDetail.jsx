import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  Award,
  Stethoscope,
  Calendar,
  Target,
  Layers,
  Zap,
  ChevronRight,
  Clock,
  Repeat2,
} from 'lucide-react';
import { Card, EmptyState } from '../../components/ui';
import { TopBar } from '../../components/layout/TopBar';
import { useStore } from '../../store/useStore';
import { getInternData } from '../../lib/adminQueries';
import {
  kpis,
  interventionsPerMonth,
  specialtySplit,
  topInternProcedures,
  topPatientProcedures,
  semesterProcedureMatrix,
  positionsBySemester,
  cumulativeInterventions,
  surgeonPositionBreakdown,
  radarProfile,
} from '../../lib/stats';
import { getSpecialty, getPositionStyle, POSITIONS } from '../../data/constants';
import { formatDate } from '../../lib/dates';
import { serviceForSemester, specialtyForSemester } from '../../lib/queries';

// ─── Shared chart styles ────────────────────────────────────────────────────
const TT = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text-1)',
  boxShadow: '0 8px 24px rgba(0,0,0,.12)',
};
const TICK = { fontSize: 10, fill: 'var(--text-3)' };

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCell({ icon: Icon, label, value, sub, accent }) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-2xl border p-4"
      style={{ borderColor: accent + '28', background: accent + '06' }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color: accent }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
          {label}
        </span>
      </div>
      <div
        className="text-[30px] font-black leading-none tracking-tight text-ink-1"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-3">{sub}</div>}
    </div>
  );
}

function SecHead({ icon: Icon, title, sub, color }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color + '18' }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <div className="text-[13px] font-bold text-ink-1">{title}</div>
        {sub && <div className="text-[10px] text-ink-3 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function Bar2({ label, count, pct, color }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[12px] text-ink-2">{label}</span>
        <span className="text-[12px] font-bold" style={{ color }}>
          {count}{' '}
          <span className="text-[10px] font-normal text-ink-3">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: color + '20' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function InternDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const procedureTypes = useStore((s) => s.procedureTypes);

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getInternData(userId).then((d) => {
      if (!alive) return;
      setSnapshot(d);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [userId]);

  const state = useMemo(
    () => (snapshot ? { ...snapshot, procedureTypes } : null),
    [snapshot, procedureTypes]
  );

  const interventions = state?.interventions ?? [];

  // ─── All stats ────────────────────────────────────────────────────────────
  const k = useMemo(() => kpis(interventions), [interventions]);

  const topGestes = useMemo(
    () => (state ? topInternProcedures(state, interventions, 12) : []),
    [state, interventions]
  );
  const topPatient = useMemo(
    () => (state ? topPatientProcedures(state, interventions, 8) : []),
    [state, interventions]
  );
  const split = useMemo(
    () => (state ? specialtySplit(state, interventions) : []),
    [state, interventions]
  );
  const perMonth = useMemo(() => interventionsPerMonth(interventions), [interventions]);
  const cumul = useMemo(() => cumulativeInterventions(interventions), [interventions]);
  const radar = useMemo(
    () => (state ? radarProfile(state, interventions) : []),
    [state, interventions]
  );
  const surgeonByPos = useMemo(
    () => (state ? surgeonPositionBreakdown(state, interventions, 8) : []),
    [state, interventions]
  );

  const sortedSems = useMemo(
    () => [...(state?.semesters ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [state]
  );
  const semsWithData = useMemo(
    () => sortedSems.filter((s) => interventions.some((i) => i.semesterId === s.id)),
    [sortedSems, interventions]
  );
  const autonomy = useMemo(
    () => positionsBySemester(interventions, semsWithData),
    [interventions, semsWithData]
  );
  const matrix = useMemo(
    () =>
      state
        ? semesterProcedureMatrix(state, interventions, semsWithData)
        : { gestes: [], counts: {} },
    [state, interventions, semsWithData]
  );

  // ─── Derived ──────────────────────────────────────────────────────────────
  const dominant = useMemo(() => {
    if (!split.length) return null;
    const nonZero = split.filter((s) => s.value > 0);
    return nonZero.length ? nonZero.reduce((a, b) => (a.value > b.value ? a : b)) : null;
  }, [split]);

  const accent = dominant?.color ?? 'var(--primary)';
  const autonomyPct = k.total ? Math.round(((k.positions['opérateur principal'] || 0) / k.total) * 100) : 0;
  const avgGestes = k.total ? (k.internGestes / k.total).toFixed(1) : '0';

  // ─── Semester details ─────────────────────────────────────────────────────
  const semDetails = useMemo(() => {
    if (!state) return [];
    return semsWithData.map((sem) => {
      const semInts = interventions.filter((i) => i.semesterId === sem.id);
      const spec = specialtyForSemester(state, sem.id);
      const svc = serviceForSemester(state, sem.id);
      const pc = {};
      semInts.forEach((i) => { pc[i.position] = (pc[i.position] || 0) + 1; });
      const opPct = semInts.length
        ? Math.round(((pc['opérateur principal'] || 0) / semInts.length) * 100)
        : 0;
      const uniqueG = new Set(semInts.flatMap((i) => i.internProcedures || [])).size;
      return { ...sem, semInts, spec, svc, pc, opPct, uniqueG };
    });
  }, [state, semsWithData, interventions]);

  const name = snapshot?.profile
    ? [snapshot.profile.prenom, snapshot.profile.nom].filter(Boolean).join(' ')
    : 'Interne';
  const initials = snapshot?.profile?.initiales || name.slice(0, 2).toUpperCase() || '?';

  // ─── Loading / empty ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <TopBar title="…" onBack={() => navigate(-1)} />
        <div className="flex items-center justify-center py-32 text-ink-3 text-sm">
          Chargement des statistiques de formation…
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div>
        <TopBar title="Interne" onBack={() => navigate(-1)} />
        <div className="px-4 py-8">
          <EmptyState
            icon="🔍"
            title="Données indisponibles"
            subtitle="Ce compte n'a pas encore synchronisé de données."
          />
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <TopBar title={name} subtitle="Fiche de formation" onBack={() => navigate(-1)} />

      <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-6xl mx-auto flex flex-col gap-6">

        {/* ══════════════════════ HERO ══════════════════════════════════════ */}
        <div
          className="rounded-3xl overflow-hidden border"
          style={{
            borderColor: accent + '30',
            background: `linear-gradient(135deg, ${accent}14 0%, var(--surface) 55%, var(--surface) 100%)`,
          }}
        >
          <div className="p-6 flex items-start gap-5">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accent}ee 0%, ${accent}aa 100%)`,
              }}
            >
              {initials}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-[20px] font-black text-ink-1 tracking-tight">{name}</h1>
                {dominant && (
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: dominant.color + '1c', color: dominant.color }}
                  >
                    {dominant.emoji} {dominant.label}
                  </span>
                )}
              </div>
              {snapshot.profile?.hopital && (
                <div className="text-[13px] text-ink-2">{snapshot.profile.hopital}</div>
              )}
              {snapshot.profile?.promotion && (
                <div className="text-[11px] text-ink-3 mt-0.5">{snapshot.profile.promotion}</div>
              )}

              {/* Quick stats strip */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
                {[
                  { icon: Activity, val: k.total, lab: 'interventions', col: accent },
                  { icon: Target, val: `${autonomyPct}%`, lab: 'autonomie opé', col: '#27AE60' },
                  { icon: Calendar, val: semsWithData.length, lab: `semestre${semsWithData.length !== 1 ? 's' : ''}`, col: '#8B5CF6' },
                  { icon: Layers, val: topGestes.length, lab: 'gestes différents', col: '#E67E22' },
                  { icon: Zap, val: k.internGestes, lab: 'gestes interne', col: '#2171B5' },
                ].map(({ icon: I, val, lab, col }) => (
                  <div key={lab} className="flex items-center gap-1.5">
                    <I size={12} style={{ color: col }} />
                    <span className="text-[13px] font-bold text-ink-1">{val}</span>
                    <span className="text-[11px] text-ink-3">{lab}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════ KPIs ══════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCell icon={Activity} label="Interventions" value={k.total} accent={accent} />
          <KpiCell icon={Zap} label="Gestes interne" value={k.internGestes} sub={`Moy. ${avgGestes}/interv.`} accent="#8B5CF6" />
          <KpiCell icon={Target} label="Autonomie" value={`${autonomyPct}%`} sub="Opérateur principal" accent="#27AE60" />
          <KpiCell icon={Stethoscope} label="Chirurgiens" value={k.surgeons} accent="#2171B5" />
          <KpiCell icon={Layers} label="Gestes uniques" value={topGestes.length} accent="#E67E22" />
          <KpiCell icon={Calendar} label="Semestres actifs" value={semsWithData.length} sub={`${sortedSems.length} enregistrés`} accent="#6C3483" />
        </div>

        {interventions.length === 0 ? (
          <EmptyState
            icon="📊"
            title="Aucune intervention"
            subtitle="Cet interne n'a pas encore enregistré d'interventions."
          />
        ) : (
          <>
            {/* ══════════════ COURBE CUMULATIVE + RADAR ═════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <SecHead icon={TrendingUp} title="Activité cumulée" sub="Interventions et gestes depuis le début" color={accent} />
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cumul} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gc1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accent} stopOpacity={0.28} />
                        <stop offset="95%" stopColor={accent} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gc2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TT} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                    <Area type="monotone" dataKey="cumCount" name="Interventions" stroke={accent} strokeWidth={2.5} fill="url(#gc1)" dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="cumGestes" name="Gestes interne" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#gc2)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <SecHead icon={Target} title="Profil d'activité" sub="% par position et spécialité" color="#8B5CF6" />
                {radar.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radar} margin={{ top: 8, right: 28, left: 28, bottom: 8 }}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: 'var(--text-3)' }}
                        tickCount={3}
                        unit="%"
                      />
                      <Radar
                        dataKey="value"
                        stroke={accent}
                        fill={accent}
                        fillOpacity={0.18}
                        strokeWidth={2}
                        dot={{ r: 3, fill: accent }}
                      />
                      <Tooltip contentStyle={TT} formatter={(v) => [`${v}%`, '']} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-ink-3 text-sm">
                    Pas assez de données
                  </div>
                )}
              </Card>
            </div>

            {/* ══════════════ ÉVOLUTION AUTONOMIE PAR SEMESTRE ══════════════ */}
            {autonomy.length > 1 && (
              <Card>
                <SecHead
                  icon={TrendingUp}
                  title="Évolution de l'autonomie par semestre"
                  sub="Part (%) de chaque position opératoire, semestre par semestre"
                  color="#27AE60"
                />
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={autonomy} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={TT} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                    {POSITIONS.map((p) => (
                      <Bar
                        key={p}
                        dataKey={p}
                        stackId="s"
                        name={getPositionStyle(p).short}
                        fill={getPositionStyle(p).color}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-ink-3 mt-1">
                  Une barre verte haute = interne de plus en plus autonome au bloc.
                </p>
              </Card>
            )}

            {/* ══════════════ TOP GESTES + SPÉCIALITÉS ══════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top gestes interne */}
              <Card>
                <SecHead icon={Award} title="Top gestes réalisés par l'interne" sub="Actes effectués en salle d'opération" color="#E67E22" />
                {topGestes.length === 0 ? (
                  <p className="text-sm text-ink-3">Aucun geste interne enregistré.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.min(topGestes.length * 26 + 16, 340)}>
                    <BarChart data={topGestes} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                        axisLine={false}
                        tickLine={false}
                        width={84}
                      />
                      <Tooltip contentStyle={TT} cursor={{ fill: 'var(--surface-2)' }} />
                      <Bar
                        dataKey="count"
                        name="Réalisations"
                        radius={[0, 5, 5, 0]}
                        maxBarSize={18}
                        label={{ position: 'right', fontSize: 11, fill: 'var(--text-2)' }}
                      >
                        {topGestes.map((g) => (
                          <Cell key={g.id} fill={g.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Spécialités + position */}
              <div className="flex flex-col gap-4">
                <Card>
                  <SecHead icon={Activity} title="Répartition des spécialités" color={accent} />
                  <div className="flex items-center gap-4">
                    <div className="relative w-28 h-28 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={split.filter((s) => s.value > 0)}
                            dataKey="value"
                            innerRadius={30}
                            outerRadius={52}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {split
                              .filter((s) => s.value > 0)
                              .map((s) => (
                                <Cell key={s.type} fill={s.color} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={TT} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[15px] font-black text-ink-1">{k.total}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-2.5">
                      {split.map((s) => (
                        <Bar2
                          key={s.type}
                          label={s.label}
                          count={s.value}
                          pct={k.total ? Math.round((s.value / k.total) * 100) : 0}
                          color={s.color}
                        />
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <SecHead icon={Target} title="Répartition par position" color="#27AE60" />
                  <div className="flex flex-col gap-2.5">
                    {POSITIONS.map((p) => {
                      const st = getPositionStyle(p);
                      const count = k.positions[p] || 0;
                      const pct = k.total ? Math.round((count / k.total) * 100) : 0;
                      return (
                        <Bar2 key={p} label={st.short} count={count} pct={pct} color={st.color} />
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>

            {/* ══════════════ ACTIVITÉ MENSUELLE + CHIRURGIENS ══════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <SecHead icon={Activity} title="Activité mensuelle" sub="Nombre d'interventions par mois" color={accent} />
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={perMonth} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TT} cursor={{ fill: 'var(--surface-2)' }} />
                    <Bar dataKey="count" name="Interventions" fill={accent} radius={[5, 5, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {surgeonByPos.length > 0 && (
                <Card>
                  <SecHead
                    icon={Stethoscope}
                    title="Chirurgiens — par position"
                    sub="Rôle de l'interne avec chaque chirurgien"
                    color="#2171B5"
                  />
                  <ResponsiveContainer width="100%" height={Math.max(160, surgeonByPos.length * 32)}>
                    <BarChart
                      data={surgeonByPos}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        type="number"
                        tick={TICK}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                        axisLine={false}
                        tickLine={false}
                        width={88}
                      />
                      <Tooltip contentStyle={TT} cursor={{ fill: 'var(--surface-2)' }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
                      {POSITIONS.map((p) => (
                        <Bar
                          key={p}
                          dataKey={p}
                          stackId="c"
                          name={getPositionStyle(p).short}
                          fill={getPositionStyle(p).color}
                          maxBarSize={22}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* ══════════════ TIMELINE DES SEMESTRES ════════════════════════ */}
            {semDetails.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: accent + '18' }}
                  >
                    <Calendar size={14} style={{ color: accent }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-ink-1">Parcours par semestre</div>
                    <div className="text-[10px] text-ink-3">
                      {semDetails.length} semestre{semDetails.length !== 1 ? 's' : ''} avec activité
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
                  {semDetails.map((sem) => (
                    <div
                      key={sem.id}
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: sem.spec.color + '38',
                        background: sem.spec.color + '07',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: sem.spec.color + '1c' }}
                        >
                          {sem.spec.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-[14px] font-black text-ink-1">{sem.label}</span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: sem.spec.color + '1c',
                                color: sem.spec.color,
                              }}
                            >
                              {sem.spec.label}
                            </span>
                          </div>
                          {sem.svc && (
                            <div className="text-[11px] text-ink-2 mb-1">{sem.svc.name}</div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-ink-3 mb-3">
                            <Clock size={10} />
                            {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                          </div>

                          {/* Metrics row */}
                          <div className="flex items-start gap-4">
                            <div>
                              <div
                                className="text-[22px] font-black leading-none"
                                style={{ color: sem.spec.color }}
                              >
                                {sem.semInts.length}
                              </div>
                              <div className="text-[9px] text-ink-3 mt-0.5 uppercase tracking-wide">
                                interv.
                              </div>
                            </div>
                            <div>
                              <div className="text-[22px] font-black leading-none text-success">
                                {sem.opPct}%
                              </div>
                              <div className="text-[9px] text-ink-3 mt-0.5 uppercase tracking-wide">
                                opér.
                              </div>
                            </div>
                            <div>
                              <div
                                className="text-[22px] font-black leading-none"
                                style={{ color: '#E67E22' }}
                              >
                                {sem.uniqueG}
                              </div>
                              <div className="text-[9px] text-ink-3 mt-0.5 uppercase tracking-wide">
                                gestes
                              </div>
                            </div>

                            {/* Mini position bars */}
                            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                              {POSITIONS.map((p) => {
                                const st = getPositionStyle(p);
                                const cnt = sem.pc[p] || 0;
                                const pct = sem.semInts.length
                                  ? Math.round((cnt / sem.semInts.length) * 100)
                                  : 0;
                                return (
                                  <div key={p} className="flex items-center gap-1.5">
                                    <span
                                      className="text-[9px] shrink-0 w-14 truncate"
                                      style={{ color: st.color }}
                                    >
                                      {st.short}
                                    </span>
                                    <div
                                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                                      style={{ background: st.color + '20' }}
                                    >
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${pct}%`,
                                          background: st.color,
                                        }}
                                      />
                                    </div>
                                    <span
                                      className="text-[9px] font-bold w-7 text-right shrink-0"
                                      style={{ color: st.color }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════ MATRICE SEMESTRE × GESTE ══════════════════════ */}
            {matrix.gestes.length > 0 && (
              <Card padding="p-0">
                <div className="px-4 pt-4 pb-3 flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: accent + '18' }}
                  >
                    <Layers size={14} style={{ color: accent }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-ink-1">Matrice semestre × geste</div>
                    <div className="text-[10px] text-ink-3">
                      Nombre de fois où chaque geste a été réalisé par semestre
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto pb-2">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="text-left font-semibold text-ink-3 px-4 py-2 sticky left-0 bg-surface">
                          Geste
                        </th>
                        {semsWithData.map((s) => (
                          <th
                            key={s.id}
                            className="text-center font-semibold text-ink-3 px-3 py-2 whitespace-nowrap"
                          >
                            {s.label}
                          </th>
                        ))}
                        <th className="text-center font-semibold text-ink-3 px-3 py-2">Tot.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.gestes.map((g) => {
                        const rowTotal = semsWithData.reduce(
                          (a, s) => a + (matrix.counts[s.id]?.[g.id] || 0),
                          0
                        );
                        return (
                          <tr
                            key={g.id}
                            className="border-t border-line hover:bg-surface-2 transition-colors"
                          >
                            <td className="px-4 py-2 text-ink-1 sticky left-0 bg-surface">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: g.color }}
                                />
                                {g.label}
                              </span>
                            </td>
                            {semsWithData.map((s) => {
                              const v = matrix.counts[s.id]?.[g.id] || 0;
                              return (
                                <td
                                  key={s.id}
                                  className="px-3 py-2 text-center"
                                  style={{
                                    color: v ? g.color : 'var(--text-3)',
                                    fontWeight: v ? 800 : 400,
                                  }}
                                >
                                  {v || '·'}
                                </td>
                              );
                            })}
                            <td
                              className="px-3 py-2 text-center font-black"
                              style={{ color: accent }}
                            >
                              {rowTotal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ══════════════ TYPES D'INTERVENTIONS PATIENT ═════════════════ */}
            {topPatient.length > 0 && (
              <Card>
                <SecHead
                  icon={Repeat2}
                  title="Types d'interventions réalisées sur le patient"
                  sub="Gestes effectués sur le patient lors des passages au bloc"
                  color={accent}
                />
                <ResponsiveContainer width="100%" height={Math.min(topPatient.length * 26 + 16, 280)}>
                  <BarChart
                    data={topPatient}
                    layout="vertical"
                    margin={{ top: 0, right: 44, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                      axisLine={false}
                      tickLine={false}
                      width={88}
                    />
                    <Tooltip contentStyle={TT} cursor={{ fill: 'var(--surface-2)' }} />
                    <Bar
                      dataKey="count"
                      name="Interventions"
                      radius={[0, 5, 5, 0]}
                      maxBarSize={18}
                      label={{ position: 'right', fontSize: 11, fill: 'var(--text-2)' }}
                    >
                      {topPatient.map((p) => (
                        <Cell key={p.id} fill={p.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
