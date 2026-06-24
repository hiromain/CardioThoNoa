import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { TopBar } from '../../components/layout/TopBar';
import { Card, Select, EmptyState } from '../../components/ui';
import { ROLES } from '../../data/constants';
import { listInterns, listCentres, setRole, assignCentre } from '../../lib/adminQueries';
import { formatDate } from '../../lib/dates';

const SIXTY_DAYS_MS = 60 * 24 * 3600 * 1000;

const ROLE_OPTIONS = [
  { value: ROLES.INTERN, label: 'Interne' },
  { value: ROLES.ADMIN, label: 'Administrateur' },
];

export default function UserManage() {
  const navigate = useNavigate();
  const [rows, setRows]       = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => Date.now(), []);

  async function reload() {
    const [r, c] = await Promise.all([listInterns(), listCentres()]);
    setRows(r);
    setCentres(c);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  const centreOptions = [
    { value: '', label: 'Non rattaché' },
    ...centres.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function changeRole(userId, role) {
    setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, role } : r)));
    try { await setRole(userId, role); } catch { reload(); }
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
    try { await assignCentre(userId, cid); } catch { reload(); }
  }

  const sansCentre = useMemo(
    () => rows.filter((r) => r.role !== 'admin' && !r.centre_id).length,
    [rows]
  );

  return (
    <div>
      <TopBar title="Comptes" onBack={() => navigate('/admin')} />

      <div className="px-4 py-5 lg:px-8 lg:py-6 max-w-5xl mx-auto flex flex-col gap-4">

        {/* Sous-titre */}
        <div className="anim-fade-up">
          <h1 className="text-[20px] font-extrabold text-ink-1">Comptes</h1>
          <p className="text-[13px] text-ink-3 mt-0.5">
            {rows.length} utilisateur{rows.length !== 1 ? 's' : ''}
            {sansCentre > 0 && ` · ${sansCentre} sans centre`}
          </p>
        </div>

        {/* Bannière alerte */}
        {!loading && sansCentre > 0 && (
          <div
            className="rounded-xl px-4 py-3 flex items-start gap-3 anim-fade-up stagger-1"
            style={{
              background: 'rgba(217,119,6,0.08)',
              border: '1px solid rgba(217,119,6,0.25)',
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(217,119,6,0.15)' }}
            >
              <AlertCircle size={13} style={{ color: '#D97706' }} />
            </div>
            <div>
              <div className="text-[13px] font-bold" style={{ color: '#D97706' }}>
                {sansCentre} interne{sansCentre > 1 ? 's' : ''} sans centre assigné
              </div>
              <div className="text-[11px] text-ink-3 mt-0.5">
                Utilisez les menus déroulants ci-dessous pour assigner un centre de formation.
              </div>
            </div>
          </div>
        )}

        {/* Tableau */}
        {loading ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl h-12 skeleton" />
            {[0,1,2,3].map((i) => <div key={i} className="rounded-xl h-16 skeleton" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon="👥" title="Aucun compte" />
        ) : (
          <Card padding="p-0" className="anim-fade-up stagger-2">
            {/* Table desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    {['UTILISATEUR', 'EMAIL', 'RÔLE', 'CENTRE DE FORMATION', 'STATUT', 'INTERVENTIONS'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-bold text-ink-3 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => {
                    const isStale =
                      !r.last_activity ||
                      now - new Date(r.last_activity).getTime() >= SIXTY_DAYS_MS;
                    const statusColor = r.last_activity
                      ? (isStale ? '#D97706' : '#15803D')
                      : 'var(--text-3)';
                    const statusLabel = r.last_activity
                      ? (isStale ? 'Inactif' : 'Actif')
                      : 'Jamais sync.';

                    return (
                      <tr key={r.user_id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                r.role === 'admin' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {(r.display_name || r.email || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-ink-1 leading-tight">
                                {r.display_name || 'Sans nom'}
                              </div>
                              {r.last_activity && (
                                <div className="text-[11px] text-ink-3">
                                  Dernière activité {formatDate(r.last_activity)}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-3 max-w-[180px] truncate">{r.email}</td>
                        <td className="px-4 py-3">
                          <Select
                            value={r.role}
                            onChange={(e) => changeRole(r.user_id, e.target.value)}
                            options={ROLE_OPTIONS}
                            className="text-[13px] w-44"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {r.role !== 'admin' ? (
                            <Select
                              value={r.centre_id || ''}
                              onChange={(e) => changeCentre(r.user_id, e.target.value)}
                              options={centreOptions}
                              className={`text-[13px] w-56 ${!r.centre_id ? 'border-orange-400/40' : ''}`}
                            />
                          ) : (
                            <span className="text-ink-3 text-[12px]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
                            style={{ color: statusColor }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: statusColor }}
                            />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-ink-1 tabular-nums">
                          {r.intervention_count ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Liste mobile */}
            <ul className="md:hidden divide-y divide-line">
              {rows.map((r) => (
                <li key={r.user_id}>
                  <div className="px-4 py-3.5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          r.role === 'admin' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {(r.display_name || r.email || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-semibold text-ink-1 truncate">
                            {r.display_name || 'Compte sans nom'}
                          </span>
                          {r.role === 'admin' && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-ink-3 truncate">{r.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Select
                        value={r.role}
                        onChange={(e) => changeRole(r.user_id, e.target.value)}
                        options={ROLE_OPTIONS}
                        className="text-[13px] flex-1"
                      />
                      {r.role !== 'admin' && (
                        <Select
                          value={r.centre_id || ''}
                          onChange={(e) => changeCentre(r.user_id, e.target.value)}
                          options={centreOptions}
                          className="text-[13px] flex-1"
                        />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
