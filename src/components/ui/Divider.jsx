export function Divider({ label, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 my-1.5 ${className}`}>
      <div className="flex-1 h-px bg-line" />
      {label && (
        <span className="text-[11px] text-ink-3 font-semibold uppercase tracking-wide">{label}</span>
      )}
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}
