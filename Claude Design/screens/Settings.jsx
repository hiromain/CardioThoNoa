// CardioThoNoa — Settings Screen

const { useState: useSettingsState } = React;

function SettingsScreen({ navigate, theme, setTheme, currentSemestreId, setCurrentSemestreId }) {
  const [expandedSection, setExpandedSection] = useSettingsState(null);
  const [blocMode, setBlocMode] = useSettingsState(false);

  const cfg = getSpecialiteConfig(SEMESTRES_DATA[0].specialite);

  function toggleSection(id) {
    setExpandedSection(expandedSection === id ? null : id);
  }

  const listSections = [
    {
      id: 'chirurgiens',
      label: 'Chirurgiens',
      icon: '👤',
      items: [
        ...SPECIALITES_CONFIG.Cardiaque.chirurgiens.map(c => ({ label: c.nom, sub: 'Chirurgie Cardiaque', color: '#C0392B' })),
        ...SPECIALITES_CONFIG.Thoracique.chirurgiens.map(c => ({ label: c.nom, sub: 'Chirurgie Thoracique', color: '#2171B5' })),
      ],
    },
    {
      id: 'gestes-card',
      label: 'Gestes — Cardiaque',
      icon: '🫀',
      items: SPECIALITES_CONFIG.Cardiaque.gestes.map(g => ({ label: g.label, sub: g.full, color: '#C0392B' })),
    },
    {
      id: 'gestes-thor',
      label: 'Gestes — Thoracique',
      icon: '🫁',
      items: SPECIALITES_CONFIG.Thoracique.gestes.map(g => ({ label: g.label, sub: g.full, color: '#2171B5' })),
    },
    {
      id: 'types-card',
      label: 'Types — Cardiaque',
      icon: '📋',
      items: SPECIALITES_CONFIG.Cardiaque.types.map(t => ({ label: t, color: '#C0392B' })),
    },
    {
      id: 'types-thor',
      label: 'Types — Thoracique',
      icon: '📋',
      items: SPECIALITES_CONFIG.Thoracique.types.map(t => ({ label: t, color: '#2171B5' })),
    },
  ];

  return (
    <Screen>
      <TopBar title="Réglages" />
      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stage actuel */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Stage actuel</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SEMESTRES_DATA.map(sem => {
              const cfg = getSpecialiteConfig(sem.specialite);
              const isSelected = currentSemestreId === sem.id;
              return (
                <div
                  key={sem.id}
                  onClick={() => setCurrentSemestreId(sem.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', borderRadius: 'var(--r-lg)',
                    border: `2px solid ${isSelected ? cfg.color : 'var(--border)'}`,
                    background: isSelected ? cfg.colorMuted : 'var(--surface)',
                    cursor: 'pointer', transition: 'all 0.18s ease',
                  }}>
                  {/* Icône spécialité */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0,
                    background: isSelected ? cfg.color : 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, transition: 'background 0.18s',
                  }}>
                    {sem.specialite === 'Cardiaque' ? '🫀' : '🫁'}
                  </div>
                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? cfg.color : 'var(--text-1)' }}>
                        {sem.label}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--text-2)', fontWeight: 500 }}>— {sem.specialite}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sem.chef}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                      {formatDate(sem.debut)} → {formatDate(sem.fin)}
                    </div>
                  </div>
                  {/* Radio */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isSelected ? cfg.color : 'var(--border)'}`,
                    background: isSelected ? cfg.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                  }}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M2 5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Indication */}
          {(() => {
            const sem = SEMESTRES_DATA.find(s => s.id === currentSemestreId);
            const cfg = sem ? getSpecialiteConfig(sem.specialite) : null;
            return sem ? (
              <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--r-md)', background: cfg.colorMuted, display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={cfg.color} strokeWidth="1.8"/>
                  <path d="M12 8v4M12 16h.01" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>
                  Spécialité <strong>{sem.specialite}</strong> pré-sélectionnée dans le formulaire
                </span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Profile */}
        <Card padding={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff',
            }}>NM</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Noa Martin</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>Interne · {APP_USER.promotion}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{APP_USER.hopital}</div>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <SpecBadge specialite={SEMESTRES_DATA[0].specialite} />
            <Badge label={SEMESTRES_DATA[0].label} color="var(--primary)" bg="rgba(30,58,95,0.1)" />
            <Badge label={SEMESTRES_DATA[0].chef} color="var(--text-2)" />
          </div>
        </Card>

        {/* Préférences */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Préférences</div>
          <Card padding={0}>
            {/* Thème */}
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>Thème</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Apparence de l'interface</div>
              </div>
              <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 3, gap: 2 }}>
                {[{ id: 'light', label: '☀️' }, { id: 'dark', label: '🌙' }].map(opt => (
                  <button key={opt.id} onClick={() => setTheme(opt.id)} style={{
                    padding: '6px 12px', border: 'none', cursor: 'pointer',
                    borderRadius: 'calc(var(--r-md) - 2px)',
                    background: theme === opt.id ? 'var(--primary)' : 'transparent',
                    color: theme === opt.id ? '#fff' : 'var(--text-2)',
                    fontFamily: 'var(--font)', fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Mode bloc */}
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>Mode bloc opératoire</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Forcer thème sombre + luminosité réduite</div>
              </div>
              <div
                onClick={() => { setBlocMode(!blocMode); if (!blocMode) setTheme('dark'); else setTheme('light'); }}
                style={{
                  width: 46, height: 26, borderRadius: 'var(--r-pill)',
                  background: blocMode ? 'var(--primary)' : 'var(--border)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0,
                }}>
                <div style={{
                  position: 'absolute', top: 3, left: blocMode ? 23 : 3,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Gestion des listes */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Gestion des listes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {listSections.map(section => (
              <Card key={section.id} padding={0} style={{ overflow: 'hidden' }}>
                <div
                  onClick={() => toggleSection(section.id)}
                  style={{ padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{section.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>{section.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{section.items.length} éléments</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>+ Ajouter</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      style={{ transform: expandedSection === section.id ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}>
                      <path d="M9 18l6-6-6-6" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {expandedSection === section.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
                    {section.items.map((item, idx) => (
                      <div key={idx} style={{
                        padding: '9px 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: idx < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{item.label}</div>
                          {item.sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{item.sub}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-3)' }}>
                            <Icon name="edit" size={14} color="var(--text-3)" />
                          </button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <Icon name="trash" size={14} color="#C0392B" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* About */}
        <Card padding={16}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>À propos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Application</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>CardioThoNoa</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Version</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Données</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#27AE60' }}>Stockage local</span>
            </div>
          </div>
        </Card>

        <div style={{ height: 90 }} />
      </div>
    </Screen>
  );
}

Object.assign(window, { SettingsScreen });
