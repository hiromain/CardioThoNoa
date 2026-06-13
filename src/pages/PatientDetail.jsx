import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useData } from '../store/hooks';
import { useStore } from '../store/useStore';
import {
  aggregatePatients,
  resolveIntervention,
  byId,
  procLabel,
} from '../lib/queries';
import { getSpecialty, EPICARD_URL } from '../data/constants';
import { formatDate, formatDateShort, ageFromDOB } from '../lib/dates';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Toggle } from '../components/ui/Toggle';
import { SectionTitle } from '../components/Section';
import { SpecBadge } from '../components/SpecBadge';
import { InterventionRow } from '../components/InterventionRow';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/Modal';
import { PatientFormModal } from '../components/forms/PatientFormModal';

function avatarColors(specialties) {
  const hasC = specialties.includes('cardiaque');
  const hasT = specialties.includes('thoracique');
  if (hasC && hasT) return { color: '#6C3483', bg: 'rgba(108,52,131,0.12)' };
  if (hasC) return { color: '#C0392B', bg: 'rgba(192,57,43,0.12)' };
  if (hasT) return { color: '#2171B5', bg: 'rgba(33,113,181,0.12)' };
  return { color: 'var(--text-2)', bg: 'var(--surface-2)' };
}

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const { updatePatient, deletePatient } = useStore();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patient = useMemo(
    () => aggregatePatients(data).find((p) => p.id === id),
    [data, id]
  );

  const gestes = useMemo(() => {
    if (!patient) return [];
    const map = {};
    patient.interventions.forEach((i) =>
      (i.internProcedures || []).forEach((pid) => {
        map[pid] = (map[pid] || 0) + 1;
      })
    );
    return Object.entries(map).map(([pid, count]) => ({
      pt: byId(data.procedureTypes, pid),
      count,
    }));
  }, [patient, data]);

  if (!patient) {
    return (
      <div>
        <TopBar title="Patient introuvable" onBack={() => navigate('/patients')} />
        <div className="px-4 py-16">
          <EmptyState icon="🔍" title="Ce patient n'existe plus" />
        </div>
      </div>
    );
  }

  const age = ageFromDOB(patient.dateOfBirth);
  const initials = `${patient.firstName[0] || ''}${patient.lastName[0] || ''}`.toUpperCase();
  const { color, bg } = avatarColors(patient.specialties);
  const totalGestes = patient.interventions.reduce(
    (a, i) => a + (i.internProcedures || []).length,
    0
  );
  const resolved = patient.interventions.map((i) => resolveIntervention(data, i));

  return (
    <div>
      <TopBar
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle={age != null ? `${age} ans · DDN ${formatDate(patient.dateOfBirth)}` : `DDN ${formatDate(patient.dateOfBirth)}`}
        onBack={() => navigate('/patients')}
        action={
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Modifier"
            className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Pencil size={15} className="text-ink-2" />
          </button>
        }
      />

      <div className="px-4 py-4 flex flex-col gap-3.5">
        <Card>
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold shrink-0"
              style={{ color, background: bg }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-extrabold text-ink-1 truncate">
                {patient.firstName} {patient.lastName}
              </div>
              <div className="text-[13px] text-ink-2 mt-0.5">
                {patient.dateOfBirth ? `Né(e) le ${formatDate(patient.dateOfBirth)}` : 'DDN non renseignée'}
                {age != null ? ` · ${age} ans` : ''}
              </div>
              {patient.specialties.length > 0 && (
                <div className="flex gap-1.5 mt-1.5">
                  {patient.specialties.map((sp) => (
                    <SpecBadge key={sp} type={sp} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {patient.specialties.includes('cardiaque') && (
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-ink-1">Saisi dans Epicard</div>
                <div className="text-xs text-ink-3 mt-0.5">Base nationale de chirurgie cardiaque</div>
              </div>
              <Toggle
                checked={!!patient.epicardDone}
                onChange={(v) => updatePatient(patient.id, { epicardDone: v })}
              />
            </div>
            <a
              href={EPICARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-primary py-2 rounded-md border-[1.5px]"
              style={{ borderColor: 'var(--border)' }}
            >
              Ouvrir Epicard <ExternalLink size={14} />
            </a>
          </Card>
        )}

        <div className="flex gap-2.5">
          <StatCard value={patient.count} label="Interventions" color="var(--primary)" />
          <StatCard value={totalGestes} label="Gestes interne" color="var(--text-1)" />
          <StatCard
            value={patient.lastDate ? formatDateShort(patient.lastDate) : '—'}
            label="Dernière"
            color="var(--text-2)"
          />
        </div>

        {gestes.length > 0 && (
          <Card padding="p-3.5">
            <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wide mb-2.5">
              Gestes réalisés par l'interne
            </div>
            <div className="flex flex-wrap gap-1.5">
              {gestes.map(({ pt, count }) => {
                if (!pt) return null;
                const cfg = getSpecialty(pt.serviceType);
                return (
                  <span
                    key={pt.id}
                    className="px-2.5 py-1 rounded-pill text-xs font-semibold inline-flex items-center gap-1"
                    style={{ background: cfg.muted, color: cfg.color }}
                  >
                    {procLabel(pt)}
                    {count > 1 && (
                      <span
                        className="text-[10px] rounded-pill px-1.5 text-white"
                        style={{ background: cfg.color }}
                      >
                        ×{count}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </Card>
        )}

        <div>
          <SectionTitle>
            {patient.count} intervention{patient.count > 1 ? 's' : ''}
          </SectionTitle>
          <Card padding="px-4 py-0">
            {resolved.map((i, idx) => (
              <InterventionRow
                key={i.id}
                item={i}
                last={idx === resolved.length - 1}
                onClick={() => navigate(`/interventions/${i.id}`)}
              />
            ))}
          </Card>
        </div>

        {patient.count === 0 && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-cardiac py-2.5"
          >
            <Trash2 size={15} /> Supprimer ce patient
          </button>
        )}
      </div>

      <PatientFormModal
        open={editing}
        onClose={() => setEditing(false)}
        initial={patient}
        onSubmit={(d) => updatePatient(patient.id, d)}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePatient(patient.id);
          navigate('/patients');
        }}
        title="Supprimer ce patient ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}
