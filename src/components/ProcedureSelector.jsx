import { procLabel } from '../lib/queries';
import { Chip } from './ui/Chip';

// Multi-sélection de gestes à partir d'une liste de ProcedureType.
// variant 'accent' : puces colorées selon la spécialité (mise en avant).
// variant 'neutral' : puces grises discrètes (information de contexte).
export function ProcedureSelector({
  procedures,
  selectedIds,
  onChange,
  color = 'var(--primary)',
  light,
  emptyHint = 'Aucun geste disponible pour ce service.',
  variant = 'accent',
}) {
  function toggle(id) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  if (!procedures.length) {
    return <p className="text-[13px] text-ink-3">{emptyHint}</p>;
  }

  const chipColor = variant === 'neutral' ? 'var(--text-2)' : color;
  const chipLight = variant === 'neutral' ? 'var(--surface-2)' : light;

  return (
    <div className="flex flex-wrap gap-2">
      {procedures.map((p) => (
        <Chip
          key={p.id}
          label={procLabel(p)}
          selected={selectedIds.includes(p.id)}
          onToggle={() => toggle(p.id)}
          color={chipColor}
          light={chipLight}
        />
      ))}
    </div>
  );
}
