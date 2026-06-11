export function SegmentedControl({ options, value, onChange, activeColor = 'var(--primary)', className = '' }) {
  return (
    <div className={`flex bg-surface-2 rounded-md p-[3px] gap-0.5 ${className}`}>
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        const active = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className="flex-1 py-1.5 px-1 rounded-[10px] text-[13px] font-semibold transition-colors"
            style={{
              background: active ? activeColor : 'transparent',
              color: active ? '#fff' : 'var(--text-2)',
            }}
          >
            {lab}
          </button>
        );
      })}
    </div>
  );
}
