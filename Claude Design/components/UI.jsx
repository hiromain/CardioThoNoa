// CardioThoNoa — Base UI Components
// Exports to window: Btn, Card, Badge, SpecBadge, Chip, Avatar, Input, Select, TextArea,
//                    Divider, EmptyState, ProgressBar, StatCard, GestesGrid

const { useState, useEffect, useRef } = React;

// ── Button ────────────────────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', fullWidth, onClick, disabled, style }) {
  const btnRef = useRef(null);

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font)', fontWeight: 600, border: 'none', cursor: 'pointer',
    borderRadius: 'var(--r-pill)', transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
    width: fullWidth ? '100%' : undefined, outline: 'none', userSelect: 'none',
    fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14,
    padding: size === 'sm' ? '6px 14px' : size === 'lg' ? '14px 28px' : '10px 20px',
    opacity: disabled ? 0.45 : 1,
    position: 'relative', overflow: 'hidden',
    ...style,
  };
  const variants = {
    primary:   { background: 'linear-gradient(135deg, #1E3A5F 0%, #2a5298 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(30,58,95,0.35)' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent', color: 'var(--text-2)' },
    danger:    { background: 'linear-gradient(135deg, #FDECEA, #fce4e1)', color: '#C0392B' },
    cardiac:   { background: 'linear-gradient(135deg, #C0392B 0%, #e05c4a 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(192,57,43,0.35)' },
    thoracic:  { background: 'linear-gradient(135deg, #2171B5 0%, #3a8fd1 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(33,113,181,0.35)' },
  };

  function handleClick(e) {
    if (disabled) return;
    const btn = btnRef.current;
    if (btn) {
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      const rect = btn.getBoundingClientRect();
      circle.className = 'ripple-wave';
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top  = `${e.clientY - rect.top  - radius}px`;
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    }
    onClick && onClick(e);
  }

  return (
    <button
      ref={btnRef}
      className="btn-ripple"
      style={{ ...base, ...variants[variant] }}
      onClick={handleClick}
      disabled={disabled}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}
      onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
      onTouchEnd={e => { e.currentTarget.style.transform = ''; }}>
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style, onClick, padding = 16, className = '', glass = false }) {
  const clickClass = onClick ? 'card-hover' : '';
  const glassClass = glass ? 'glass-premium' : '';
  return (
    <div
      className={`${clickClass} ${glassClass} ${className}`.trim()}
      onClick={onClick}
      style={{
        background: glass ? undefined : 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        boxShadow: glass ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: glass ? undefined : '1px solid rgba(0,0,0,0.04)',
        padding, position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 'var(--r-pill)',
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      color: color || 'var(--text-2)',
      background: bg || 'var(--surface-2)',
      ...style,
    }}>{label}</span>
  );
}

// ── Specialité badge ──────────────────────────────────────────────────────────
function SpecBadge({ specialite, small }) {
  const cfg = getSpecialiteConfig(specialite);
  return (
    <Badge label={specialite}
      color={cfg.color}
      bg={cfg.colorMuted}
      style={{ fontSize: small ? 10 : 11 }} />
  );
}

// ── Chip (selectable) ─────────────────────────────────────────────────────────
function Chip({ label, selected, onToggle, color, colorLight }) {
  const [animating, setAnimating] = useState(false);

  function handleClick() {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onToggle && onToggle();
  }

  const style = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
    fontSize: 13, fontWeight: selected ? 600 : 500,
    border: `1.5px solid ${selected ? color || 'var(--primary)' : 'var(--border)'}`,
    background: selected ? (colorLight || 'rgba(30,58,95,0.08)') : 'var(--surface)',
    color: selected ? (color || 'var(--primary)') : 'var(--text-2)',
    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
    transform: animating ? 'scale(1.14)' : selected ? 'scale(1.03)' : 'scale(1)',
    userSelect: 'none',
  };

  return (
    <span style={style} onClick={handleClick}>
      {selected && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {label}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initiales, size = 32, color = 'var(--primary)', bg }) {
  return (
    <div className="avatar-ring" style={{
      width: size, height: size, borderRadius: '50%',
      background: bg || 'rgba(30,58,95,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color,
      flexShrink: 0,
      transition: 'box-shadow 0.22s ease',
      cursor: 'default',
    }}>{initiales}</div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
const inputSharedStyle = {
  padding: '11px 14px', borderRadius: 'var(--r-md)', fontSize: 15,
  border: '1.5px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-1)', fontFamily: 'var(--font)', outline: 'none',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
};

function Input({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}{required && ' *'}</label>}
      <input
        className="input-glow"
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={inputSharedStyle}
        onFocus={e => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.12)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function Select({ label, value, onChange, options, placeholder, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}{required && ' *'}</label>}
      <select
        className="input-glow"
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          ...inputSharedStyle,
          color: value ? 'var(--text-1)' : 'var(--text-3)',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235B6880' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.12)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── TextArea ──────────────────────────────────────────────────────────────────
function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>}
      <textarea
        className="input-glow"
        value={value} placeholder={placeholder} rows={rows}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputSharedStyle, resize: 'none' }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px rgba(30,58,95,0.12)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {label && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon || '📋'}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13 }}>{subtitle}</div>}
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color, height = 6, label }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  const barColor = color || 'var(--primary)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        {label && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>}
        <span style={{ fontSize: 12, fontWeight: 700, color: barColor, marginLeft: 'auto' }}>{value}/{max}</span>
      </div>
      <div style={{ height, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${displayPct}%`, borderRadius: 999,
          background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          transition: 'width 0.9s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 6px ${barColor}55`,
        }} />
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ value, label, sub, color, icon, onClick }) {
  const isNumeric = typeof value === 'number';
  const [displayed, setDisplayed] = useState(isNumeric ? 0 : value);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!isNumeric) { setDisplayed(value); return; }
    let start = 0;
    const end = value;
    const duration = 700;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayed(Math.round(eased * end));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return (
    <Card onClick={onClick} style={{ flex: 1, minWidth: 0 }} padding={14} className="anim-scale-in stat-float">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {icon && <span style={{ fontSize: 18, marginBottom: 2 }}>{icon}</span>}
        <span className="stat-num" style={{ fontSize: 26, fontWeight: 800, color: color || 'var(--text-1)', lineHeight: 1 }}>
          {displayed}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</span>}
      </div>
    </Card>
  );
}

// ── GestesGrid (animated multi-select) ───────────────────────────────────────
function GestesGrid({ specialite, selected, onChange }) {
  const cfg = getSpecialiteConfig(specialite);
  const gestes = cfg ? cfg.gestes : [];

  function toggle(label) {
    const next = selected.includes(label)
      ? selected.filter(g => g !== label)
      : [...selected, label];
    onChange(next);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {gestes.map(g => (
        <Chip
          key={g.id}
          label={g.label}
          selected={selected.includes(g.label)}
          onToggle={() => toggle(g.label)}
          color={cfg.color}
          colorLight={cfg.colorMuted}
        />
      ))}
    </div>
  );
}

// ── Intervention Row ──────────────────────────────────────────────────────────
function InterventionRow({ intervention, onClick }) {
  const cfg = getSpecialiteConfig(intervention.specialite);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      className="row-tap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'gap 0.18s ease',
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--r-md)',
        background: cfg.colorMuted,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hovered ? `0 4px 10px ${cfg.color}30` : 'none',
      }}>
        <span style={{ fontSize: 18 }}>{intervention.specialite === 'Cardiaque' ? '🫀' : '🫁'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
          {intervention.patient.prenom} {intervention.patient.nom}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {intervention.gestes.join(', ')}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatDateShort(intervention.date)}</div>
        <SpecBadge specialite={intervention.specialite} small />
      </div>
      <div style={{
        width: 4, height: 4, borderRadius: '50%',
        background: cfg.color,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        flexShrink: 0,
      }} />
    </div>
  );
}

// ── Icon SVG set ──────────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor' }) {
  const paths = {
    home:     <path d="M3 12L12 3l9 9M5 10v9h4v-5h6v5h4v-9" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    chart:    <path d="M4 18V10M8 18V6M12 18v-8M16 18V4M20 18v-6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>,
    list:     <><path d="M8 6h13M8 12h13M8 18h13" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="3" cy="6" r="1.5" fill={color}/><circle cx="3" cy="12" r="1.5" fill={color}/><circle cx="3" cy="18" r="1.5" fill={color}/></>,
    settings: <><circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" fill="none" stroke={color} strokeWidth="1.8"/></>,
    plus:     <path d="M12 5v14M5 12h14" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>,
    back:     <path d="M19 12H5M12 19l-7-7 7-7" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    chevron:  <path d="M9 18l6-6-6-6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    check:    <path d="M20 6L9 17l-5-5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>,
    edit:     <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>,
    trash:    <><polyline points="3 6 5 6 21 6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke={color} strokeWidth="1.8"/><line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8"/></>,
    person:   <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="7" r="4" fill="none" stroke={color} strokeWidth="1.8"/></>,
    people:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" fill="none" stroke={color} strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {paths[name] || null}
    </svg>
  );
}

Object.assign(window, {
  Btn, Card, Badge, SpecBadge, Chip, Avatar, Input, Select, TextArea,
  Divider, EmptyState, ProgressBar, StatCard, GestesGrid, InterventionRow, Icon,
});
