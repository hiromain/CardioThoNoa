export function EmptyState({ icon = '📋', title, subtitle, action }) {
  return (
    <div className="text-center px-5 py-10 text-ink-3">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-[15px] font-semibold text-ink-2 mb-1.5">{title}</div>
      {subtitle && <div className="text-[13px] mb-4">{subtitle}</div>}
      {action}
    </div>
  );
}
