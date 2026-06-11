// CardioThoNoa — Intervention Detail Screen

function InterventionDetailScreen({ navigate, params }) {
  const intervention = INTERVENTIONS_DATA.find(i => i.id === params.id) || INTERVENTIONS_DATA[0];
  const cfg = getSpecialiteConfig(intervention.specialite);
  const semestre = SEMESTRES_DATA.find(s => s.id === intervention.semestreId);

  const age = ageFromDDN(intervention.patient.ddn);

  function handleBack() {
    if (params.from === 'semestre-detail') {
      navigate('semestre-detail', params.fromParams);
    } else if (params.from === 'patient-detail') {
      navigate('patient-detail', params.fromParams);
    } else {
      navigate('dashboard');
    }
  }

  return (
    <Screen>
      <TopBar
        title={`${intervention.patient.prenom} ${intervention.patient.nom}`}
        subtitle={formatDate(intervention.date)}
        onBack={handleBack}
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => {}} style={{
              background: 'var(--surface-2)', border: 'none', borderRadius: 'var(--r-md)',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Icon name="edit" size={15} color="var(--text-2)" />
            </button>
          </div>
        }
      />

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Patient */}
        <Card padding={16}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Patient</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initiales={intervention.patient.prenom[0] + intervention.patient.nom[0]} size={44} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>
                {intervention.patient.prenom} {intervention.patient.nom}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                Né(e) le {formatDate(intervention.patient.ddn)}
                {age ? ` · ${age} ans` : ''}
              </div>
            </div>
          </div>
        </Card>

        {/* Intervention info */}
        <Card padding={16}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Intervention</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Spécialité</span>
              <SpecBadge specialite={intervention.specialite} />
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Type{intervention.types.length > 1 ? 's' : ''}</span>
              <div style={{ textAlign: 'right', maxWidth: '60%' }}>
                {intervention.types.map(t => (
                  <div key={t} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t}</div>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Date</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{formatDate(intervention.date)}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Chirurgien</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar initiales={intervention.chirurgien.initiales} size={26} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{intervention.chirurgien.nom}</span>
              </div>
            </div>

            {semestre && (
              <>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Semestre</span>
                  <span
                    onClick={() => navigate('semestre-detail', { id: semestre.id })}
                    style={{ fontSize: 13, fontWeight: 600, color: cfg.color, cursor: 'pointer' }}>
                    {semestre.label} — {semestre.titre}
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Gestes */}
        <Card padding={16}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Gestes réalisés ({intervention.gestes.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {intervention.gestes.map(g => (
              <span key={g} style={{
                padding: '6px 12px', borderRadius: 'var(--r-pill)',
                background: cfg.colorMuted, color: cfg.color,
                fontSize: 13, fontWeight: 600,
              }}>{g}</span>
            ))}
          </div>
        </Card>

        {/* Notes */}
        {intervention.notes ? (
          <Card padding={16}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Notes</div>
            <p style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.6, margin: 0 }}>{intervention.notes}</p>
          </Card>
        ) : null}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" fullWidth onClick={() => {}}>
            <Icon name="edit" size={15} /> Modifier
          </Btn>
          <Btn variant="danger" fullWidth onClick={() => {}}>
            <Icon name="trash" size={15} /> Supprimer
          </Btn>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </Screen>
  );
}

Object.assign(window, { InterventionDetailScreen });
