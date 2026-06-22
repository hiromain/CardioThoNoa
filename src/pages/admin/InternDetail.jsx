import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/layout/TopBar';
import { Card, StatCard, EmptyState, Badge } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { getInternData } from '../../lib/adminQueries';
import { kpis, topInternProcedures, specialtySplit } from '../../lib/stats';
import { getSpecialty } from '../../data/constants';

// Vue de supervision en LECTURE SEULE des statistiques de formation d'un interne.
// RGPD : aucune donnée patient n'est chargée (getInternData renvoie patients: []).
export default function InternDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  // Le catalogue de gestes est partagé : on réutilise celui déjà chargé dans le
  // store de l'admin pour libeller les gestes de l'interne.
  const procedureTypes = useStore((s) => s.procedureTypes);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getInternData(userId).then((d) => {
      if (!alive) return;
      setSnapshot(d);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const state = useMemo(
    () => (snapshot ? { ...snapshot, procedureTypes } : null),
    [snapshot, procedureTypes]
  );

  const interventions = state?.interventions ?? [];
  const k = useMemo(() => kpis(interventions), [interventions]);
  const topGestes = useMemo(
    () => (state ? topInternProcedures(state, interventions, 10) : []),
    [state, interventions]
  );
  const split = useMemo(
    () => (state ? specialtySplit(state, interventions) : []),
    [state, interventions]
  );

  const name = snapshot?.profile
    ? [snapshot.profile.prenom, snapshot.profile.nom].filter(Boolean).join(' ')
    : 'Interne';

  return (
    <div>
      <TopBar title={name || 'Interne'} subtitle="Statistiques de formation" onBack={() => navigate(-1)} />
      <div className="px-4 py-4 lg:px-8 lg:py-8 max-w-5xl mx-auto flex flex-col gap-4">
        {loading ? (
          <div className="px-5 py-10 text-center text-ink-3 text-sm">Chargement…</div>
        ) : !snapshot ? (
          <EmptyState icon="🔍" title="Données indisponibles" subtitle="Ce compte n'a pas encore synchronisé de données." />
        ) : (
          <>
            <div className="flex gap-3">
              <StatCard value={k.total} label="Interventions" />
              <StatCard value={k.internGestes} label="Gestes interne" />
              <StatCard value={k.surgeons} label="Chirurgiens" />
            </div>

            <Card>
              <h2 className="text-[15px] font-bold text-ink-1 mb-3">Répartition par spécialité</h2>
              <div className="flex flex-col gap-2">
                {split.every((s) => s.value === 0) ? (
                  <p className="text-sm text-ink-3">Aucune intervention enregistrée.</p>
                ) : (
                  split.map((s) => (
                    <div key={s.type} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-sm text-ink-2 flex-1">{s.label}</span>
                      <span className="text-sm font-bold text-ink-1">{s.value}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-[15px] font-bold text-ink-1 mb-3">Top gestes réalisés par l'interne</h2>
              {topGestes.length === 0 ? (
                <p className="text-sm text-ink-3">Aucun geste interne enregistré.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {topGestes.map((g) => (
                    <li key={g.id} className="flex items-center gap-2">
                      <Badge style={{ background: getSpecialty(g.serviceType).light, color: g.color }}>
                        {g.label}
                      </Badge>
                      <span className="text-sm text-ink-2 flex-1 truncate">{g.fullName}</span>
                      <span className="text-sm font-bold text-ink-1">{g.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
