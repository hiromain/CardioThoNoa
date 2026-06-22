import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/layout/TopBar';
import { Card, EmptyState } from '../../components/ui';
import { listInterns, listCentres } from '../../lib/adminQueries';

// Statistiques comparatives par centre. Agrégées à partir de la liste des
// comptes (nb d'internes, total d'interventions) — léger et suffisant pour la
// comparaison ; les détails par interne sont accessibles via leur fiche.
export default function CentreStats() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listInterns(), listCentres()]).then(([r, c]) => {
      if (!alive) return;
      setRows(r);
      setCentres(c);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const byCentre = new Map();
    centres.forEach((c) => byCentre.set(c.id, { id: c.id, name: c.name, interns: 0, interventions: 0 }));
    byCentre.set('__none', { id: '__none', name: 'Non rattaché', interns: 0, interventions: 0 });
    rows.forEach((r) => {
      const key = r.centre_id && byCentre.has(r.centre_id) ? r.centre_id : '__none';
      const bucket = byCentre.get(key);
      bucket.interns += 1;
      bucket.interventions += r.intervention_count || 0;
    });
    return [...byCentre.values()]
      .filter((b) => b.interns > 0 || b.id !== '__none')
      .sort((a, b) => b.interventions - a.interventions);
  }, [rows, centres]);

  const maxInterventions = Math.max(1, ...stats.map((s) => s.interventions));

  return (
    <div>
      <TopBar title="Stats par centre" subtitle="Comparaison entre centres" onBack={() => navigate('/admin')} />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-4xl mx-auto">
        {loading ? (
          <div className="px-5 py-10 text-center text-ink-3 text-sm">Chargement…</div>
        ) : stats.length === 0 ? (
          <EmptyState icon="🏥" title="Aucun centre" subtitle="Crée des centres dans « Comptes & centres »." />
        ) : (
          <Card className="flex flex-col gap-4">
            {stats.map((s) => (
              <div key={s.id}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[15px] font-semibold text-ink-1">{s.name}</span>
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
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
