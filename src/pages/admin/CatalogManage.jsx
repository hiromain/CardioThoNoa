import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, Button, Badge, EmptyState, ConfirmDialog } from '../../components/ui';
import { ProcedureTypeFormModal } from '../../components/forms/ProcedureTypeFormModal';
import { getSpecialty, SPECIALTIES } from '../../data/constants';
import { uid } from '../../lib/id';
import { useStore } from '../../store/useStore';
import { fetchSharedCatalog } from '../../lib/catalog';
import { listCatalog, upsertCatalogType, deleteCatalogType } from '../../lib/adminQueries';

const scopeLabel = (s) =>
  s === 'intern' ? "Interne" : s === 'patient' ? 'Patient' : 'Les deux';

const SCOPE_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'both', label: 'Les deux' },
  { value: 'intern', label: 'Interne' },
  { value: 'patient', label: 'Patient' },
];

const SPECIALTY_ORDER = ['cardiaque', 'thoracique', 'congenitale', 'autre'];

export default function CatalogManage() {
  const navigate = useNavigate();
  const setCatalog = useStore((s) => s.setCatalog);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [openGroups, setOpenGroups] = useState(
    Object.fromEntries(SPECIALTY_ORDER.map((k) => [k, true]))
  );

  async function reload() {
    const all = await listCatalog();
    setItems(all);
    const shared = await fetchSharedCatalog();
    if (shared) setCatalog(shared);
  }

  useEffect(() => {
    let alive = true;
    listCatalog().then((all) => {
      if (!alive) return;
      setItems(all);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  async function handleSubmit(data) {
    setBusy(true);
    try {
      const pt = modal.item ? { ...modal.item, ...data } : { id: uid('pt'), ...data };
      await upsertCatalogType(pt);
      await reload();
    } catch {
      window.alert("Échec de l'enregistrement. Vérifie tes droits administrateur.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item) {
    setBusy(true);
    try {
      await deleteCatalogType(item.id);
      await reload();
    } catch {
      window.alert('Suppression impossible.');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  function toggleGroup(key) {
    setOpenGroups((s) => ({ ...s, [key]: !s[key] }));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((p) => {
      if (scopeFilter && p.scope !== scopeFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.abbr || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, scopeFilter]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(SPECIALTY_ORDER.map((k) => [k, { main: [], steps: [] }]));
    filtered.forEach((p) => {
      const key = SPECIALTY_ORDER.includes(p.serviceType) ? p.serviceType : 'autre';
      if (p.scope === 'intern') map[key].steps.push(p);
      else map[key].main.push(p);
    });
    return map;
  }, [filtered]);

  const total = filtered.length;
  const isFiltering = search || scopeFilter;

  return (
    <div>
      <TopBar
        title="Catalogue de gestes"
        subtitle={`${total} geste${total > 1 ? 's' : ''} · partagé avec tous les internes`}
        onBack={() => navigate('/admin')}
        action={
          <Button size="sm" onClick={() => setModal({ open: true, item: null })}>
            <Plus size={16} /> Geste
          </Button>
        }
      />

      {/* Barre de filtres */}
      <div className="sticky top-[52px] z-40 glass border-b border-line px-4 py-2.5 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="search"
            placeholder="Rechercher un geste…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[14px] border border-line bg-surface text-ink-1 outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="text-[13px] px-2.5 py-1.5 rounded-lg border border-line bg-surface text-ink-1 outline-none focus:border-primary transition-colors shrink-0"
        >
          {SCOPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(search || scopeFilter) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setScopeFilter(''); }}
            className="text-[12px] font-semibold text-ink-3 hover:text-ink-1 shrink-0 transition-colors"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-4xl mx-auto flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[120, 96, 140, 96].map((h, i) => (
              <div key={i} className="rounded-xl skeleton" style={{ height: h }} />
            ))}
          </div>
        ) : total === 0 ? (
          <EmptyState icon="🔍" title="Aucun geste" subtitle={isFiltering ? 'Modifie les filtres.' : 'Ajoute un premier geste.'} />
        ) : (
          SPECIALTY_ORDER.map((key) => {
            const group = grouped[key];
            const count = group.main.length + group.steps.length;
            if (count === 0) return null;
            const cfg = getSpecialty(key);
            const isOpen = openGroups[key];

            return (
              <Card key={key} padding="p-0">
                {/* En-tête du groupe */}
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className="flex-1 text-[15px] font-bold" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-ink-3 font-medium">
                    {group.main.length} intervention{group.main.length > 1 ? 's' : ''}
                    {group.steps.length > 0 && ` · ${group.steps.length} sous-geste${group.steps.length > 1 ? 's' : ''}`}
                  </span>
                  {isOpen
                    ? <ChevronDown size={16} className="text-ink-3 shrink-0" />
                    : <ChevronRight size={16} className="text-ink-3 shrink-0" />
                  }
                </button>

                {isOpen && (
                  <div className="border-t border-line">
                    {/* Interventions principales */}
                    {group.main.length > 0 && (
                      <>
                        <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-ink-3 bg-surface-2 font-semibold">
                          Interventions
                        </div>
                        {group.main.map((p) => (
                          <ProcedureRow
                            key={p.id}
                            p={p}
                            cfg={cfg}
                            onEdit={() => setModal({ open: true, item: p })}
                            onDelete={() => setConfirm(p)}
                          />
                        ))}
                      </>
                    )}
                    {/* Sous-gestes */}
                    {group.steps.length > 0 && (
                      <>
                        <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-ink-3 bg-surface-2 font-semibold border-t border-line">
                          Sous-gestes réalisés par l'interne
                        </div>
                        {group.steps.map((p) => (
                          <ProcedureRow
                            key={p.id}
                            p={p}
                            cfg={cfg}
                            step
                            onEdit={() => setModal({ open: true, item: p })}
                            onDelete={() => setConfirm(p)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <ProcedureTypeFormModal
        open={modal.open}
        onClose={() => setModal({ open: false, item: null })}
        initial={modal.item}
        allProcedures={items}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!confirm}
        title="Supprimer ce geste ?"
        message="Il disparaîtra du catalogue de tous les internes. Les interventions déjà saisies ne sont pas modifiées."
        confirmLabel="Supprimer"
        danger
        onConfirm={() => handleDelete(confirm)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function ProcedureRow({ p, cfg, step, onEdit, onDelete }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-line last:border-b-0 ${step ? 'bg-surface/40' : ''}`}>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {step && <span className="w-1 h-1 rounded-full shrink-0" style={{ background: cfg.color, opacity: 0.5 }} />}
        <span
          className={`font-semibold truncate ${step ? 'text-[13px] text-ink-2' : 'text-[14px] text-ink-1'}`}
        >
          {p.abbr && p.abbr !== p.name ? (
            <>
              <span style={{ color: cfg.color }}>{p.abbr}</span>
              <span className="text-ink-3 ml-1.5 font-normal">{p.name}</span>
            </>
          ) : (
            p.name
          )}
        </span>
      </div>
      <span className="text-[11px] text-ink-3 shrink-0 hidden sm:inline">
        {scopeLabel(p.scope)}
        {p.internSteps?.length ? ` · ${p.internSteps.length} étapes` : ''}
      </span>
      {p.archived && (
        <span className="text-[10px] uppercase text-ink-3 shrink-0">archivé</span>
      )}
      <button
        type="button"
        onClick={onEdit}
        className="p-1.5 text-ink-3 hover:text-primary shrink-0"
        aria-label="Modifier"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 text-ink-3 hover:text-danger shrink-0"
        aria-label="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
