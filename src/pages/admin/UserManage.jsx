import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/layout/TopBar';
import { Card, Select, EmptyState } from '../../components/ui';
import { ROLES } from '../../data/constants';
import { listInterns, listCentres, setRole, assignCentre } from '../../lib/adminQueries';

const ROLE_OPTIONS = [
  { value: ROLES.INTERN, label: 'Interne' },
  { value: ROLES.ADMIN, label: 'Administrateur' },
];

export default function UserManage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <TopBar title="Comptes" subtitle="Rôles et rattachements" onBack={() => navigate('/admin')} />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-4xl mx-auto">
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
    </div>
  );
}
