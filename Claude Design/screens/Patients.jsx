// CardioThoNoa — Patients List + Patient Detail Screens

const { useState: usePatientsState, useMemo: usePatientsMemo } = React;

// ── Agrégation patients depuis les interventions ──────────────────────────────
function buildPatients() {
  const map = {};
  INTERVENTIONS_DATA.forEach(i => {
    const key = `${i.patient.nom}__${i.patient.prenom}__${i.patient.ddn}`;
    if (!map[key]) {
      map[key] = {
        id: key,
        nom: i.patient.nom,
        prenom: i.patient.prenom,
        ddn: i.patient.ddn,
        interventions: [],
        specialites: new Set(),
      };
    }
    map[key].interventions.push(i);
    map[key].specialites.add(i.specialite);
  });

  return Object.values(map).map(p => ({
    ...p,
    specialites: [...p.specialites],
    derniereIntervention: p.interventions.sort((a, b) => b.date.localeCompare(a.date))[0].date,
  })).sort((a, b) => `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`));
}

// ── Liste des patients ────────────────────────────────────────────────────────
function PatientsScreen({ navigate }) {
  const [search, setSearch] = usePatientsState('');
  const [specFilter, setSpecFilter] = usePatientsState('Toutes');

  const allPatients = usePatientsMemo(() => buildPatients(), []);

  const filtered = usePatientsMemo(() => {
    return allPatients.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || p.nom.toLowerCase().includes(q)
        || p.prenom.toLowerCase().includes(q);
      const matchSpec = specFilter === 'Toutes' || p.specialites.includes(specFilter);
      return matchSearch && matchSpec;
    });
  }, [allPatients, search, specFilter]);

  const counts = usePatientsMemo(() => ({
    Toutes: allPatients.length,
    Cardiaque: allPatients.filter(p => p.specialites.includes('Cardiaque')).length,
    Thoracique: allPatients.filter(p => p.specialites.includes('Thoracique')).length,
  }), [allPatients]);

  return (
    <Screen>
      {/* Header */}
      <div style={{ background: 'var(--surface)', padding: '16px 16px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>
          Patients
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)', marginLeft: 8 }}>
            {filtered.length}
          </span>
        </div>

        {/* Barre de recherche */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
          padding: '9px 13px', marginBottom: 12,
          border: '1.5px solid var(--border)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="var(--text-3)" strokeWidth="1.8"/>
            <path d="M16.5 16.5l4 4" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient…"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, color: 'var(--text-1)', fontFamily: 'var(--font)',
              outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filtres spécialité */}
        <div style={{ display: 'flex', gap: 8, paddingBottom: 12, overflowX: 'auto' }}>
          {['Toutes', 'Cardiaque', 'Thoracique'].map(sp => {
            const active = specFilter === sp;
            const cfg = sp !== 'Toutes' ? getSpecialiteConfig(sp) : null;
            return (
              <button
                key={sp}
                onClick={() => setSpecFilter(sp)}
                style={{
                  flexShrink: 0,
                  padding: '5px 13px', borderRadius: 'var(--r-pill)',
                  border: `1.5px solid ${active ? (cfg ? cfg.color : 'var(--primary)') : 'var(--border)'}`,
                  background: active ? (cfg ? cfg.colorMuted : 'rgba(30,58,95,0.08)') : 'transparent',
                  color: active ? (cfg ? cfg.color : 'var(--primary)') : 'var(--text-3)',
                  fontFamily: 'var(--font)', fontWeight: 600, fontSize: 12,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                {sp === 'Cardiaque' && '🫀'}
                {sp === 'Thoracique' && '🫁'}
                {sp}
                <span style={{
                  background: active ? (cfg ? cfg.color : 'var(--primary)') : 'var(--surface-2)',
                  color: active ? '#fff' : 'var(--text-3)',
                  borderRadius: 'var(--r-pill)', fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', transition: 'all 0.15s',
                }}>{counts[sp]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🔍" title="Aucun patient trouvé" subtitle={search ? `Aucun résultat pour « ${search} »` : 'Ajoutez des interventions pour voir vos patients.'} />
        ) : (
          <Card padding={0} className="anim-fade-up">
            <div style={{ padding: '0 16px' }}>
              {filtered.map((patient, idx) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  isLast={idx === filtered.length - 1}
                  onClick={() => navigate('patient-detail', { patientId: patient.id })}
                />
              ))}
            </div>
          </Card>
        )}
        <div style={{ height: 100 }} />
      </div>
    </Screen>
  );
}

// ── Ligne patient ─────────────────────────────────────────────────────────────
function PatientRow({ patient, isLast, onClick }) {
  const age = ageFromDDN(patient.ddn);
  const initiales = (patient.prenom[0] + patient.nom[0]).toUpperCase();
  const hasCardiac = patient.specialites.includes('Cardiaque');
  const hasThoracic = patient.specialites.includes('Thoracique');
  const avatarColor = hasCardiac && hasThoracic ? '#6C3483'
    : hasCardiac ? '#C0392B' : '#2171B5';
  const avatarBg = hasCardiac && hasThoracic ? 'rgba(108,52,131,0.1)'
    : hasCardiac ? 'rgba(192,57,43,0.1)' : 'rgba(33,113,181,0.1)';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        cursor: 'pointer',
      }}>
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: avatarBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 15, fontWeight: 700, color: avatarColor,
      }}>{initiales}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
          {patient.prenom} <span style={{ fontWeight: 800 }}>{patient.nom}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8 }}>
          {age && <span>{age} ans</span>}
          <span>·</span>
          <span>DDN {formatDate(patient.ddn)}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
          {patient.specialites.map(sp => <SpecBadge key={sp} specialite={sp} small />)}
        </div>
      </div>

      {/* Droit */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{
          fontSize: 18, fontWeight: 800,
          color: patient.interventions.length > 1 ? 'var(--primary)' : 'var(--text-2)',
        }}>{patient.interventions.length}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
          {patient.interventions.length > 1 ? 'interventions' : 'intervention'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {formatDateShort(patient.derniereIntervention)}
        </span>
      </div>
    </div>
  );
}

// ── Détail patient ────────────────────────────────────────────────────────────
function PatientDetailScreen({ navigate, params }) {
  const allPatients = buildPatients();
  const patient = allPatients.find(p => p.id === params.patientId) || allPatients[0];
  const age = ageFromDDN(patient.ddn);

  const hasCardiac = patient.specialites.includes('Cardiaque');
  const hasThoracic = patient.specialites.includes('Thoracique');
  const avatarColor = hasCardiac && hasThoracic ? '#6C3483'
    : hasCardiac ? '#C0392B' : '#2171B5';
  const avatarBg = hasCardiac && hasThoracic ? 'rgba(108,52,131,0.1)'
    : hasCardiac ? 'rgba(192,57,43,0.1)' : 'rgba(33,113,181,0.1)';

  const interventionsSorted = [...patient.interventions].sort((a, b) => b.date.localeCompare(a.date));
  const totalGestes = interventionsSorted.reduce((acc, i) => acc + i.gestes.length, 0);

  // Gestes uniques pour ce patient
  const gestesMap = {};
  interventionsSorted.forEach(i => i.gestes.forEach(g => { gestesMap[g] = (gestesMap[g] || 0) + 1; }));
  const gestesUniques = Object.keys(gestesMap);

  return (
    <Screen>
      <TopBar
        title={`${patient.prenom} ${patient.nom}`}
        subtitle={age ? `${age} ans · DDN ${formatDate(patient.ddn)}` : `DDN ${formatDate(patient.ddn)}`}
        onBack={() => navigate('patients')}
      />

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Carte patient */}
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: avatarColor, flexShrink: 0,
            }}>
              {(patient.prenom[0] + patient.nom[0]).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>
                {patient.prenom} {patient.nom}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                Né(e) le {formatDate(patient.ddn)}{age ? ` · ${age} ans` : ''}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {patient.specialites.map(sp => <SpecBadge key={sp} specialite={sp} />)}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats rapides */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard value={patient.interventions.length} label="Interventions" color="var(--primary)" />
          <StatCard value={totalGestes} label="Gestes" color="var(--text-1)" />
          <StatCard
            value={formatDateShort(patient.derniereIntervention)}
            label="Dernière"
            color="var(--text-2)"
          />
        </div>

        {/* Gestes réalisés */}
        {gestesUniques.length > 0 && (
          <Card padding={14}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
              Gestes réalisés
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {gestesUniques.map(g => {
                const isCardiac = SPECIALITES_CONFIG.Cardiaque.gestes.some(x => x.label === g);
                const cfg = getSpecialiteConfig(isCardiac ? 'Cardiaque' : 'Thoracique');
                return (
                  <span key={g} style={{
                    padding: '5px 11px', borderRadius: 'var(--r-pill)',
                    background: cfg.colorMuted, color: cfg.color,
                    fontSize: 12, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    {g}
                    {gestesMap[g] > 1 && (
                      <span style={{ fontSize: 10, background: cfg.color, color: '#fff', borderRadius: 'var(--r-pill)', padding: '1px 5px' }}>×{gestesMap[g]}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </Card>
        )}

        {/* Historique des interventions */}
        <div>
          <SectionTitle>{interventionsSorted.length} intervention{interventionsSorted.length > 1 ? 's' : ''}</SectionTitle>
          <Card padding={0}>
            <div style={{ padding: '0 16px' }}>
              {interventionsSorted.map(i => (
                <InterventionRow
                  key={i.id}
                  intervention={i}
                  onClick={() => navigate('intervention-detail', { id: i.id, from: 'patient-detail', fromParams: { patientId: patient.id } })}
                />
              ))}
            </div>
          </Card>
        </div>

        <div style={{ height: 100 }} />
      </div>
    </Screen>
  );
}

Object.assign(window, { PatientsScreen, PatientDetailScreen, PatientRow });
