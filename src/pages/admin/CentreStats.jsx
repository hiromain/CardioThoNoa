import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, EmptyState, Input, Button, ConfirmDialog } from '../../components/ui';
import { Select } from '../../components/ui/Field';
import {
  listInterns,
  listCentres,
  slugify,
  createCentre,
  updateCentre,
  deleteCentre,
} from '../../lib/adminQueries';

const TITRE_OPTIONS = ['Pr.', 'Dr.', ''];

function emptySurgeon() {
  return { title: 'Dr.', firstName: '', lastName: '' };
}

export default function CentreStats() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCentre, setNewCentre] = useState({ name: '', city: '' });
  const [editing, setEditing] = useState(null); // { id, name, city, surgeons }
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function reload() {
    const [r, c] = await Promise.all([listInterns(), listCentres()]);
    setRows(r);
    setCentres(c);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const stats = useMemo(() => {
    const byCentre = new Map();
    centres.forEach((c) =>
      byCentre.set(c.id, { ...c, interns: 0, interventions: 0 })
    );
    byCentre.set('__none', { id: '__none', name: 'Non rattaché', city: null, surgeons: [], interns: 0, interventions: 0 });
    rows.forEach((r) => {
      const key = r.centre_id && byCentre.has(r.centre_id) ? r.centre_id : '__none';
      const b = byCentre.get(key);
      b.interns += 1;
      b.interventions += r.intervention_count || 0;
    });
    return [...byCentre.values()]
      .filter((b) => b.interns > 0 || b.id !== '__none')
      .sort((a, b) => b.interventions - a.interventions);
  }, [rows, centres]);

  const maxInterventions = Math.max(1, ...stats.map((s) => s.interventions));

  async function addCentre() {
    if (!newCentre.name.trim()) return;
    try {
      await createCentre({ name: newCentre.name.trim(), city: newCentre.city.trim() });
      setNewCentre({ name: '', city: '' });
      reload();
    } catch {
      window.alert('Création impossible.');
    }
  }

  function startEdit(c) {
    setEditing({
      id: c.id,
      name: c.name,
      city: c.city || '',
      surgeons: c.surgeons?.length ? c.surgeons.map((s) => ({ ...s })) : [emptySurgeon()],
    });
  }

  function addSurgeonRow() {
    setEditing((v) => ({ ...v, surgeons: [...v.surgeons, emptySurgeon()] }));
  }

  function removeSurgeonRow(idx) {
    setEditing((v) => ({
      ...v,
      surgeons: v.surgeons.length > 1 ? v.surgeons.filter((_, i) => i !== idx) : [emptySurgeon()],
    }));
  }

  function updateSurgeonRow(idx, patch) {
    setEditing((v) => ({
      ...v,
      surgeons: v.surgeons.map((sg, i) => (i === idx ? { ...sg, ...patch } : sg)),
    }));
  }

  async function saveEdit() {
    if (!editing?.name.trim()) return;
    // Ne conserver que les chirurgiens avec au moins un nom de famille.
    const surgeons = editing.surgeons.filter((sg) => sg.lastName.trim());
    try {
      await updateCentre(editing.id, {
        name: editing.name.trim(),
        city: editing.city.trim() || null,
        surgeons,
      });
      setEditing(null);
      reload();
    } catch {
      window.alert('Modification impossible.');
    }
  }

  async function removeCentre() {
    if (!confirmDelete) return;
    try {
      await deleteCentre(confirmDelete.id);
      reload();
    } catch {
      window.alert('Suppression impossible.');
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      <TopBar title="Centres" subtitle="Gestion et statistiques" onBack={() => navigate('/admin')} />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-4xl mx-auto flex flex-col gap-4">

        {/* Ajouter un centre */}
        <Card>
          <h2 className="text-[15px] font-bold text-ink-1 mb-3">Nouveau centre</h2>
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <Input
              label="Nom du centre"
              wrapClassName="flex-1 w-full"
              placeholder="CHU de Lyon — Louis Pradel"
              value={newCentre.name}
              onChange={(e) => setNewCentre((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              label="Ville"
              wrapClassName="sm:w-40 w-full"
              placeholder="Lyon"
              value={newCentre.city}
              onChange={(e) => setNewCentre((s) => ({ ...s, city: e.target.value }))}
            />
            <Button onClick={addCentre} disabled={!newCentre.name.trim()}>
              <Plus size={16} /> Ajouter
            </Button>
          </div>
        </Card>

        {/* Statistiques + gestion */}
        {loading ? (
          <div className="py-10 text-center text-ink-3 text-sm">Chargement…</div>
        ) : stats.length === 0 ? (
          <EmptyState icon="🏥" title="Aucun centre" subtitle="Crée le premier centre ci-dessus." />
        ) : (
          <Card className="flex flex-col gap-1 p-2">
            {stats.map((s) => {
              const isReal = s.id !== '__none';
              const isEditing = editing?.id === s.id;
              const surgeonLine = (s.surgeons ?? [])
                .filter((sg) => sg.lastName?.trim())
                .map((sg) => [sg.title, sg.lastName].filter(Boolean).join(' '))
                .join(' · ');

              if (isEditing) {
                return (
                  <div
                    key={s.id}
                    className="px-3 py-3 rounded-xl border border-primary/30 bg-surface-2 flex flex-col gap-3"
                  >
                    {/* Nom + Ville */}
                    <div className="flex flex-col sm:flex-row gap-2 items-end">
                      <Input
                        label="Nom"
                        wrapClassName="flex-1 w-full"
                        value={editing.name}
                        onChange={(e) => setEditing((v) => ({ ...v, name: e.target.value }))}
                        autoFocus
                      />
                      <Input
                        label="Ville"
                        wrapClassName="sm:w-40 w-full"
                        value={editing.city}
                        onChange={(e) => setEditing((v) => ({ ...v, city: e.target.value }))}
                      />
                    </div>

                    {/* Chirurgiens */}
                    <div>
                      <div className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-2">
                        Chirurgiens du service
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {editing.surgeons.map((sg, i) => (
                          <div key={i} className="flex gap-1.5 items-end">
                            <div className="w-16 shrink-0">
                              <Select
                                label="Titre"
                                value={sg.title}
                                onChange={(e) => updateSurgeonRow(i, { title: e.target.value })}
                                options={TITRE_OPTIONS}
                              />
                            </div>
                            <Input
                              label="Prénom"
                              placeholder="Marie"
                              wrapClassName="w-28 shrink-0"
                              value={sg.firstName}
                              onChange={(e) => updateSurgeonRow(i, { firstName: e.target.value })}
                            />
                            <Input
                              label="Nom"
                              placeholder="Dupont"
                              wrapClassName="flex-1"
                              value={sg.lastName}
                              onChange={(e) => updateSurgeonRow(i, { lastName: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => removeSurgeonRow(i)}
                              className="mb-1 p-1.5 text-ink-3 hover:text-danger shrink-0"
                              aria-label="Supprimer ce chirurgien"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button variant="secondary" size="sm" className="mt-2" onClick={addSurgeonRow}>
                        <Plus size={14} /> Ajouter un chirurgien
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end border-t border-line pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                        <X size={14} /> Annuler
                      </Button>
                      <Button size="sm" onClick={saveEdit} disabled={!editing.name.trim()}>
                        <Check size={14} /> Enregistrer
                      </Button>
                    </div>
                  </div>
                );
              }

              const statContent = (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-semibold text-ink-1">{s.name}</span>
                      {s.city && <span className="text-xs text-ink-3">{s.city}</span>}
                      {isReal && <ChevronRight size={14} className="text-ink-3" />}
                    </div>
                    <span className="text-xs text-ink-3">
                      {s.interns} interne{s.interns > 1 ? 's' : ''} · {s.interventions} interv.
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(s.interventions / maxInterventions) * 100}%` }}
                    />
                  </div>
                  {surgeonLine && (
                    <div className="text-[11px] text-ink-3 mt-1.5 truncate">{surgeonLine}</div>
                  )}
                </>
              );

              return (
                <div key={s.id} className="flex items-start gap-1 rounded-xl hover:bg-surface-2 transition-colors">
                  {isReal ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/centres/${slugify(s.city || s.name)}`)}
                      className="flex-1 text-left px-3 py-2.5"
                    >
                      {statContent}
                    </button>
                  ) : (
                    <div className="flex-1 px-3 py-2.5">{statContent}</div>
                  )}
                  {isReal && (
                    <div className="flex items-center gap-0.5 shrink-0 pt-2.5 pr-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="p-1.5 text-ink-3 hover:text-primary rounded"
                        aria-label="Modifier ce centre"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(s)}
                        className="p-1.5 text-ink-3 hover:text-danger rounded"
                        aria-label="Supprimer ce centre"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer ce centre ?"
        message="Les comptes rattachés seront détachés (non supprimés)."
        confirmLabel="Supprimer"
        danger
        onConfirm={removeCentre}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
