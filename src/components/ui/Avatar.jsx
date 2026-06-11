export function Avatar({ initials, size = 32, color = 'var(--primary)', bg = 'rgba(30,58,95,0.1)' }) {
  return (
    <div
      className="avatar-ring flex items-center justify-center rounded-full font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: bg,
        color,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials}
    </div>
  );
}
