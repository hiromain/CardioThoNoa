import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Trash2, Pencil, Check, X, Building2 } from 'lucide-react';
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

const TITRE_OPTIONS = ['Dr.', 'Pr.', ''];

function emptySurgeon() {
  return { title: 'Dr.', firstName: '', lastName: '' };
}

export default function CentreStats() {
  const navigate = useNavigate();
  const [rows, setRows]             = useState([]);
  const [centres, setCentres]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [newCentre, setNewCentre]   = useState({ name: '', city: '' });
  const [editing, setEditing]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function reload() {
    const [r, c] = await Promise.all([listInterns(), listCentres()]);
    setRows(r);
    setCentres(c);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => {
    const byCentre = new Map();
    centres.forEach((c) =>
      byCentre.set(c.id, { ...c, interns: 0, interventions: 0 })
    );
    byCentre.set('__none', {
      id: '__none', name: 'Non rattaché', city: null, surgeons: [],
      interns: 0, interventions: 0,
    });
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

  const totalInternes = useMemo(
    () => rows.filter((r) => r.role !== 'admin').length,
    [rows]
  );
  const totalInterventions = useMemo(
    () => rows.reduce((a, r) => a + (r.intervention_count || 0), 0),
    [rows]
  );

  async function addCentre() {
    if (!newCentre.name.trim()) return;
    try {
      await createCentre({ name: newCentre.name.trim(), city: newCentre.city.trim() });
      setNewCentre({ name: '', city: '' });
      setShowForm(false);
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
      <TopBar
        title="Centres"
        onBack={() => navigate('/admin')}
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-full bg-primary text-white active:scale-95 transition-transform"
          >
            <Plus size={14} />
            Nouveau
          </button>
        }
      />

      <div className="px-4 py-4 lg:px-8 lg:py-6 max-w-4xl mx-auto flex flex-col gap-4">

        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <div key={i} className="rounded-xl h-16 skeleton" />)}
            </div>
            <div className="rounded-xl h-64 skeleton" />
          </div>
        ) : (
          <>
            {/* ── Stats ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 anim-fade-up">
              <MiniStat value={centres.length} label="Centres" icon={Building2} />
              <MiniStat value={totalInternes} label="Internes" />
              <MiniStat value={totalInterventions} label="Interventions" />
            </div>

            {/* ── Formulaire nouveau centre ─────────────────────────────── */}
            {showForm && (
              <Card className="anim-fade-up">
                <h2 className="text-[14px] font-bold text-ink-1 mb-3">Nouveau centre</h2>
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <Input
                    label="Nom du centre"
                    wrapClassName="flex-1 w-full"
                    placeholder="CHU de Lyon — Louis Pradel"
                    value={newCentre.name}
                    onChange={(e) => setNewCentre((s) => ({ ...s, name: e.target.value }))}
                    autoFocus
                  />
                  <Input
                    label="Ville"
                    wrapClassName="sm:w-36 w-full"
                    placeholder="Lyon"
                    value={newCentre.city}
                    onChange={(e) => setNewCentre((s) => ({ ...s, city: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addCentre} disabled={!newCentre.name.trim()}>
                      <Plus size={16} /> Ajouter
                    </Button>
                    <Button variant="ghost" onClick={() => setShowForm(false)}>
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Liste des centres ─────────────────────────────────────── */}
            {stats.length === 0 ? (
              <EmptyState icon="🏥" title="Aucun centre" subtitle="Crée le premier centre." />
            ) : (
              <Card padding="p-0" className="anim-fade-up stagger-1">
                <ul className="divide-y divide-line">
                  {stats.map((s) => {
                    const isReal    = s.id !== '__none';
                    const isEditing = editing?.id === s.id;
                    const surgeonLine = (s.surgeons ?? [])
                      .filter((sg) => sg.lastName?.trim())
                      .map((sg) => [sg.title, sg.lastName].filter(Boolean).join(' '))
                      .join(' · ');

                    if (isEditing) {
                      return (
                        <li key={s.id}>
                          <div className="px-4 py-4 flex flex-col gap-3 bg-surface-2">
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
                                wrapClassName="sm:w-36 w-full"
                                value={editing.city}
                                onChange={(e) => setEditing((v) => ({ ...v, city: e.target.value }))}
                              />
                            </div>

                            {/* Chirurgiens */}
                            <div>
                              <div className="text-[11px] font-bold text-ink-3 uppercase tracking-widest mb-2">
                                Chirurgiens du service
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {editing.surgeons.map((sg, i) => (
                                  <div key={i} className="flex gap-1.5 items-end">
                                    <div className="w-16 shrink-0">
                                      <Select
                                        label={i === 0 ? 'Titre' : undefined}
                                        value={sg.title}
                                        onChange={(e) => updateSurgeonRow(i, { title: e.target.value })}
                                        options={TITRE_OPTIONS}
                                      />
                                    </div>
                                    <Input
                                      label={i === 0 ? 'Prénom' : undefined}
                                      placeholder="Marie"
                                      wrapClassName="w-28 shrink-0"
                                      value={sg.firstName}
                                      onChange={(e) => updateSurgeonRow(i, { firstName: e.target.value })}
                                    />
                                    <Input
                                      label={i === 0 ? 'Nom' : undefined}
                                      placeholder="Dupont"
                                      wrapClassName="flex-1"
                                      value={sg.lastName}
                                      onChange={(e) => updateSurgeonRow(i, { lastName: e.target.value })}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeSurgeonRow(i)}
                                      className={`p-1.5 text-ink-3 hover:text-accent shrink-0 ${i === 0 ? 'mb-0.5' : ''}`}
                                      aria-label="Supprimer ce chirurgien"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={addSurgeonRow}
                                className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
                              >
                                <Plus size={13} /> Ajouter un chirurgien
                              </button>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 justify-end border-t border-line pt-3">
                              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                                <X size={14} /> Annuler
                              </Button>
                              <Button size="sm" onClick={saveEdit} disabled={!editing.name.trim()}>
                                <Check size={14} /> Enregistrer
                              </Button>
                            </div>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={s.id}>
                        <div className="flex items-center gap-1 hover:bg-surface-2 transition-colors">
                          {isReal ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/centres/${slugify(s.city || s.name)}`)}
                              className="flex-1 text-left px-4 py-3.5 group"
                            >
                              <CentreRow
                                s={s}
                                maxInterventions={maxInterventions}
                                surgeonLine={surgeonLine}
                                isReal={isReal}
                              />
                            </button>
                          ) : (
                            <div className="flex-1 px-4 py-3.5">
                              <CentreRow
                                s={s}
                                maxInterventions={maxInterventions}
                                surgeonLine={surgeonLine}
                                isReal={isReal}
                              />
                            </div>
                          )}

                          {isReal && (
                            <div className="flex items-center gap-0.5 shrink-0 pr-3">
                              <button
                                type="button"
                                onClick={() => startEdit(s)}
                                className="p-1.5 text-ink-3 hover:text-primary rounded transition-colors"
                                aria-label="Modifier ce centre"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(s)}
                                className="p-1.5 text-ink-3 hover:text-accent rounded transition-colors"
                                aria-label="Supprimer ce centre"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </>
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

// ── Composants locaux ───────────────────────────────────────────────────────

function CentreRow({ s, maxInterventions, surgeonLine, isReal }) {
  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-[14px] font-semibold ${isReal ? 'text-ink-1 group-hover:text-primary transition-colors' : 'text-ink-3'}`}>
            {s.name}
          </span>
          {s.city && <span className="text-[11px] text-ink-3 hidden sm:inline">{s.city}</span>}
          {isReal && <ChevronRight size={13} className="text-ink-3 group-hover:text-primary transition-colors" />}
        </div>
        <span className="text-[12px] text-ink-3 shrink-0">
          <span className="font-bold text-ink-1 mr-1">{s.interns}</span>
          int. ·
          <span className="font-bold text-ink-1 mx-1">{s.interventions}</span>
          interv.
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${(s.interventions / maxInterventions) * 100}%` }}
        />
      </div>
      {surgeonLine && (
        <div className="text-[11px] text-ink-3 mt-1.5 truncate">{surgeonLine}</div>
      )}
    </>
  );
}

function MiniStat({ value, label, icon: Icon, color = 'var(--text-1)' }) {
  return (
    <div className="glass-card rounded-xl p-3.5">
      {Icon && <Icon size={14} className="text-primary mb-1.5" />}
      <div className="text-[22px] font-extrabold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] font-semibold text-ink-2 uppercase tracking-wide mt-1">
        {label}
      </div>
    </div>
  );
}
