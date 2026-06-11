import { cx } from '../../lib/cx';

export function Badge({ children, color, bg, className = '', style }) {
  return (
    <span
      className={cx(
        'inline-flex items-center px-2.5 py-[3px] rounded-pill text-[11px] font-semibold tracking-wide',
        !bg && 'bg-surface-2',
        !color && 'text-ink-2',
        className
      )}
      style={{ color, background: bg, ...style }}
    >
      {children}
    </span>
  );
}
