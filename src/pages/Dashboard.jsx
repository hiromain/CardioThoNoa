import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, List, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { useData, useCurrentSemester } from '../store/hooks';
import { useStore } from '../store/useStore';
import { getSpecialty, getPositionStyle, POSITIONS } from '../data/constants';
import {
  resolveIntervention,
  specialtyForSemester,
  interventionsForSemester,
  previousSemester,
} from '../lib/queries';
import { kpis, specialtySplit, topInternProcedures, interventionsPerMonth } from '../lib/stats';
import { formatDate, semesterTimeProgress, semesterStatus, STATUS_LABELS } from '../lib/dates';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Avatar } from '../components/ui/Avatar';
import { SectionTitle } from '../components/Section';
import { InterventionRow } from '../components/InterventionRow';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

function Donut({ split, total }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const [thor, card] = split;
  const cardFrac = total ? card.value / total : 0;
  const thorFrac = total ? thor.value / total : 0;

  // Au montage, animer les arcs de 0 vers leur cible via la classe .donut-arc.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const cardArc = drawn ? circ * cardFrac : 0;
  const thorArc = drawn ? circ * thorFrac : 0;

  return (
    <svg width={64} height={64} viewBox="0 0 64 64" className="shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
      {card.value > 0 && (
        <circle
          className="donut-arc"
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={card.color}
          strokeWidth="12"
          strokeDasharray={`${cardArc} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />
      )}
      {thor.value > 0 && (
        <circle
          className="donut-arc"
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={thor.color}
          strokeWidth="12"
          strokeDasharray={`${thorArc} ${circ}`}
          strokeDashoffset={`-${circ * cardFrac}`}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />
      )}
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const data = useData();
  const semester = useCurrentSemester();
  const syncStatus = useStore((s) => s.syncStatus);

  const semInterventions = useMemo(
    () => (semester ? interventionsForSemester(data, semester.id) : []),
    [data, semester]
  );
  const stats = useMemo(() => kpis(semInterventions), [semInterventions]);
  const split = useMemo(() => specialtySplit(data, data.interventions), [data]);
  const recents = useMemo(
    () => data.interventions.slice(0, 5).map((i) => resolveIntervention(data, i)),
    [data]
  );

  const topGeste = useMemo(
    () => topInternProcedures(data, semInterventions, 1)[0] || null,
    [data, semInterventions]
  );

  const prevStats = useMemo(() => {
    const prev = semester ? previousSemester(data, semester.id) : null;
    if (!prev) return null;
    return kpis(interventionsForSemester(data, prev.id));
  }, [data, semester]);

  // 6 derniers mois d'activité (interventions/mois) pour la sparkline.
  const sparkline = useMemo(() => {
    const months = interventionsPerMonth(data.interventions).slice(-6);
    const counts = months.map((m) => m.count);
    return { months, counts, total: counts.reduce((a, b) => a + b, 0) };
  }, [data.interventions]);

  const cfg = semester ? specialtyForSemester(data, semester.id) : getSpecialty('autre');
  const totalAll = data.interventions.length;
  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir';

  if (!semester) {
    return (
      <div className="px-4 py-16">
        <EmptyState
          icon="🩺"
          title="Aucun semestre"
          subtitle="Créez un semestre pour commencer le suivi de votre formation."
          action={<Button onClick={() => navigate('/semestres')}>Gérer mes semestres</Button>}
        />
      </div>
    );
  }

  const obj = semester.objectives || { interventions: 30, gestes: 20 };
  const timeProg = Math.round(semesterTimeProgress(semester) * 100);
  const status = semesterStatus(semester);

  return (
    <div>
      {/* Header */}
      <div className="header-gradient relative overflow-hidden px-5 pt-safe">
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />
        <div className="orb orb-3" aria-hidden="true" />
        <div className="relative pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[13px] text-white/60">{greeting},</div>
              <div className="text-[22px] font-extrabold text-white">
                Dr {data.profile?.prenom} {data.profile?.nom} 👋
              </div>
            </div>
            <div className="relative shrink-0">
              <Avatar initials={APP_USER.initiales} size={42} color="#fff" bg="rgba(255,255,255,0.15)" />
              <SyncDot status={syncStatus} />
            </div>
          </div>

          {/* Semestre card */}
          <div
            className="glass-premium p-4"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <div className="flex justify-between items-start mb-2.5">
              <div className="min-w-0">
                <div className="text-[11px] text-white/50 font-semibold uppercase tracking-wide">
                  Semestre en cours
                </div>
                <div className="text-[15px] font-bold text-white mt-0.5">
                  {semester.label} — {cfg.label}
                </div>
                <div className="text-xs text-white/60 mt-0.5 truncate">
                  {formatDate(semester.startDate)} – {formatDate(semester.endDate)}
                </div>
              </div>
              <span
                className="shrink-0 px-2.5 py-1 rounded-pill text-[11px] font-bold"
                style={{
                  background: status === 'en_cours' ? 'rgba(39,174,96,0.25)' : 'rgba(255,255,255,0.18)',
                  color: status === 'en_cours' ? '#6BEFA0' : '#fff',
                }}
              >
                {STATUS_LABELS[status].toUpperCase()}
              </span>
            </div>

            <div className="flex gap-2 mb-2">
              <ObjBar label="Interventions" value={stats.total} max={obj.interventions} color="#6BEFA0" />
              <ObjBar label="Gestes" value={stats.internGestes} max={obj.gestes} color="#60AEFE" />
            </div>
            <div className="text-[11px] text-white/40">{timeProg}% du semestre écoulé</div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/interventions/nouvelle')}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-primary font-bold rounded-pill py-3 active:scale-[0.98] transition-transform"
          >
            <Plus size={18} strokeWidth={2.5} /> Nouvelle intervention
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-5 flex flex-col gap-6">
        <div className="anim-fade-up stagger-1">
          <SectionTitle>Ce semestre</SectionTitle>
          <div className="flex gap-2.5">
            <StatCard
              value={stats.total}
              label="Interventions"
              sub={`objectif ${obj.interventions}`}
              color="var(--primary)"
              badge={prevStats ? <Delta diff={stats.total - prevStats.total} /> : null}
            />
            <StatCard
              value={stats.internGestes}
              label="Gestes réalisés"
              sub={`objectif ${obj.gestes}`}
              color={cfg.color}
              badge={prevStats ? <Delta diff={stats.internGestes - prevStats.internGestes} /> : null}
            />
            <StatCard value={stats.surgeons} label="Chirurgiens" color="var(--text-2)" />
          </div>
          {topGeste && (
            <div className="mt-2.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[12px] font-semibold"
                style={{ background: `${topGeste.color}1A`, color: topGeste.color }}
              >
                <span aria-hidden="true">🏆</span>
                <span>Top geste · {topGeste.label}</span>
                <span className="font-bold">×{topGeste.count}</span>
              </span>
            </div>
          )}
        </div>

        {stats.total > 0 && (
          <div className="anim-fade-up stagger-2">
            <SectionTitle>Autonomie</SectionTitle>
            <Card>
              <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-surface-2">
                {POSITIONS.map((pos) => {
                  const count = stats.positions[pos] || 0;
                  if (!count) return null;
                  const pct = (count / stats.total) * 100;
                  return (
                    <div
                      key={pos}
                      style={{ width: `${pct}%`, background: getPositionStyle(pos).color }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-col gap-2">
                {POSITIONS.map((pos) => {
                  const count = stats.positions[pos] || 0;
                  if (!count) return null;
                  const ps = getPositionStyle(pos);
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={pos} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: ps.color }} />
                        <span className="text-[13px] text-ink-1">{ps.short}</span>
                      </div>
                      <span className="text-[13px] font-bold text-ink-1">
                        {count} <span className="text-ink-3 font-semibold">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        <div className="anim-fade-up stagger-2">
          <SectionTitle>Répartition globale</SectionTitle>
          <Card>
            <div className="flex gap-3 items-center">
              <Donut split={split} total={totalAll} />
              <div className="flex-1">
                {split.map((s) => (
                  <div key={s.type} className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-[13px] text-ink-1">{s.label}</span>
                    </div>
                    <span className="text-[13px] font-bold text-ink-1">
                      {s.value} {totalAll ? `(${Math.round((s.value / totalAll) * 100)}%)` : ''}
                    </span>
                  </div>
                ))}
                <div className="h-px bg-line my-2" />
                <div className="flex justify-between">
                  <span className="text-xs text-ink-2">Total toutes périodes</span>
                  <span className="text-xs font-bold text-ink-1">{totalAll} interventions</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {sparkline.counts.length >= 2 && (
          <div className="anim-fade-up stagger-3">
            <SectionTitle>Activité récente</SectionTitle>
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-ink-2">6 derniers mois</span>
                <span className="text-[13px] font-bold text-ink-1">
                  {sparkline.total} interventions
                </span>
              </div>
              <Sparkline counts={sparkline.counts} color="var(--primary)" />
              <span className="sr-only">
                {sparkline.total} interventions réparties sur les 6 derniers mois.
              </span>
            </Card>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/semestres')}
          className="anim-fade-up stagger-3 flex items-center justify-between bg-surface rounded-lg p-4 border border-line shadow-sm active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary/[0.08]">
              <List size={17} className="text-primary" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-ink-1">Mes semestres</div>
              <div className="text-xs text-ink-3">
                {data.semesters.length} semestres · {totalAll} interventions au total
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-ink-3" />
        </button>

        <div className="anim-fade-up stagger-4">
          <SectionTitle
            action={
              <button
                onClick={() => navigate('/patients')}
                className="text-xs text-primary font-semibold"
              >
                Tous les patients
              </button>
            }
          >
            Récentes
          </SectionTitle>
          {recents.length === 0 ? (
            <Card>
              <EmptyState icon="🗓️" title="Aucune intervention" subtitle="Ajoutez votre première intervention." />
            </Card>
          ) : (
            <Card padding="px-4 py-0">
              {recents.map((i, idx) => (
                <InterventionRow
                  key={i.id}
                  item={i}
                  last={idx === recents.length - 1}
                  onClick={() => navigate(`/interventions/${i.id}`)}
                />
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SyncDot({ status }) {
  const map = {
    idle: { Icon: Check, bg: '#27AE60', label: 'Synchronisé', spin: false },
    syncing: { Icon: RefreshCw, bg: '#60AEFE', label: 'Synchronisation…', spin: true },
    pending: { Icon: RefreshCw, bg: '#60AEFE', label: 'Synchronisation…', spin: true },
    error: { Icon: AlertTriangle, bg: '#C0392B', label: 'Erreur de synchronisation', spin: false },
  };
  const cfg = map[status] || map.idle;
  const { Icon } = cfg;
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full"
      style={{ width: 16, height: 16, background: cfg.bg, border: '2px solid var(--primary)' }}
      role="status"
      aria-label={cfg.label}
      title={cfg.label}
    >
      <Icon size={9} strokeWidth={3} color="#fff" className={cfg.spin ? 'animate-spin' : ''} />
    </span>
  );
}

function Sparkline({ counts, color = 'var(--primary)' }) {
  const W = 100;
  const H = 32;
  const pad = 3;
  const max = Math.max(...counts, 1);
  const n = counts.length;
  const points = counts.map((c, i) => {
    const x = n > 1 ? (i / (n - 1)) * (W - pad * 2) + pad : W / 2;
    const y = H - pad - (c / max) * (H - pad * 2);
    return [x, y];
  });
  const poly = points.map(([x, y]) => `${x},${y}`).join(' ');
  const last = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={H}
      className="block"
      aria-hidden="true"
    >
      <polyline
        points={poly}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

function Delta({ diff }) {
  const up = diff > 0;
  const down = diff < 0;
  const color = up ? '#27AE60' : down ? 'var(--text-3)' : 'var(--text-3)';
  const arrow = up ? '▲' : down ? '▼' : '→';
  const sign = up ? `+${diff}` : down ? `${diff}` : '0';
  return (
    <span
      className="text-[10px] font-bold tabular-nums"
      style={{ color }}
      aria-label={`${up ? '+' : down ? '' : ''}${diff} par rapport au semestre précédent`}
    >
      {arrow} {sign}
    </span>
  );
}

function ObjBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-[11px] text-white/50">{label}</span>
        <span className="text-[11px] font-bold text-white">
          {value}/{max}
        </span>
      </div>
      <div className="h-[5px] bg-white/15 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}55` }}
        />
      </div>
    </div>
  );
}
