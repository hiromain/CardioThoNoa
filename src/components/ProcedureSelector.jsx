import { useRef, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { procLabel } from '../lib/queries';
import { Chip } from './ui/Chip';

// Multi-sélection de gestes à partir d'une liste de ProcedureType.
// variant 'accent' : puces colorées selon la spécialité (mise en avant).
// variant 'neutral' : puces grises discrètes (information de contexte).
// onAddProcedure (facultatif) : callback(name) qui crée un nouveau geste
//   de façon définitive (comme dans les réglages) et renvoie son id. Quand
//   fourni, une puce « + Autre geste » permet de saisir un geste à la main.
export function ProcedureSelector({
  procedures,
  selectedIds,
  onChange,
  color = 'var(--primary)',
  light,
  emptyHint = 'Aucun geste disponible pour ce service.',
  variant = 'accent',
  onAddProcedure,
  addLabel = '+ Autre geste',
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  function toggle(id) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  function startAdding() {
    setName('');
    setAdding(true);
    // Focus une fois le champ monté.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function confirmAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    const newId = onAddProcedure(trimmed);
    if (newId) {
      onChange([...selectedIds, newId]);
    }
    setName('');
    setAdding(false);
  }

  function cancelAdd() {
    setName('');
    setAdding(false);
  }

  const chipColor = variant === 'neutral' ? 'var(--text-2)' : color;
  const chipLight = variant === 'neutral' ? 'var(--surface-2)' : light;

  // Aucun geste dispo ET pas de possibilité d'en ajouter → simple message.
  if (!procedures.length && !onAddProcedure) {
    return <p className="text-[13px] text-ink-3">{emptyHint}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {!procedures.length && (
        <p className="text-[13px] text-ink-3">{emptyHint}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
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

        {onAddProcedure && !adding && (
          <button
            type="button"
            onClick={startAdding}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill border border-dashed text-[13px] font-semibold text-ink-2 transition-colors hover:text-ink-1"
            style={{ borderColor: 'var(--border)' }}
          >
            <Plus size={14} /> {addLabel.replace(/^\+\s*/, '')}
          </button>
        )}

        {onAddProcedure && adding && (
          <span
            className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-pill border"
            style={{ borderColor: chipColor }}
          >
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmAdd();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelAdd();
                }
              }}
              placeholder="Nom du geste…"
              className="bg-transparent text-[13px] text-ink-1 outline-none w-36 placeholder:text-ink-3"
            />
            <button
              type="button"
              onClick={confirmAdd}
              className="w-6 h-6 flex items-center justify-center rounded-full text-white shrink-0"
              style={{ background: chipColor }}
              aria-label="Ajouter le geste"
            >
              <Check size={14} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={cancelAdd}
              className="w-6 h-6 flex items-center justify-center rounded-full text-ink-3 shrink-0"
              aria-label="Annuler"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
