import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, Button, Badge, EmptyState, ConfirmDialog } from '../../components/ui';
import { ProcedureTypeFormModal } from '../../components/forms/ProcedureTypeFormModal';
import { getSpecialty } from '../../data/constants';
import { uid } from '../../lib/id';
import { useStore } from '../../store/useStore';
import { fetchSharedCatalog } from '../../lib/catalog';
import { listCatalog, upsertCatalogType, deleteCatalogType } from '../../lib/adminQueries';

const scopeLabel = (s) => (s === 'intern' ? "Par l'interne" : s === 'patient' ? 'Sur le patient' : 'Les deux');

// Gestion du catalogue de gestes PARTAGÉ (admin). Toute modification est
// répercutée à tous les internes (table `procedure_types`).
export default function CatalogManage() {
  const navigate = useNavigate();
  const setCatalog = useStore((s) => s.setCatalog);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const all = await listCatalog();
    setItems(all);
    // Met aussi à jour le cache partagé du store (gestes non archivés).
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
    return () => {
      alive = false;
    };
  }, []);

  async function handleSubmit(data) {
    setBusy(true);
    try {
      const pt = modal.item ? { ...modal.item, ...data } : { id: uid('pt'), ...data };
      await upsertCatalogType(pt);
      await reload();
    } catch (e) {
      // eslint-disable-next-line no-alert
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
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert('Suppression impossible.');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  const sorted = useMemo(() => items, [items]);

  return (
    <div>
      <TopBar
        title="Catalogue de gestes"
        subtitle="Liste partagée — visible par tous les internes"
        onBack={() => navigate('/admin')}
        action={
          <Button size="sm" onClick={() => setModal({ open: true, item: null })}>
            <Plus size={16} /> Geste
          </Button>
        }
      />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-4xl mx-auto">
        <Card padding="p-0">
          {loading ? (
            <div className="px-5 py-10 text-center text-ink-3 text-sm">Chargement…</div>
          ) : sorted.length === 0 ? (
            <EmptyState icon="✂️" title="Catalogue vide" subtitle="Ajoute un premier geste." />
          ) : (
            <ul className="divide-y divide-line">
              {sorted.map((p) => {
                const cfg = getSpecialty(p.serviceType);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge bg={cfg.light} color={cfg.color}>{p.abbr || p.name}</Badge>
                        {p.archived && <span className="text-[10px] uppercase text-ink-3">archivé</span>}
                      </div>
                      <div className="text-[13px] text-ink-2 truncate mt-1">{p.name}</div>
                      <div className="text-[11px] text-ink-3 truncate">
                        {cfg.label} · {scopeLabel(p.scope)}
                        {p.internSteps?.length ? ` · ${p.internSteps.length} sous-gestes` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModal({ open: true, item: p })}
                      className="p-2 text-ink-3 hover:text-primary"
                      aria-label="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm(p)}
                      className="p-2 text-ink-3 hover:text-danger"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
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
        loading={busy}
        onConfirm={() => handleDelete(confirm)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
