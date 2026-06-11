import { patientName, procLabel } from '../lib/queries';
import { formatDateShort } from '../lib/dates';
import { getPositionStyle } from '../data/constants';
import { SpecBadge } from './SpecBadge';

// `item` = intervention résolue (resolveIntervention).
export function InterventionRow({ item, onClick, last = false }) {
  const cfg = item.specialty;
  const procs = item.patientProcs.map(procLabel).join(', ') || '—';
  const pos = getPositionStyle(item.position);

  return (
    <button
      type="button"
      onClick={onClick}
      className="row-tap w-full flex items-center gap-3 py-3 text-left"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 text-lg"
        style={{ background: cfg.muted }}
      >
        {cfg.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink-1 mb-0.5 truncate">
          {patientName(item.patient)}
        </div>
        <div className="text-xs text-ink-2 truncate">{procs}</div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <span className="text-[11px] text-ink-3">{formatDateShort(item.date)}</span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-pill"
          style={{ color: pos.color, background: pos.bg }}
        >
          {pos.short}
        </span>
      </div>
    </button>
  );
}
