import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, ChevronRight, Stethoscope, GraduationCap } from 'lucide-react';
import { useData } from '../store/hooks';
import { useStore } from '../store/useStore';
import {
  byId,
  resolveIntervention,
  patientName,
  patientInitials,
  surgeonName,
  surgeonInitials,
  procLabel,
} from '../lib/queries';
import { getPositionStyle } from '../data/constants';
import { formatDate, ageFromDOB } from '../lib/dates';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { SpecBadge } from '../components/SpecBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/Modal';

function ProcChips({ procs, cfg, emptyLabel, variant = 'accent' }) {
  if (!procs.length) return <p className="text-[13px] text-ink-3">{emptyLabel}</p>;
  const bg = variant === 'neutral' ? 'var(--surface-2)' : 'var(--surface)';
  const color = variant === 'neutral' ? 'var(--text-2)' : cfg.color;
  return (
    <div className="flex flex-wrap gap-2">
      {procs.map((p) => (
        <span
          key={p.id}
          className="px-3 py-1.5 rounded-pill text-[13px] font-semibold"
          style={{ background: bg, color }}
        >
          {procLabel(p)}
        </span>
      ))}
    </div>
  );
}

function SectionCard({ title, count, children }) {
  return (
    <Card>
      <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wide mb-2.5">
        {title}
        {count != null ? ` (${count})` : ''}
      </div>
      {children}
    </Card>
  );
}

export default function InterventionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const deleteIntervention = useStore((s) => s.deleteIntervention);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const raw = byId(data.interventions, id);

  if (!raw) {
    return (
      <div>
        <TopBar title="Intervention introuvable" onBack={() => navigate('/')} />
        <div className="px-4 py-16">
          <EmptyState icon="🔍" title="Cette intervention n'existe plus" />
        </div>
      </div>
    );
  }

  const item = resolveIntervention(data, raw);
  const cfg = item.specialty;
  const age = ageFromDOB(item.patient?.dateOfBirth);
  const pos = getPositionStyle(item.position);

  return (
    <div>
      <TopBar
        title={patientName(item.patient)}
        subtitle={formatDate(item.date)}
        onBack={() => navigate(-1)}
        action={
          <button
            type="button"
            onClick={() => navigate(`/interventions/${id}/modifier`)}
            aria-label="Modifier"
            className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Pencil size={15} className="text-ink-2" />
          </button>
        }
      />

      <div className="px-4 py-4 flex flex-col gap-3.5">
        {/* Patient */}
        <SectionCard title="Patient">
          <button
            type="button"
            onClick={() => item.patient && navigate(`/patients/${item.patient.id}`)}
            className="w-full flex items-center gap-3 text-left row-tap"
          >
            <Avatar initials={patientInitials(item.patient)} size={44} />
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-bold text-ink-1 truncate">{patientName(item.patient)}</div>
              <div className="text-[13px] text-ink-2 mt-0.5">
                {item.patient?.dateOfBirth ? `Né(e) le ${formatDate(item.patient.dateOfBirth)}` : 'DDN non renseignée'}
                {age != null ? ` · ${age} ans` : ''}
              </div>
            </div>
            <ChevronRight size={18} className="text-ink-3 shrink-0" />
          </button>
        </SectionCard>

        {/* Intervention */}
        <SectionCard title="Intervention">
          <div className="flex flex-col gap-2.5">
            <Row label="Spécialité">
              <SpecBadge type={item.service?.type} />
            </Row>
            <Line />
            <Row label="Date">
              <span className="text-[13px] font-semibold text-ink-1">{formatDate(item.date)}</span>
            </Row>
            <Line />
            <Row label="Chirurgien">
              <div className="flex items-center gap-2">
                <Avatar initials={surgeonInitials(item.surgeon)} size={26} />
                <span className="text-[13px] font-semibold text-ink-1">{surgeonName(item.surgeon)}</span>
              </div>
            </Row>
            <Line />
            <Row label="Position">
              <span
                className="text-[12px] font-bold px-2.5 py-1 rounded-pill capitalize"
                style={{ color: pos.color, background: pos.bg }}
              >
                {item.position}
              </span>
            </Row>
            {item.semester && (
              <>
                <Line />
                <Row label="Semestre">
                  <button
                    type="button"
                    onClick={() => navigate(`/semestres/${item.semester.id}`)}
                    className="text-[13px] font-semibold"
                    style={{ color: cfg.color }}
                  >
                    {item.semester.label} — {cfg.label}
                  </button>
                </Row>
              </>
            )}
          </div>
        </SectionCard>

        {/* Gestes patient */}
        <SectionCard
          title={
            <span className="flex items-center gap-1.5">
              <Stethoscope size={13} className="text-ink-3" /> Gestes sur le patient
            </span>
          }
          count={item.patientProcs.length}
        >
          <ProcChips procs={item.patientProcs} cfg={cfg} emptyLabel="Aucun geste renseigné." variant="neutral" />
        </SectionCard>

        {/* Gestes interne */}
        <Card style={{ borderLeft: `4px solid ${cfg.color}`, background: cfg.muted }}>
          <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: cfg.color }}>
            <GraduationCap size={14} />
            Gestes réalisés par l'interne
            {item.internProcs.length ? ` (${item.internProcs.length})` : ''}
          </div>
          <ProcChips procs={item.internProcs} cfg={cfg} emptyLabel="Aucun geste réalisé renseigné." variant="accent" />
        </Card>

        {/* Notes */}
        {item.notes ? (
          <SectionCard title="Notes">
            <p className="text-sm text-ink-1 leading-relaxed">{item.notes}</p>
          </SectionCard>
        ) : null}

        {/* Actions */}
        <div className="flex gap-2.5 mt-1">
          <Button variant="secondary" fullWidth onClick={() => navigate(`/interventions/${id}/modifier`)}>
            <Pencil size={15} /> Modifier
          </Button>
          <Button variant="danger" fullWidth onClick={() => setConfirmDelete(true)}>
            <Trash2 size={15} /> Supprimer
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteIntervention(id);
          navigate(-1);
        }}
        title="Supprimer cette intervention ?"
        message="Cette action est définitive et ne pourra pas être annulée."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-[13px] text-ink-2 shrink-0">{label}</span>
      <div className="text-right min-w-0">{children}</div>
    </div>
  );
}

function Line() {
  return <div className="h-px bg-line" />;
}
