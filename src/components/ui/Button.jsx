import { cx } from '../../lib/cx';

const VARIANTS = {
  primary: 'bg-primary text-white',
  secondary: 'bg-surface-2 text-ink-1 border border-line',
  ghost: 'bg-transparent text-ink-2',
  danger: 'bg-cardiac/10 text-cardiac',
  success: 'bg-success/15 text-success',
};

const SIZES = {
  sm: 'text-[13px] px-3.5 py-1.5 gap-1.5',
  md: 'text-sm px-5 py-2.5 gap-1.5',
  lg: 'text-base px-7 py-3.5 gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center font-semibold rounded-pill select-none',
        'transition-transform duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none outline-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
