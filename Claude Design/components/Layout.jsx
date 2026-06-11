// CardioThoNoa — Layout components
// Exports: BottomNav, TopBar, Screen, FAB, SectionTitle, FormSection

const { useState, useRef, useEffect } = React;

// ── BottomNav ─────────────────────────────────────────────────────────────────
function BottomNav({ active, onNavigate, onNew }) {
  const tabs = [
    { id: 'dashboard', label: 'Accueil',  icon: 'home'     },
    { id: 'stats',     label: 'Stats',    icon: 'chart'    },
    { id: 'patients',  label: 'Patients', icon: 'people'   },
    { id: 'settings',  label: 'Réglages', icon: 'settings' },
  ];

  const [prev, setPrev] = useState(active);
  const [bouncing, setBouncing] = useState(null);

  function handleNav(id) {
    if (id === active) return;
    setPrev(active);
    setBouncing(id);
    setTimeout(() => setBouncing(null), 400);
    onNavigate(id);
  }

  // FAB rotate state
  const [fabPressed, setFabPressed] = useState(false);

  return (
    <div className="glass" style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 80, paddingBottom: 20,
      display: 'flex', alignItems: 'center',
      zIndex: 100,
    }}>
      {tabs.map((tab, i) => {
        const isActive = active === tab.id;
        const isBouncing = bouncing === tab.id;
        const insertFAB = i === 2;
        return (
          <React.Fragment key={tab.id}>
            {insertFAB && (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="fab-wrap">
                  <button
                    onClick={e => { onNew(e); }}
                    style={{
                      width: 50, height: 50, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1E3A5F 0%, #2a5298 100%)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(30,58,95,0.5)',
                      transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease',
                      position: 'relative', zIndex: 1,
                      transform: fabPressed ? 'scale(0.87) rotate(45deg)' : 'scale(1) rotate(0deg)',
                    }}
                    onMouseDown={() => setFabPressed(true)}
                    onMouseUp={() => setFabPressed(false)}
                    onTouchStart={() => setFabPressed(true)}
                    onTouchEnd={() => setFabPressed(false)}>
                    <Icon name="plus" color="#fff" size={22} />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => handleNav(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--primary)' : 'var(--text-3)',
                transition: 'color 0.2s ease',
                paddingBottom: 4,
                position: 'relative',
              }}>
              <div style={{
                transform: isBouncing ? 'translateY(-4px) scale(1.2)' : isActive ? 'translateY(-1px) scale(1.05)' : 'translateY(0) scale(1)',
                transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <Icon name={tab.icon} size={20} color={isActive ? 'var(--primary)' : 'var(--text-3)'} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.2,
                transition: 'font-weight 0.15s ease',
              }}>{tab.label}</span>
              {/* Active dot indicator */}
              <div style={{
                width: 4, height: 4,
                borderRadius: '50%',
                background: 'var(--primary)',
                position: 'absolute',
                bottom: 2,
                transform: isActive ? 'scale(1)' : 'scale(0)',
                opacity: isActive ? 1 : 0,
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
              }} />
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ title, subtitle, onBack, action }) {
  const [backHovered, setBackHovered] = useState(false);
  return (
    <div className="glass" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px 10px',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky', top: 0, zIndex: 50,
      minHeight: 52,
    }}>
      {onBack && (
        <button
          onClick={onBack}
          onMouseEnter={() => setBackHovered(true)}
          onMouseLeave={() => setBackHovered(false)}
          style={{
            background: backHovered ? 'var(--surface-2)' : 'rgba(0,0,0,0.04)',
            border: 'none', cursor: 'pointer',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            transform: backHovered ? 'translateX(-2px) scale(1.08)' : 'scale(1)',
          }}>
          <Icon name="back" size={16} color="var(--text-1)" />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
function Screen({ children, style, scrollable = true }) {
  return (
    <div style={{
      flex: 1,
      overflowY: scrollable ? 'auto' : 'hidden',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{children}</span>
      {action && <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>{action}</span>}
    </div>
  );
}

// ── FormSection ───────────────────────────────────────────────────────────────
function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {title && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
        }}>{title}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

// ── SpecToggle ────────────────────────────────────────────────────────────────
function SpecToggle({ value, onChange }) {
  const options = ['Cardiaque', 'Thoracique'];
  const activeIdx = options.indexOf(value);

  return (
    <div style={{ position: 'relative', display: 'flex', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 3, gap: 2 }}>
      {/* Sliding background pill */}
      <div style={{
        position: 'absolute',
        top: 3, bottom: 3,
        left: `calc(${activeIdx * 50}% + 3px)`,
        width: 'calc(50% - 5px)',
        borderRadius: 'calc(var(--r-md) - 2px)',
        background: getSpecialiteConfig(value).color,
        transition: 'left 0.28s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease',
        boxShadow: `0 3px 10px ${getSpecialiteConfig(value).color}55`,
        zIndex: 0,
      }} />
      {options.map(sp => {
        const active = value === sp;
        return (
          <button key={sp} onClick={() => onChange(sp)} style={{
            flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
            borderRadius: 'calc(var(--r-md) - 2px)',
            background: 'transparent',
            color: active ? '#fff' : 'var(--text-2)',
            fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13,
            transition: 'color 0.22s ease',
            position: 'relative', zIndex: 1,
          }}>
            {sp === 'Cardiaque' ? '🫀' : '🫁'} {sp}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  BottomNav, TopBar, Screen, SectionTitle, FormSection, SpecToggle,
});
