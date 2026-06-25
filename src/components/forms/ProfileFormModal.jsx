import { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Field';
import { Button } from '../ui/Button';
import { listCentres } from '../../lib/adminQueries';

const empty = { prenom: '', nom: '', initiales: '', promotion: '', hopital: '' };

const BASE_INPUT =
  'px-3.5 py-2.5 rounded-md text-[15px] border-[1.5px] border-line bg-surface text-ink-1 outline-none transition-colors focus:border-primary w-full';

function initialsFrom(prenom, nom) {
  return `${prenom.trim()[0] || ''}${nom.trim()[0] || ''}`.toUpperCase();
}

export function ProfileFormModal({ open, onClose }) {
  const profile       = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const isDemo        = useAuthStore((s) => s.isDemo);
  const [form, setForm]     = useState(empty);
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, ...profile });
    if (!isDemo) {
      listCentres().then(setCentres).catch(() => {});
    }
  }, [open, profile, isDemo]);

  const valid = form.prenom.trim() && form.nom.trim();

  function submit() {
    updateProfile({
      prenom:    form.prenom.trim(),
      nom:       form.nom.trim(),
      initiales: form.initiales.trim().toUpperCase().slice(0, 3) || initialsFrom(form.prenom, form.nom),
      promotion: form.promotion.trim(),
      hopital:   form.hopital.trim(),
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Modifier le profil"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>Annuler</Button>
          <Button fullWidth onClick={submit} disabled={!valid}>Enregistrer</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex gap-2.5">
          <Input
            label="Prénom"
            required
            value={form.prenom}
            onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
          />
          <Input
            label="Nom"
            required
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
          />
        </div>
        <Input
          label="Initiales (avatar)"
          placeholder={initialsFrom(form.prenom, form.nom) || 'NM'}
          maxLength={3}
          value={form.initiales}
          onChange={(e) => setForm((f) => ({ ...f, initiales: e.target.value.toUpperCase() }))}
        />
        <Input
          label="Promotion"
          placeholder="Promo 2024"
          value={form.promotion}
          onChange={(e) => setForm((f) => ({ ...f, promotion: e.target.value }))}
        />
        <HopitalCombobox
          value={form.hopital}
          onChange={(v) => setForm((f) => ({ ...f, hopital: v }))}
          centres={centres}
        />
      </div>
    </Modal>
  );
}

// ── Combobox hôpital ────────────────────────────────────────────────────────

function HopitalCombobox({ value, onChange, centres }) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const wrapRef             = useRef(null);

  // Sync la valeur externe (ouverture de la modale)
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Fermer si clic en dehors
  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const suggestions = centres
    .filter((c) => {
      const q = query.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  const showDropdown = open && suggestions.length > 0;

  function select(name) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  function handleChange(e) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  function clear() {
    setQuery('');
    onChange('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-ink-2 uppercase tracking-wide">
        Hôpital / service
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder={centres.length > 0 ? 'Tapez pour rechercher un établissement…' : 'Ex : CHU de Lyon — Louis Pradel'}
          autoComplete="off"
          className={BASE_INPUT}
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-1 transition-colors"
            aria-label="Effacer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          className="absolute z-50 bg-surface border border-line rounded-xl shadow-lg overflow-hidden"
          style={{ top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: 220, overflowY: 'auto' }}
        >
          {suggestions.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(c.name)}
                className="w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-surface-2 transition-colors"
              >
                <MapPin size={13} className="text-ink-3 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-ink-1 truncate">{c.name}</div>
                  {c.city && (
                    <div className="text-[11px] text-ink-3">{c.city}</div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
