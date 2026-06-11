import { useEffect, useRef, useState } from 'react';
import { Card } from './Card';

export function StatCard({ value, label, sub, color = 'var(--text-1)', icon, onClick, badge }) {
  const isNumeric = typeof value === 'number';
  const [displayed, setDisplayed] = useState(isNumeric ? 0 : value);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!isNumeric) {
      setDisplayed(value);
      return undefined;
    }
    const end = value;
    const duration = 700;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayed(Math.round(eased * end));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, isNumeric]);

  return (
    <Card
      onClick={onClick}
      padding="p-3.5"
      className="flex-1 min-w-0 anim-scale-in stat-float"
      aria-label={`${value} ${label}`}
    >
      {badge && <div className="absolute top-2 right-2">{badge}</div>}
      <div className="flex flex-col gap-0.5">
        {icon && <span className="text-lg mb-0.5">{icon}</span>}
        <span className="text-[26px] font-extrabold leading-none" style={{ color }} aria-hidden="true">
          {displayed}
        </span>
        <span className="text-[11px] font-semibold text-ink-2 uppercase tracking-wide truncate">
          {label}
        </span>
        {sub && <span className="text-[11px] text-ink-3 truncate">{sub}</span>}
      </div>
    </Card>
  );
}
