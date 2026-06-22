import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, Select, Input, Button, EmptyState, ConfirmDialog } from '../../components/ui';
import { ROLES } from '../../data/constants';
import {
  listInterns,
  listCentres,
  setRole,
  assignCentre,
  createCentre,
  deleteCentre,
} from '../../lib/adminQueries';

const ROLE_OPTIONS = [
  { value: ROLES.INTERN, label: 'Interne' },
  { value: ROLES.ADMIN, label: 'Administrateur' },
];

// Gestion des comptes (rôle, rattachement à un centre) et des centres.
export default function UserManage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCentre, setNewCentre] = useState({ name: '', city: '' });
  const [confirmCentre, setConfirmCentre] = useState(null);

  async function reload() {
    const [r, c] = await Promise.all([listInterns(), listCentres()]);
    setRows(r);
    setCentres(c);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const centreOptions = [
    { value: '', label: 'Non rattaché' },
    ...centres.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function changeRole(userId, role) {
    setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, role } : r)));
    try {
      await setRole(userId, role);
    } catch {
      reload();
    }
  }

  async function changeCentre(userId, centreId) {
    const cid = centreId || null;
    setRows((rs) =>
      rs.map((r) =>
        r.user_id === userId
          ? { ...r, centre_id: cid, centre_name: centres.find((c) => c.id === cid)?.name ?? null }
          : r
      )
    );
    try {
      await assignCentre(userId, cid);
    } catch {
      reload();
    }
  }

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

  async function removeCentre(centre) {
    try {
      await deleteCentre(centre.id);
      reload();
    } catch {
      window.alert('Suppression impossible.');
    } finally {
      setConfirmCentre(null);
    }
  }

  return (
    <div>
      <TopBar title="Comptes & centres" subtitle="Rôles et rattachements" onBack={() => navigate('/admin')} />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-4xl mx-auto flex flex-col gap-4">
        {/* Centres */}
        <Card>
          <h2 className="text-[15px] font-bold text-ink-1 mb-3 flex items-center gap-2">
            <Building2 size={17} className="text-primary" /> Centres
          </h2>
          {centres.length === 0 ? (
            <p className="text-sm text-ink-3 mb-3">Aucun centre. Crée le premier ci-dessous.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 mb-3">
              {centres.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-ink-1">{c.name}</span>
                  {c.city && <span className="text-ink-3 text-xs">{c.city}</span>}
                  <button
                    type="button"
                    onClick={() => setConfirmCentre(c)}
                    className="p-1.5 text-ink-3 hover:text-danger"
                    aria-label="Supprimer le centre"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
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

        {/* Comptes */}
        <Card padding="p-0">
          {loading ? (
            <div className="px-5 py-10 text-center text-ink-3 text-sm">Chargement…</div>
          ) : rows.length === 0 ? (
            <EmptyState icon="👥" title="Aucun compte" />
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.user_id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-ink-1 truncate">
                      {r.display_name || r.email || 'Compte sans nom'}
                    </div>
                    <div className="text-xs text-ink-3 truncate">{r.email}</div>
                  </div>
                  <Select
                    value={r.role}
                    onChange={(e) => changeRole(r.user_id, e.target.value)}
                    options={ROLE_OPTIONS}
                    className="sm:w-44"
                  />
                  <Select
                    value={r.centre_id || ''}
                    onChange={(e) => changeCentre(r.user_id, e.target.value)}
                    options={centreOptions}
                    className="sm:w-52"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!confirmCentre}
        title="Supprimer ce centre ?"
        message="Les comptes rattachés seront détachés (non supprimés)."
        confirmLabel="Supprimer"
        danger
        onConfirm={() => removeCentre(confirmCentre)}
        onClose={() => setConfirmCentre(null)}
      />
    </div>
  );
}
