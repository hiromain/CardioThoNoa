import { useMemo, useState } from 'react';
import { UserPlus, Search, X, Check } from 'lucide-react';
import { ageFromDOB, formatDate } from '../lib/dates';
import { patientInitials, patientName } from '../lib/queries';
import { Input } from './ui/Field';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';

// Saisie de l'identité d'un nouveau patient (mode par défaut), avec
// possibilité de basculer vers la recherche d'un patient déjà existant.
export function PatientPicker({ patients, value, onSelect, onCreate }) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(true);
  const [draft, setDraft] = useState({ firstName: '', lastName: '', dateOfBirth: '' });

  const selected = value ? patients.find((p) => p.id === value) : null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...patients].sort((a, b) =>
      `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
    );
    if (!q) return sorted.slice(0, 6);
    return sorted
      .filter(
        (p) =>
          p.lastName.toLowerCase().includes(q) ||
          p.firstName.toLowerCase().includes(q) ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [patients, query]);

  function startCreate() {
    const parts = query.trim().split(' ');
    setDraft({
      firstName: parts.length > 1 ? parts[0] : '',
      lastName: parts.length > 1 ? parts.slice(1).join(' ').toUpperCase() : query.trim().toUpperCase(),
      dateOfBirth: '',
    });
    setCreating(true);
  }

  function confirmCreate() {
    const id = onCreate({
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      dateOfBirth: draft.dateOfBirth,
    });
    onSelect(id);
    setCreating(false);
    setQuery('');
  }

  // ── Patient sélectionné ─────────────────────────────────────────────────────
  if (selected) {
    const age = ageFromDOB(selected.dateOfBirth);
    return (
      <div className="flex items-center gap-3 p-3 rounded-md border-[1.5px] border-primary/40 bg-surface-2">
        <Avatar initials={patientInitials(selected)} size={40} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-ink-1 truncate">
            {patientName(selected)}
          </div>
          <div className="text-xs text-ink-2">
            {selected.dateOfBirth ? `Né(e) le ${formatDate(selected.dateOfBirth)}` : 'Date de naissance non renseignée'}
            {age != null ? ` · ${age} ans` : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="shrink-0 text-xs font-semibold text-primary px-3 py-1.5 rounded-pill bg-surface"
        >
          Changer
        </button>
      </div>
    );
  }

  // ── Identité du patient (mode par défaut) ───────────────────────────────────
  if (creating) {
    const valid = draft.firstName.trim() && draft.lastName.trim();
    return (
      <div className="p-3 rounded-md border-[1.5px] border-line bg-surface-2 flex flex-col gap-3">
        <span className="text-[13px] font-semibold text-ink-1 flex items-center gap-1.5">
          <UserPlus size={15} /> Identité du patient
        </span>
        <div className="flex gap-2.5">
          <Input
            label="Prénom"
            value={draft.firstName}
            onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
            placeholder="Marie"
          />
          <Input
            label="Nom"
            value={draft.lastName}
            onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
            placeholder="DUPONT"
          />
        </div>
        <Input
          label="Date de naissance"
          type="date"
          value={draft.dateOfBirth}
          onChange={(e) => setDraft((d) => ({ ...d, dateOfBirth: e.target.value }))}
        />
        <Button onClick={confirmCreate} disabled={!valid} fullWidth>
          <Check size={16} /> Valider le patient
        </Button>
        <button
          type="button"
          onClick={() => setCreating(false)}
          className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-primary py-2 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <Search size={15} /> Patient déjà enregistré ? Rechercher
        </button>
      </div>
    );
  }

  // ── Recherche ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 bg-surface rounded-md px-3 py-2.5 border-[1.5px] border-line focus-within:border-primary transition-colors">
        <Search size={16} className="text-ink-3 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un patient…"
          className="flex-1 bg-transparent text-sm text-ink-1 outline-none min-w-0"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-ink-3 shrink-0">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="rounded-md border border-line overflow-hidden divide-y divide-line">
        {results.map((p) => {
          const age = ageFromDOB(p.dateOfBirth);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className="row-tap w-full flex items-center gap-3 px-3 py-2.5 text-left !mx-0"
            >
              <Avatar initials={patientInitials(p)} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink-1 truncate">
                  {p.firstName} <span className="font-bold">{p.lastName}</span>
                </div>
                <div className="text-[11px] text-ink-3">
                  {age != null ? `${age} ans` : 'âge n.c.'}
                </div>
              </div>
            </button>
          );
        })}
        {results.length === 0 && (
          <div className="px-3 py-3 text-[13px] text-ink-3 text-center">
            Aucun patient ne correspond.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={startCreate}
        className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-primary py-2 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <UserPlus size={15} />
        {query.trim() ? `Créer « ${query.trim()} »` : 'Nouveau patient'}
      </button>
    </div>
  );
}
