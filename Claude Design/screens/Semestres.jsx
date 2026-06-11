// CardioThoNoa — Semestres List + Detail Screens

const { useState: useSemState } = React;

// ── Liste des semestres ───────────────────────────────────────────────────────
function SemestresScreen({ navigate }) {
  return (
    <Screen>
      <TopBar title="Mes semestres" subtitle={`${APP_USER.prenom} ${APP_USER.nom} · ${APP_USER.hopital}`} />
      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SEMESTRES_DATA.map((sem, idx) => {
          const cfg = getSpecialiteConfig(sem.specialite);
          const { total, gestes } = getSemestreProgress(sem);
          const pct = Math.min(100, Math.round((total / sem.objectifs.total) * 100));
          const isCurrent = sem.statut === 'en_cours';
          return (
            <Card key={sem.id} onClick={() => navigate('semestre-detail', { id: sem.id })} padding={0} style={{ overflow: 'hidden' }}>
              {/* Color bar */}
              <div style={{ height: 4, background: cfg.color, width: `${pct}%` }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{sem.label}</span>
                      <span style={{ fontSize: 15, color: 'var(--text-2)', fontWeight: 500 }}>— {sem.titre}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sem.chef}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                      {formatDate(sem.debut)} → {formatDate(sem.fin)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <SpecBadge specialite={sem.specialite} />
                    {isCurrent ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#27AE60', background: 'rgba(39,174,96,0.12)', padding: '2px 8px', borderRadius: 'var(--r-pill)' }}>EN COURS</span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 'var(--r-pill)' }}>TERMINÉ</span>
                    )}
                  </div>
                </div>
                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 10, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color }}>{total}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Interventions</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{gestes}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Gestes</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Objectif</div>
                  </div>
                </div>
                {/* Progress bar */}
                <ProgressBar value={total} max={sem.objectifs.total} color={cfg.color} height={5} />
              </div>
            </Card>
          );
        })}
        <div style={{ height: 90 }} />
      </div>
    </Screen>
  );
}

// ── Détail d'un semestre ──────────────────────────────────────────────────────
function SemestreDetailScreen({ navigate, params }) {
  const sem = SEMESTRES_DATA.find(s => s.id === params.id) || SEMESTRES_DATA[0];
  const cfg = getSpecialiteConfig(sem.specialite);
  const interventions = getInterventionsBySemestre(sem.id);
  const { total, gestes } = getSemestreProgress(sem);
  const pct = Math.min(100, Math.round((total / sem.objectifs.total) * 100));

  // Top geste
  const gestesMap = {};
  interventions.forEach(i => i.gestes.forEach(g => { gestesMap[g] = (gestesMap[g] || 0) + 1; }));
  const topGeste = Object.entries(gestesMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <Screen>
      <TopBar
        title={`${sem.label} — ${sem.titre}`}
        subtitle={sem.chef}
        onBack={() => navigate('semestres')}
      />
      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Info card */}
        <Card padding={16} style={{ borderLeft: `4px solid ${cfg.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <SpecBadge specialite={sem.specialite} />
            {sem.statut === 'en_cours' ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#27AE60' }}>En cours</span>
            ) : (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>Terminé</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
            📍 {sem.hopital}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
            👤 {sem.chef}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            📅 {formatDate(sem.debut)} → {formatDate(sem.fin)}
          </div>
        </Card>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard value={total} label="Interventions" sub={`/ ${sem.objectifs.total} obj.`} color={cfg.color} />
          <StatCard value={gestes} label="Gestes" sub={`/ ${sem.objectifs.gestes} obj.`} color="var(--text-1)" />
          <StatCard value={`${pct}%`} label="Objectif" color={pct >= 80 ? '#27AE60' : pct >= 50 ? '#E67E22' : 'var(--text-2)'} />
        </div>

        <ProgressBar value={total} max={sem.objectifs.total} color={cfg.color} height={7} label="Progression objectif interventions" />

        {topGeste && (
          <Card padding={14}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Geste le plus fréquent</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{topGeste[0]}</span>
              <Badge label={`${topGeste[1]}×`} color={cfg.color} bg={cfg.colorMuted} />
            </div>
          </Card>
        )}

        {/* Interventions list */}
        <div>
          <SectionTitle>{interventions.length} intervention{interventions.length > 1 ? 's' : ''}</SectionTitle>
          {interventions.length === 0 ? (
            <EmptyState icon="🏥" title="Aucune intervention" subtitle="Ce semestre est vide pour l'instant." />
          ) : (
            <Card padding={0}>
              <div style={{ padding: '0 16px' }}>
                {interventions.map(i => (
                  <InterventionRow key={i.id} intervention={i} onClick={() => navigate('intervention-detail', { id: i.id, from: 'semestre-detail', fromParams: { id: sem.id } })} />
                ))}
              </div>
            </Card>
          )}
        </div>

        <div style={{ height: 90 }} />
      </div>
    </Screen>
  );
}

Object.assign(window, { SemestresScreen, SemestreDetailScreen });
