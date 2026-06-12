import { cx } from '../../lib/cx';

export function Card({ children, className = '', onClick, padding = 'p-4', style, ...rest }) {
  return (
    <div
      onClick={onClick}
      style={style}
      {...rest}
      className={cx(
        'glass-card rounded-lg shadow-sm relative overflow-hidden',
        onClick && 'card-hover cursor-pointer',
        padding,
        className
      )}
    >
      {children}
    </div>
  );
}
