import { useMemo, useState } from 'react';
import { Database } from 'lucide-react';
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
  LineChart,
  Line,
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
import { useData } from '../store/hooks';
import { serviceForSemester, surgeonName } from '../lib/queries';
import {
  kpis,
  interventionsPerMonth,
  specialtySplit,
  topInternProcedures,
  topPatientProcedures,
  internProceduresPerMonth,
  semesterProcedureMatrix,
  positionsBySemester,
  cumulativeInterventions,
  surgeonPositionBreakdown,
  radarProfile,
} from '../lib/stats';
import { getSpecialty, getPositionStyle, POSITIONS } from '../data/constants';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { SectionTitle } from '../components/Section';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState } from '../components/ui/EmptyState';
import { Accordion } from '../components/ui/Accordion';
import { ExportSection } from '../components/ExportSection';

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--text-1)',
  boxShadow: 'var(--shadow-md)',
};
const axisTick = { fontSize: 10, fill: 'var(--text-3)' };

function AutonomyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={tooltipStyle} className="px-2.5 py-2">
      <div className="text-[12px] font-bold text-ink-1 mb-1.5">{label}</div>
      <div className="flex flex-col gap-1">
        {POSITIONS.map((p) => {
          const st = getPositionStyle(p);
          return (
            <div key={p} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5" style={{ color: st.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                {st.short}
              </span>
              <span className="font-bold text-ink-1">
                {row[`${p}__n`]} ({row[p]}%)
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-ink-3 mt-1.5 pt-1.5 border-t border-line">Total : {row.total}</div>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-ink-3 uppercase tracking-wider mb-2">{title}</div>
      {children}
    </div>
  );
}

function FilterRadio({ value, current, onChange, label }) {
  const active = current === value;
  return (
    <button
      onClick={() => onChange(value)}
      className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-[13px] transition-colors ${
        active ? 'bg-primary/10 text-primary font-semibold' : 'text-ink-2 hover:bg-surface-2'
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          active ? 'border-primary' : 'border-ink-3'
        }`}
      >
        {active && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
      </span>
      {label}
    </button>
  );
}

export default function Statistics() {
  const data = useData();
  const [period, setPeriod] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filtres avancés (panneau desktop)
  const [positionFilter, setPositionFilter] = useState('all');
  const [surgeonFilter, setSurgeonFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const sortedSemesters = useMemo(
    () => [...data.semesters].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [data.semesters]
  );

  const periodOptions = [
    ...sortedSemesters.map((s) => ({ value: s.id, label: s.label })),
    { value: 'all', label: 'Tout' },
  ];

  const availableSurgeons = useMemo(() => {
    const ids = new Set(data.interventions.map((i) => i.surgeonId).filter(Boolean));
    return data.surgeons
      .filter((s) => ids.has(s.id))
      .sort((a, b) => surgeonName(a).localeCompare(surgeonName(b)));
  }, [data]);

  const filtered = useMemo(() => {
    let list = data.interventions;
    if (period !== 'all') list = list.filter((i) => i.semesterId === period);
    if (typeFilter !== 'all') {
      list = list.filter((i) => serviceForSemester(data, i.semesterId)?.type === typeFilter);
    }
    if (positionFilter !== 'all') list = list.filter((i) => i.position === positionFilter);
    if (surgeonFilter !== 'all') list = list.filter((i) => i.surgeonId === surgeonFilter);
    if (dateStart) list = list.filter((i) => i.date >= dateStart);
    if (dateEnd) list = list.filter((i) => i.date <= dateEnd);
    return list;
  }, [data, period, typeFilter, positionFilter, surgeonFilter, dateStart, dateEnd]);

  const stats = useMemo(() => kpis(filtered), [filtered]);
  const perMonth = useMemo(() => interventionsPerMonth(filtered), [filtered]);
  const split = useMemo(() => specialtySplit(data, filtered), [data, filtered]);
  const topProcs = useMemo(() => topInternProcedures(data, filtered, 10), [data, filtered]);
  const internPerMonth = useMemo(() => internProceduresPerMonth(filtered), [filtered]);

  const matrixSemesters = useMemo(
    () => (period === 'all' ? sortedSemesters : sortedSemesters.filter((s) => s.id === period)),
    [period, sortedSemesters]
  );
  const matrix = useMemo(
    () => semesterProcedureMatrix(data, filtered, matrixSemesters),
    [data, filtered, matrixSemesters]
  );

  const patientCaseMix = useMemo(() => topPatientProcedures(data, filtered, 8), [data, filtered]);
  const semestersWithData = useMemo(
    () => matrixSemesters.filter((s) => filtered.some((i) => i.semesterId === s.id)),
    [matrixSemesters, filtered]
  );
  const autonomy = useMemo(
    () => positionsBySemester(filtered, semestersWithData),
    [filtered, semestersWithData]
  );

  // Nouveaux stats desktop
  const cumulative = useMemo(() => cumulativeInterventions(filtered), [filtered]);
  const surgeonByPos = useMemo(() => surgeonPositionBreakdown(data, filtered, 8), [data, filtered]);
  const radar = useMemo(() => radarProfile(data, filtered), [data, filtered]);

  const avgGestes = stats.total ? (stats.internGestes / stats.total).toFixed(1) : '0';
  const pieData = split.filter((s) => s.value > 0);
  const currentSem = data.semesters.find((s) => s.id === period);

  const activeAdvancedFilters = [
    positionFilter !== 'all',
    surgeonFilter !== 'all',
    !!dateStart,
    !!dateEnd,
  ].filter(Boolean).length;

  function resetAdvancedFilters() {
    setPositionFilter('all');
    setSurgeonFilter('all');
    setDateStart('');
    setDateEnd('');
  }

  return (
    <div>
      <TopBar
        title="Statistiques"
        subtitle={
          currentSem
            ? `${currentSem.label} — ${getSpecialty(serviceForSemester(data, currentSem.id)?.type).label}`
            : 'Toutes périodes'
        }
      />

      <div className="flex">
        {/* ── Panneau filtres desktop ── */}
        <aside className="hidden lg:flex flex-col gap-5 w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-ink-1">Filtres</h2>
            {activeAdvancedFilters > 0 && (
              <button
                onClick={resetAdvancedFilters}
                className="text-[11px] text-primary hover:underline"
              >
                Réinitialiser ({activeAdvancedFilters})
              </button>
            )}
          </div>

          <FilterSection title="Période">
            <div className="flex flex-col gap-0.5">
              <FilterRadio value="all" current={period} onChange={setPeriod} label="Toutes périodes" />
              {sortedSemesters.map((s) => (
                <FilterRadio key={s.id} value={s.id} current={period} onChange={setPeriod} label={s.label} />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Spécialité">
            <div className="flex flex-col gap-0.5">
              <FilterRadio value="all" current={typeFilter} onChange={setTypeFilter} label="Toutes" />
              <FilterRadio value="cardiaque" current={typeFilter} onChange={setTypeFilter} label="🫀 Cardiaque" />
              <FilterRadio value="thoracique" current={typeFilter} onChange={setTypeFilter} label="🫁 Thoracique" />
              <FilterRadio value="congenitale" current={typeFilter} onChange={setTypeFilter} label="👶 Congénitale" />
            </div>
          </FilterSection>

          <FilterSection title="Position">
            <div className="flex flex-col gap-0.5">
              <FilterRadio value="all" current={positionFilter} onChange={setPositionFilter} label="Toutes" />
              {POSITIONS.map((p) => (
                <FilterRadio
                  key={p}
                  value={p}
                  current={positionFilter}
                  onChange={setPositionFilter}
                  label={getPositionStyle(p).short}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Chirurgien">
            <select
              value={surgeonFilter}
              onChange={(e) => setSurgeonFilter(e.target.value)}
              className="w-full text-[13px] bg-surface-2 border border-line rounded-lg px-2.5 py-1.5 text-ink-1 outline-none cursor-pointer"
            >
              <option value="all">Tous les chirurgiens</option>
              {availableSurgeons.map((s) => (
                <option key={s.id} value={s.id}>
                  {surgeonName(s)}
                </option>
              ))}
            </select>
          </FilterSection>

          <FilterSection title="Période personnalisée">
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[11px] text-ink-3 mb-1 block">Du</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full text-[12px] bg-surface-2 border border-line rounded-lg px-2 py-1.5 text-ink-1 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-ink-3 mb-1 block">Au</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full text-[12px] bg-surface-2 border border-line rounded-lg px-2 py-1.5 text-ink-1 outline-none"
                />
              </div>
            </div>
          </FilterSection>

          <div className="mt-auto pt-4 border-t border-line">
            <p className="text-[12px] text-ink-3">
              <span className="font-bold text-ink-1">{filtered.length}</span>{' '}
              intervention{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <div className="flex-1 min-w-0 px-4 py-4 flex flex-col gap-5">
          {/* Filtres mobiles uniquement */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} />
            <SegmentedControl
              options={[
                { value: 'all', label: 'Toutes' },
                { value: 'cardiaque', label: '🫀 Card.' },
                { value: 'thoracique', label: '🫁 Thor.' },
                { value: 'congenitale', label: '👶 Cong.' },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              activeColor={
                typeFilter === 'cardiaque'
                  ? '#C0392B'
                  : typeFilter === 'thoracique'
                    ? '#2171B5'
                    : typeFilter === 'congenitale'
                      ? '#1B8A6B'
                      : 'var(--primary)'
              }
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="📊" title="Aucune donnée" subtitle="Aucune intervention pour ce filtre." />
          ) : (
            <>
              {/* KPIs : 3 col mobile, 6 col desktop */}
              <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
                <StatCard value={stats.total} label="Interventions" color="var(--primary)" />
                <StatCard value={stats.internGestes} label="Gestes interne" color="var(--text-1)" />
                <StatCard value={stats.patients} label="Patients" color="var(--text-2)" />
                <StatCard value={stats.surgeons} label="Chirurgiens" color="var(--text-2)" />
                <StatCard value={stats.patientGestes} label="Gestes patient" color="var(--text-2)" />
                <StatCard value={avgGestes} label="Gestes / interv." color="var(--text-2)" />
              </div>

              {/* Ligne 1 : Interventions/mois + Répartition spécialité */}
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5">
                <Card>
                  <SectionTitle>Interventions par mois</SectionTitle>
                  <div className="h-[180px] lg:h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perMonth} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                        <Bar dataKey="count" name="Interventions" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Répartition cardiaque / thoracique</SectionTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={34}
                            outerRadius={56}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {pieData.map((s) => (
                              <Cell key={s.type} fill={s.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-lg font-extrabold text-ink-1">{stats.total}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      {split.map((s) => (
                        <div key={s.type} className="mb-2 last:mb-0">
                          <div className="flex justify-between mb-1">
                            <span className="text-[13px] text-ink-1">{s.label}</span>
                            <span className="text-[13px] font-bold" style={{ color: s.color }}>
                              {s.value} {stats.total ? `(${Math.round((s.value / stats.total) * 100)}%)` : ''}
                            </span>
                          </div>
                          <div className="h-[5px] bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: stats.total ? `${(s.value / stats.total) * 100}%` : 0,
                                background: s.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Ligne 2 : Courbe cumulative + Radar profil */}
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5">
                <Card>
                  <SectionTitle>Courbe cumulative</SectionTitle>
                  <div className="h-[200px] lg:h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cumulative} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradCumInt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradCumGestes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                        <Area
                          type="monotone"
                          dataKey="cumCount"
                          name="Interventions"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          fill="url(#gradCumInt)"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumGestes"
                          name="Gestes interne"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          fill="url(#gradCumGestes)"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Radar profil — caché sur mobile (peu lisible) */}
                <Card className="hidden lg:block">
                  <SectionTitle>Profil d'activité</SectionTitle>
                  <div className="h-[200px] lg:h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radar} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 9, fill: 'var(--text-3)' }}
                          tickCount={4}
                          unit="%"
                        />
                        <Radar
                          name="Profil"
                          dataKey="value"
                          stroke="var(--primary)"
                          fill="var(--primary)"
                          fillOpacity={0.18}
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--primary)' }}
                        />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Part']} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-ink-3 mt-1">% des interventions par position et spécialité.</p>
                </Card>
              </div>

              {/* Évolution autonomie (pleine largeur, multi-semestres) */}
              {semestersWithData.length > 1 && (
                <Card>
                  <SectionTitle>Évolution de l'autonomie</SectionTitle>
                  <div className="h-[200px] lg:h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={autonomy} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                        <Tooltip content={<AutonomyTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                        {POSITIONS.map((p) => (
                          <Bar
                            key={p}
                            dataKey={p}
                            stackId="position"
                            name={getPositionStyle(p).short}
                            fill={getPositionStyle(p).color}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-ink-3 mt-1">Part de chaque position par semestre, en %.</p>
                </Card>
              )}

              {/* Ligne 3 : Top gestes + Types interventions */}
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5">
                <Card>
                  <SectionTitle>Top gestes réalisés par l'interne</SectionTitle>
                  <div className="w-full" style={{ height: Math.max(180, topProcs.length * 32), minHeight: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProcs} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                          axisLine={false}
                          tickLine={false}
                          width={88}
                        />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                        <Bar
                          dataKey="count"
                          name="Réalisations"
                          radius={[0, 6, 6, 0]}
                          maxBarSize={20}
                          label={{ position: 'right', fontSize: 11, fill: 'var(--text-2)' }}
                        >
                          {topProcs.map((p) => (
                            <Cell key={p.id} fill={p.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {patientCaseMix.length > 0 && (
                  <Card>
                    <SectionTitle>Types d'interventions les plus fréquents</SectionTitle>
                    <div className="w-full" style={{ height: Math.max(180, patientCaseMix.length * 32), minHeight: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={patientCaseMix}
                          layout="vertical"
                          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
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
                          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                          <Bar
                            dataKey="count"
                            name="Interventions"
                            radius={[0, 6, 6, 0]}
                            maxBarSize={20}
                            label={{ position: 'right', fontSize: 11, fill: 'var(--text-2)' }}
                          >
                            {patientCaseMix.map((p) => (
                              <Cell key={p.id} fill={p.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>

              {/* Ligne 4 : Progression gestes/mois + Répartition par position */}
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-5">
                <Card>
                  <SectionTitle>Progression des actes / mois</SectionTitle>
                  <div className="h-[180px] lg:h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={internPerMonth} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Gestes interne"
                          stroke="var(--accent)"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: 'var(--accent)' }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Répartition par position</SectionTitle>
                  <div className="flex flex-col gap-2.5">
                    {POSITIONS.map((p) => {
                      const st = getPositionStyle(p);
                      const count = stats.positions[p] || 0;
                      const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={p}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[13px] text-ink-1 capitalize">{p}</span>
                            <span className="text-[13px] font-bold" style={{ color: st.color }}>
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-[6px] bg-surface-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: st.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Chirurgiens × position (stacked, remplace l'ancien bar simple) */}
              {surgeonByPos.length > 0 && (
                <Card>
                  <SectionTitle>Chirurgiens — répartition par position</SectionTitle>
                  <div className="w-full" style={{ height: Math.max(180, surgeonByPos.length * 36), minHeight: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={surgeonByPos}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                      >
                        <XAxis
                          type="number"
                          tick={axisTick}
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
                          width={96}
                        />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                        {POSITIONS.map((p) => (
                          <Bar
                            key={p}
                            dataKey={p}
                            stackId="pos"
                            name={getPositionStyle(p).short}
                            fill={getPositionStyle(p).color}
                            maxBarSize={24}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-ink-3 mt-1">
                    Nombre d'interventions par chirurgien, ventilé par position.
                  </p>
                </Card>
              )}

              {/* Matrice semestre × geste (pleine largeur) */}
              <Card padding="p-0">
                <div className="px-4 pt-4 pb-2">
                  <SectionTitle>Matrice semestre × geste</SectionTitle>
                </div>
                {matrix.gestes.length === 0 ? (
                  <p className="px-4 pb-4 text-[13px] text-ink-3">Aucun geste réalisé sur la période.</p>
                ) : (
                  <div className="overflow-x-auto pb-1">
                    <table className="w-full text-[12px] border-collapse">
                      <thead>
                        <tr className="text-ink-3">
                          <th className="text-left font-semibold px-4 py-2 sticky left-0 bg-surface">Geste</th>
                          {matrixSemesters.map((s) => (
                            <th
                              key={s.id}
                              className="font-semibold px-2.5 py-2 text-center whitespace-nowrap"
                            >
                              {s.label}
                            </th>
                          ))}
                          <th className="font-semibold px-3 py-2 text-center">Tot.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.gestes.map((g) => {
                          const rowTotal = matrixSemesters.reduce(
                            (a, s) => a + (matrix.counts[s.id]?.[g.id] || 0),
                            0
                          );
                          return (
                            <tr key={g.id} className="border-t border-line">
                              <td className="px-4 py-2 text-ink-1 sticky left-0 bg-surface">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                                  {g.label}
                                </span>
                              </td>
                              {matrixSemesters.map((s) => {
                                const v = matrix.counts[s.id]?.[g.id] || 0;
                                return (
                                  <td
                                    key={s.id}
                                    className="px-2.5 py-2 text-center"
                                    style={{
                                      color: v ? 'var(--text-1)' : 'var(--text-3)',
                                      fontWeight: v ? 700 : 400,
                                    }}
                                  >
                                    {v || '·'}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center font-extrabold text-primary">
                                {rowTotal}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
              {/* Section exports */}
              <Accordion
                icon={<Database size={18} className="text-primary" />}
                title="Données"
                subtitle="Exports, imports et rapports"
              >
                <ExportSection />
              </Accordion>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
