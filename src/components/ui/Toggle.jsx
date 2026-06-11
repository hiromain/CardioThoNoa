export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange?.(!checked)}
      className="relative shrink-0 rounded-pill transition-colors duration-200"
      style={{
        width: 46,
        height: 26,
        background: checked ? 'var(--primary)' : 'var(--border)',
      }}
    >
      <span
        className="absolute top-[3px] rounded-full bg-white transition-[left] duration-200"
        style={{ left: checked ? 23 : 3, width: 20, height: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
      />
    </button>
  );
}
