import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../../lib/cx';
import { Card } from './Card';

export function Accordion({ icon, title, subtitle, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card padding="p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
        aria-expanded={open}
      >
        {icon && (
          <div className="w-9 h-9 rounded-md bg-surface-2 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-ink-1">{title}</div>
          {subtitle && <div className="text-xs text-ink-3 truncate">{subtitle}</div>}
        </div>
        {badge}
        <ChevronDown
          size={18}
          className={cx('text-ink-3 transition-transform shrink-0', open && 'rotate-180')}
        />
      </button>
      {open && <div className="border-t border-line p-4 flex flex-col gap-4">{children}</div>}
    </Card>
  );
}
