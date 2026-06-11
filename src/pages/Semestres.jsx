import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useData } from '../store/hooks';
import { useStore } from '../store/useStore';
import { APP_USER } from '../data/constants';
import {
  specialtyForSemester,
  serviceForSemester,
  interventionsForSemester,
} from '../lib/queries';
import { formatDate, semesterStatus, STATUS_LABELS } from '../lib/dates';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SpecBadge } from '../components/SpecBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { SemesterFormModal } from '../components/forms/SemesterFormModal';

export default function Semestres() {
  const navigate = useNavigate();
  const data = useData();
  const addSemester = useStore((s) => s.addSemester);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    return [...data.semesters]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((sem) => {
        const ints = interventionsForSemester(data, sem.id);
        const gestes = ints.reduce((a, i) => a + (i.internProcedures || []).length, 0);
        const obj = sem.objectives || { interventions: 30, gestes: 20 };
        const pct = obj.interventions
          ? Math.min(100, Math.round((ints.length / obj.interventions) * 100))
          : 0;
        return {
          sem,
          cfg: specialtyForSemester(data, sem.id),
          service: serviceForSemester(data, sem.id),
          total: ints.length,
          gestes,
          obj,
          pct,
          status: semesterStatus(sem),
        };
      });
  }, [data]);

  return (
    <div>
      <TopBar
        title="Mes semestres"
        subtitle={`${APP_USER.prenom} ${APP_USER.nom} · ${APP_USER.hopital}`}
        action={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 bg-primary text-white rounded-pill px-3 py-1.5 text-xs font-semibold active:scale-95 transition-transform"
          >
            <Plus size={15} strokeWidth={2.6} /> Nouveau
          </button>
        }
      />

      <div className="px-4 py-4 flex flex-col gap-3">
        {rows.length === 0 && (
          <Card>
            <EmptyState
              icon="🗓️"
              title="Aucun semestre"
              subtitle="Créez votre premier semestre pour commencer."
            />
          </Card>
        )}

        {rows.map(({ sem, cfg, service, total, gestes, obj, pct, status }) => (
          <Card
            key={sem.id}
            padding="p-0"
            onClick={() => navigate(`/semestres/${sem.id}`)}
            className={sem.archived ? 'opacity-60' : ''}
          >
            <div className="h-1" style={{ width: `${pct}%`, background: cfg.color }} />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base font-extrabold text-ink-1">{sem.label}</span>
                    <span className="text-[15px] text-ink-2 font-medium truncate">— {cfg.label}</span>
                  </div>
                  <div className="text-xs text-ink-3 truncate">{service?.name}</div>
                  <div className="text-xs text-ink-3 mt-0.5">
                    {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <SpecBadge type={service?.type} />
                  <StatusPill status={status} />
                </div>
              </div>

              <div className="flex gap-4 mb-2.5 py-2 border-t border-line">
                <Stat value={total} label="Interventions" color={cfg.color} />
                <div className="w-px bg-line" />
                <Stat value={gestes} label="Gestes" color="var(--text-1)" />
                <div className="w-px bg-line" />
                <Stat value={`${pct}%`} label="Objectif" color="var(--text-1)" />
              </div>

              <ProgressBar value={total} max={obj.interventions} color={cfg.color} height={5} />
            </div>
          </Card>
        ))}
      </div>

      <SemesterFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={(d) => addSemester(d)}
      />
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div className="text-center flex-1">
      <div className="text-xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px] text-ink-3 font-semibold uppercase">{label}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const isCurrent = status === 'en_cours';
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-pill"
      style={{
        color: isCurrent ? '#27AE60' : 'var(--text-3)',
        background: isCurrent ? 'rgba(39,174,96,0.12)' : 'var(--surface-2)',
      }}
    >
      {STATUS_LABELS[status].toUpperCase()}
    </span>
  );
}
