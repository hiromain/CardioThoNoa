// CardioThoNoa — Dashboard Screen

function DashboardScreen({ navigate, currentSemestreId }) {
  const semestre = SEMESTRES_DATA.find(s => s.id === currentSemestreId) || SEMESTRES_DATA[0];
  const { total, gestes, timeProgress } = getSemestreProgress(semestre);
  const cfg = getSpecialiteConfig(semestre.specialite);
  const recents = INTERVENTIONS_DATA.slice(0, 3);
  const pctTotal = Math.min(100, Math.round((total / semestre.objectifs.total) * 100));
  const pctGestes = Math.min(100, Math.round((gestes / semestre.objectifs.gestes) * 100));

  // Animate header progress bars on mount
  const [barWidth1, setBarWidth1] = React.useState(0);
  const [barWidth2, setBarWidth2] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => {
      setBarWidth1(pctTotal);
      setBarWidth2(pctGestes);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen>
      {/* Header */}
      <div className="header-gradient" style={{ padding: '20px 20px 24px' }}>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>Bonjour,</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Dr Noa Martin 👋</div>
          </div>
          <Avatar initiales="NM" size={42} color="#fff" bg="rgba(255,255,255,0.18)" />
        </div>

        {/* Semestre card — glassmorphism on dark */}
        <div className="anim-fade-up stagger-1" style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 'var(--r-lg)',
          padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.18)',
          position: 'relative', zIndex: 1,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Semestre en cours</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 2 }}>{semestre.label} — {semestre.titre}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{semestre.chef} · {formatDate(semestre.debut)} – {formatDate(semestre.fin)}</div>
            </div>
            <span style={{
              background: 'rgba(107,239,160,0.2)',
              color: '#6BEFA0',
              padding: '3px 10px', borderRadius: 'var(--r-pill)',
              fontSize: 11, fontWeight: 700,
              border: '1px solid rgba(107,239,160,0.3)',
              boxShadow: '0 0 10px rgba(107,239,160,0.15)',
            }}>EN COURS</span>
          </div>
          {/* Animated progress bars */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Interventions</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{total}/{semestre.objectifs.total}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${barWidth1}%`, background: 'linear-gradient(90deg, #6BEFA0, #4dd88a)',
                  borderRadius: 999, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: '0 0 8px rgba(107,239,160,0.5)',
                }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Gestes</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{gestes}/{semestre.objectifs.gestes}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${barWidth2}%`, background: 'linear-gradient(90deg, #60AEFE, #4a9de8)',
                  borderRadius: 999, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1) 0.15s',
                  boxShadow: '0 0 8px rgba(96,174,254,0.5)',
                }} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {Math.round(timeProgress * 100)}% du semestre écoulé
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Quick stats */}
        <div className="anim-fade-up stagger-1">
          <SectionTitle>Ce semestre</SectionTitle>
          <div style={{ display: 'flex', gap: 10 }}>
            <StatCard value={total} label="Interventions" sub="objectif 30" color="var(--primary)" />
            <StatCard value={gestes} label="Gestes réalisés" sub="objectif 20" color={cfg.color} />
            <StatCard value={3} label="Chirurgiens" sub="S3" color="var(--text-2)" />
          </div>
        </div>

        {/* Répartition */}
        <div className="anim-fade-up stagger-2">
          <SectionTitle>Répartition globale</SectionTitle>
          <Card padding={16}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Donut mini */}
              <svg width={64} height={64} viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="22" fill="none" stroke="#EBF5FB" strokeWidth="12" />
                <circle cx="32" cy="32" r="22" fill="none" stroke="#C0392B" strokeWidth="12"
                  strokeDasharray={`${138 * 0.44} ${138}`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)" />
                <circle cx="32" cy="32" r="22" fill="none" stroke="#2171B5" strokeWidth="12"
                  strokeDasharray={`${138 * 0.56} ${138}`}
                  strokeDashoffset={`-${138 * 0.44}`}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)" />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2171B5' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-1)' }}>Thoracique</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>15 (56%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#C0392B' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-1)' }}>Cardiaque</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>8 (44%)</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Total toutes périodes</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>23 interventions</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Accès semestres */}
        <div className="anim-fade-up stagger-3">
          <div
            onClick={() => navigate('semestres')}
            className="card-hover"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface)', borderRadius: 'var(--r-lg)',
              padding: '12px 16px', cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--r-md)',
                background: 'linear-gradient(135deg, rgba(30,58,95,0.1), rgba(30,58,95,0.06))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="list" size={17} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Mes semestres</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{SEMESTRES_DATA.length} semestres · {INTERVENTIONS_DATA.length} interventions au total</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="chevron" size={16} color="var(--text-3)" />
            </div>
          </div>
        </div>

        {/* Interventions récentes */}
        <div className="anim-fade-up stagger-4">
          <SectionTitle action={<span onClick={() => navigate('patients')} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Tous les patients</span>}>
            Récentes
          </SectionTitle>
          <Card padding={0}>
            <div style={{ padding: '0 16px' }}>
              {recents.map(i => (
                <InterventionRow key={i.id} intervention={i} onClick={() => navigate('intervention-detail', { id: i.id })} />
              ))}
            </div>
          </Card>
        </div>

        <div style={{ height: 90 }} />
      </div>
    </Screen>
  );
}

Object.assign(window, { DashboardScreen });
