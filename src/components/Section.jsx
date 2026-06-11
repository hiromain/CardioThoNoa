export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[13px] font-bold text-ink-2 uppercase tracking-wide">{children}</span>
      {action}
    </div>
  );
}

export function FormSection({ title, icon, subtitle, children, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <div className="flex items-center gap-1.5 mb-1">
          {icon}
          <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">{title}</div>
        </div>
      )}
      {subtitle && <div className="text-[12px] text-ink-3 mb-2.5">{subtitle}</div>}
      <div className={`flex flex-col gap-3.5 ${subtitle ? '' : 'mt-3'}`}>{children}</div>
    </div>
  );
}
