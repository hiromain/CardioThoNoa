import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Archive, ArchiveRestore, Trash2, FileBarChart } from 'lucide-react';
import { useData } from '../store/hooks';
import { useStore } from '../store/useStore';
import {
  byId,
  specialtyForSemester,
  serviceForSemester,
  interventionsForSemester,
  resolveIntervention,
  procLabel,
} from '../lib/queries';
import { formatDate, semesterStatus, STATUS_LABELS } from '../lib/dates';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SpecBadge } from '../components/SpecBadge';
import { SectionTitle } from '../components/Section';
import { InterventionRow } from '../components/InterventionRow';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/Modal';
import { SemesterFormModal } from '../components/forms/SemesterFormModal';

export default function SemestreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const { updateSemester, toggleArchiveSemester, deleteSemester } = useStore();

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sem = byId(data.semesters, id);

  const view = useMemo(() => {
    if (!sem) return null;
    const ints = interventionsForSemester(data, sem.id);
    const gestes = ints.reduce((a, i) => a + (i.internProcedures || []).length, 0);
    const gestesMap = {};
    ints.forEach((i) =>
      (i.internProcedures || []).forEach((pid) => {
        gestesMap[pid] = (gestesMap[pid] || 0) + 1;
      })
    );
    const topEntry = Object.entries(gestesMap).sort((a, b) => b[1] - a[1])[0];
    return {
      ints: ints.map((i) => resolveIntervention(data, i)),
      total: ints.length,
      gestes,
      topGeste: topEntry
        ? { pt: byId(data.procedureTypes, topEntry[0]), count: topEntry[1] }
        : null,
    };
  }, [data, sem]);

  if (!sem) {
    return (
      <div>
        <TopBar title="Semestre introuvable" onBack={() => navigate('/semestres')} />
        <div className="px-4 py-16">
          <EmptyState icon="🔍" title="Ce semestre n'existe plus" />
        </div>
      </div>
    );
  }

  const cfg = specialtyForSemester(data, sem.id);
  const service = serviceForSemester(data, sem.id);
  const obj = sem.objectives || { interventions: 30, gestes: 20 };
  const pct = obj.interventions ? Math.min(100, Math.round((view.total / obj.interventions) * 100)) : 0;
  const status = semesterStatus(sem);

  return (
    <div>
      <TopBar
        title={`${sem.label} — ${cfg.label}`}
        subtitle={service?.name}
        onBack={() => navigate('/semestres')}
        action={
          <div className="flex gap-1.5">
            <IconBtn onClick={() => navigate(`/semestres/${sem.id}/rapport`)} label="Synthèse PDF">
              <FileBarChart size={15} className="text-ink-2" />
            </IconBtn>
            <IconBtn onClick={() => setEditing(true)} label="Modifier">
              <Pencil size={15} className="text-ink-2" />
            </IconBtn>
            <IconBtn onClick={() => toggleArchiveSemester(sem.id)} label="Archiver">
              {sem.archived ? (
                <ArchiveRestore size={15} className="text-ink-2" />
              ) : (
                <Archive size={15} className="text-ink-2" />
              )}
            </IconBtn>
            {view.total === 0 && (
              <IconBtn onClick={() => setConfirmDelete(true)} label="Supprimer">
                <Trash2 size={15} className="text-cardiac" />
              </IconBtn>
            )}
          </div>
        }
      />

      <div className="px-4 py-4 flex flex-col gap-4">
        <Card style={{ borderLeft: `4px solid ${cfg.color}` }}>
          <div className="flex justify-between items-center mb-2">
            <SpecBadge type={service?.type} />
            <StatusPill status={status} />
          </div>
          <InfoLine icon="📍" text={`${service?.name}${service?.city ? ` · ${service.city}` : ''}`} />
          <InfoLine icon="📅" text={`${formatDate(sem.startDate)} → ${formatDate(sem.endDate)}`} />
          {sem.supervisor && <InfoLine icon="🩺" text={`Référent : ${sem.supervisor}`} />}
        </Card>

        <div className="flex gap-2.5">
          <StatCard value={view.total} label="Interventions" sub={`/ ${obj.interventions} obj.`} color={cfg.color} />
          <StatCard value={view.gestes} label="Gestes" sub={`/ ${obj.gestes} obj.`} color="var(--text-1)" />
          <StatCard
            value={`${pct}%`}
            label="Objectif"
            color={pct >= 80 ? '#27AE60' : pct >= 50 ? '#E67E22' : 'var(--text-2)'}
          />
        </div>

        <ProgressBar
          value={view.total}
          max={obj.interventions}
          color={cfg.color}
          height={7}
          label="Progression de l'objectif"
        />

        {view.topGeste && view.topGeste.pt && (
          <Card padding="p-3.5">
            <div className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-1.5">
              Geste le plus fréquent
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-ink-1">{procLabel(view.topGeste.pt)}</span>
              <Badge color={cfg.color} bg={cfg.muted}>
                {view.topGeste.count}×
              </Badge>
            </div>
          </Card>
        )}

        {sem.notes && (
          <Card padding="p-3.5">
            <div className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-1.5">
              Notes du semestre
            </div>
            <p className="text-[13px] text-ink-1 leading-relaxed whitespace-pre-wrap">{sem.notes}</p>
          </Card>
        )}

        <div>
          <SectionTitle>
            {view.total} intervention{view.total > 1 ? 's' : ''}
          </SectionTitle>
          {view.total === 0 ? (
            <Card>
              <EmptyState icon="🏥" title="Aucune intervention" subtitle="Ce semestre est vide pour l'instant." />
            </Card>
          ) : (
            <Card padding="px-4 py-0">
              {view.ints.map((i, idx) => (
                <InterventionRow
                  key={i.id}
                  item={i}
                  last={idx === view.ints.length - 1}
                  onClick={() => navigate(`/interventions/${i.id}`)}
                />
              ))}
            </Card>
          )}
        </div>
      </div>

      <SemesterFormModal
        open={editing}
        onClose={() => setEditing(false)}
        initial={sem}
        onSubmit={(d) => updateSemester(sem.id, d)}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteSemester(sem.id);
          navigate('/semestres');
        }}
        title="Supprimer ce semestre ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}

function IconBtn({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center active:scale-95 transition-transform"
    >
      {children}
    </button>
  );
}

function InfoLine({ icon, text }) {
  return (
    <div className="text-[13px] text-ink-2 mb-1 last:mb-0">
      {icon} {text}
    </div>
  );
}

function StatusPill({ status }) {
  const isCurrent = status === 'en_cours';
  return (
    <span className="text-[11px] font-bold" style={{ color: isCurrent ? '#27AE60' : 'var(--text-3)' }}>
      {STATUS_LABELS[status]}
    </span>
  );
}
