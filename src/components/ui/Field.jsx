import { cx } from '../../lib/cx';

function Label({ label, required }) {
  if (!label) return null;
  return (
    <label className="text-xs font-semibold text-ink-2 uppercase tracking-wide">
      {label}
      {required && ' *'}
    </label>
  );
}

const baseField =
  'px-3.5 py-2.5 rounded-md text-[15px] border-[1.5px] border-line bg-surface text-ink-1 outline-none transition-colors focus:border-primary w-full';

export function Input({ label, required, className = '', wrapClassName = '', ...props }) {
  return (
    <div className={cx('flex flex-col gap-1.5', wrapClassName)}>
      <Label label={label} required={required} />
      <input className={cx(baseField, className)} {...props} />
    </div>
  );
}

export function TextArea({ label, required, className = '', rows = 3, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label label={label} required={required} />
      <textarea rows={rows} className={cx(baseField, 'resize-none', className)} {...props} />
    </div>
  );
}

export function Select({
  label,
  required,
  options = [],
  placeholder,
  value,
  onChange,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label label={label} required={required} />
      <select
        value={value}
        onChange={onChange}
        className={cx(
          baseField,
          'appearance-none bg-no-repeat pr-9',
          !value && 'text-ink-3',
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235B6880' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 12px center',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lab = typeof o === 'string' ? o : o.label;
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          );
        })}
      </select>
    </div>
  );
}
