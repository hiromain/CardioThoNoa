import { useMemo, useState } from 'react';
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
} from 'recharts';
import { useData } from '../store/hooks';
import { serviceForSemester } from '../lib/queries';
import {
  kpis,
  interventionsPerMonth,
  specialtySplit,
  topInternProcedures,
  internProceduresPerMonth,
  semesterProcedureMatrix,
} from '../lib/stats';
import { getSpecialty, getPositionStyle, POSITIONS } from '../data/constants';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { SectionTitle } from '../components/Section';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState } from '../components/ui/EmptyState';

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 12,
  color: 'var(--text-1)',
  boxShadow: 'var(--shadow-md)',
};
const axisTick = { fontSize: 10, fill: 'var(--text-3)' };

export default function Statistics() {
  const data = useData();
  const [period, setPeriod] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const sortedSemesters = useMemo(
    () => [...data.semesters].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [data.semesters]
  );

  const periodOptions = [
    ...sortedSemesters.map((s) => ({ value: s.id, label: s.label })),
    { value: 'all', label: 'Tout' },
  ];

  const filtered = useMemo(() => {
    let list = data.interventions;
    if (period !== 'all') list = list.filter((i) => i.semesterId === period);
    if (typeFilter !== 'all') {
      list = list.filter((i) => serviceForSemester(data, i.semesterId)?.type === typeFilter);
    }
    return list;
  }, [data, period, typeFilter]);

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

  const pieData = split.filter((s) => s.value > 0);
  const currentSem = data.semesters.find((s) => s.id === period);

  return (
    <div>
      <TopBar
        title="Statistiques"
        subtitle={currentSem ? `${currentSem.label} — ${getSpecialty(serviceForSemester(data, currentSem.id)?.type).label}` : 'Toutes périodes'}
      />

      <div className="px-4 py-4 flex flex-col gap-5">
        {/* Filters */}
        <div className="flex flex-col gap-2.5">
          <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} />
          <SegmentedControl
            options={[
              { value: 'all', label: 'Toutes' },
              { value: 'cardiaque', label: '🫀 Cardiaque' },
              { value: 'thoracique', label: '🫁 Thoracique' },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            activeColor={typeFilter === 'cardiaque' ? '#C0392B' : typeFilter === 'thoracique' ? '#2171B5' : 'var(--primary)'}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📊" title="Aucune donnée" subtitle="Aucune intervention pour ce filtre." />
        ) : (
          <>
            {/* KPIs */}
            <div className="flex gap-2.5">
              <StatCard value={stats.total} label="Interventions" color="var(--primary)" />
              <StatCard value={stats.internGestes} label="Gestes interne" color="var(--text-1)" />
              <StatCard value={stats.patients} label="Patients" color="var(--text-2)" />
            </div>

            {/* 1. Interventions par mois */}
            <Card>
              <SectionTitle>Interventions par mois</SectionTitle>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={perMonth} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
                  <Bar dataKey="count" name="Interventions" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 2. Répartition spécialité */}
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
                          style={{ width: stats.total ? `${(s.value / stats.total) * 100}%` : 0, background: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 3. Top gestes interne */}
            <Card>
              <SectionTitle>Top gestes réalisés par l'interne</SectionTitle>
              <ResponsiveContainer width="100%" height={Math.max(140, topProcs.length * 30)}>
                <BarChart
                  data={topProcs}
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
                  <Bar dataKey="count" name="Réalisations" radius={[0, 6, 6, 0]} maxBarSize={20} label={{ position: 'right', fontSize: 11, fill: 'var(--text-2)' }}>
                    {topProcs.map((p) => (
                      <Cell key={p.id} fill={p.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 4. Progression mensuelle des actes */}
            <Card>
              <SectionTitle>Progression des actes / mois</SectionTitle>
              <ResponsiveContainer width="100%" height={180}>
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
            </Card>

            {/* Répartition par position */}
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
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: st.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 5. Matrice semestre × geste */}
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
                          <th key={s.id} className="font-semibold px-2.5 py-2 text-center whitespace-nowrap">
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
                                  style={{ color: v ? 'var(--text-1)' : 'var(--text-3)', fontWeight: v ? 700 : 400 }}
                                >
                                  {v || '·'}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2 text-center font-extrabold text-primary">{rowTotal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
