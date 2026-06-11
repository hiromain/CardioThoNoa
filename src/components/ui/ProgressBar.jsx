export function ProgressBar({ value, max, color = 'var(--primary)', height = 6, label, showValue = true, glow = false }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-ink-2">{label}</span>}
          {showValue && (
            <span className="text-xs font-bold ml-auto" style={{ color }}>
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className="bg-surface-2 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: glow ? `0 0 6px ${color}55` : undefined,
          }}
        />
      </div>
    </div>
  );
}
