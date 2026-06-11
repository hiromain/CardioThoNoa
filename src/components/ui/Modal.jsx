import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 'max-w-app' }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 anim-scale-in" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} bg-surface rounded-t-xl sm:rounded-xl shadow-lg max-h-[90vh] flex flex-col anim-fade-up`}
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-3 border-b border-line">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-ink-1 leading-tight">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-2 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-ink-2"
            aria-label="Fermer"
          >
            <X size={17} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line flex gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  danger = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            fullWidth
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-2 leading-relaxed">{message}</p>
    </Modal>
  );
}
