import { ClipboardCheck, ClipboardX } from 'lucide-react';
import { ageFromDOB, formatDateShort } from '../lib/dates';
import { useStore } from '../store/useStore';
import { SpecBadge } from './SpecBadge';

function avatarColors(specialties) {
  const hasC = specialties.includes('cardiaque');
  const hasT = specialties.includes('thoracique');
  if (hasC && hasT) return { color: '#6C3483', bg: 'rgba(108,52,131,0.12)' };
  if (hasC) return { color: '#C0392B', bg: 'rgba(192,57,43,0.12)' };
  if (hasT) return { color: '#2171B5', bg: 'rgba(33,113,181,0.12)' };
  return { color: 'var(--text-2)', bg: 'var(--surface-2)' };
}

export function PatientRow({ patient, onClick, last = false }) {
  const updatePatient = useStore((s) => s.updatePatient);
  const age = ageFromDOB(patient.dateOfBirth);
  const initials = `${patient.firstName[0] || ''}${patient.lastName[0] || ''}`.toUpperCase();
  const { color, bg } = avatarColors(patient.specialties);
  const showEpicard = patient.specialties.includes('cardiaque');

  return (
    <button
      type="button"
      onClick={onClick}
      className="row-tap w-full flex items-center gap-3 py-3 text-left"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[15px] font-bold"
        style={{ color, background: bg }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-ink-1 mb-0.5 truncate">
          {patient.firstName} <span className="font-extrabold">{patient.lastName}</span>
        </div>
        <div className="text-xs text-ink-3 flex gap-2">
          {age != null && <span>{age} ans</span>}
          <span>·</span>
          <span>DDN {formatDateShort(patient.dateOfBirth)}</span>
        </div>
        {(patient.specialties.length > 0 || showEpicard) && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {patient.specialties.map((sp) => (
              <SpecBadge key={sp} type={sp} small />
            ))}
            {showEpicard && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  updatePatient(patient.id, { epicardDone: !patient.epicardDone });
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-semibold"
                style={{
                  color: patient.epicardDone ? '#27AE60' : '#E67E22',
                  background: patient.epicardDone ? 'rgba(39,174,96,0.12)' : 'rgba(230,126,34,0.12)',
                }}
              >
                {patient.epicardDone ? <ClipboardCheck size={11} /> : <ClipboardX size={11} />}
                Epicard {patient.epicardDone ? 'fait' : 'à saisir'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
        <span
          className="text-lg font-extrabold leading-none"
          style={{ color: patient.count > 1 ? 'var(--primary)' : 'var(--text-2)' }}
        >
          {patient.count}
        </span>
        <span className="text-[10px] text-ink-3 font-semibold uppercase">
          {patient.count > 1 ? 'interv.' : 'interv.'}
        </span>
        {patient.lastDate && (
          <span className="text-[11px] text-ink-3">{formatDateShort(patient.lastDate)}</span>
        )}
      </div>
    </button>
  );
}
