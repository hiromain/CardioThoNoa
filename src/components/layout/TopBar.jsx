import { ArrowLeft } from 'lucide-react';

export function TopBar({ title, subtitle, onBack, action }) {
  return (
    <div className="glass sticky top-0 z-50 flex items-center gap-2.5 px-4 py-2.5 border-b border-line min-h-[52px] pt-safe">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <ArrowLeft size={16} className="text-ink-1" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-ink-1 leading-tight truncate">{title}</div>
        {subtitle && <div className="text-xs text-ink-2 truncate mt-0.5">{subtitle}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
