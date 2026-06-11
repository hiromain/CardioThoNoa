import { useState } from 'react';
import { Check } from 'lucide-react';

// Puce sélectionnable animée (multi-sélection de gestes / types).
export function Chip({ label, selected, onToggle, color = 'var(--primary)', light }) {
  const [pop, setPop] = useState(false);

  function handleClick() {
    setPop(true);
    setTimeout(() => setPop(false), 280);
    onToggle?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[13px] border-[1.5px] select-none transition-colors ${
        pop ? 'chip-pop' : ''
      }`}
      style={{
        fontWeight: selected ? 600 : 500,
        borderColor: selected ? color : 'var(--border)',
        background: selected ? light || 'rgba(30,58,95,0.08)' : 'var(--surface)',
        color: selected ? color : 'var(--text-2)',
      }}
    >
      {selected && <Check size={13} strokeWidth={2.6} />}
      {label}
    </button>
  );
}
