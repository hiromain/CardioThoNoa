// CardioThoNoa — Statistics Screen

const { useState: useStatState, useMemo } = React;

function StatisticsScreen({ navigate }) {
  const [period, setPeriod] = useStatState('s3');
  const [specialiteFilter, setSpecialiteFilter] = useStatState('Toutes');

  const filtered = useMemo(() => {
    let list = INTERVENTIONS_DATA;
    if (period !== 'all') list = list.filter(i => i.semestreId === period);
    if (specialiteFilter !== 'Toutes') list = list.filter(i => i.specialite === specialiteFilter);
    return list;
  }, [period, specialiteFilter]);

  // Gestes frequency
  const gestesCount = useMemo(() => {
    const map = {};
    filtered.forEach(i => i.gestes.forEach(g => { map[g] = (map[g] || 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filtered]);

  const maxGeste = gestesCount[0]?.[1] || 1;

  // By chirurgien
  const byChir = useMemo(() => {
    const map = {};
    filtered.forEach(i => {
      const k = i.chirurgien.nom;
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // By month (last 6 months)
  const byMonth = useMemo(() => {
    const map = {};
    filtered.forEach(i => {
      const d = new Date(i.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { label, count: 0 };
      map[key].count++;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  }, [filtered]);

  const maxMonth = Math.max(...byMonth.map(([, v]) => v.count), 1);

  const cardiacCount = filtered.filter(i => i.specialite === 'Cardiaque').length;
  const thoracicCount = filtered.filter(i => i.specialite === 'Thoracique').length;
  const total = filtered.length;
  const totalGestes = filtered.reduce((acc, i) => acc + i.gestes.length, 0);

  const semestre = SEMESTRES_DATA.find(s => s.id === period);

  return (
    <Screen>
      <TopBar title="Statistiques" subtitle={semestre ? `${semestre.label} — ${semestre.titre}` : 'Toutes périodes'} />

      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Period selector */}
        <div>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: 3, gap: 2 }}>
            {[
              { id: 's3', label: 'S3' },
              { id: 's2', label: 'S2' },
              { id: 's1', label: 'S1' },
              { id: 'all', label: 'Tout' },
            ].map(opt => (
              <button key={opt.id} onClick={() => setPeriod(opt.id)} style={{
                flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer',
                borderRadius: 'calc(var(--r-md) - 2px)',
                background: period === opt.id ? 'var(--primary)' : 'transparent',
                color: period === opt.id ? '#fff' : 'var(--text-2)',
                fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13,
                transition: 'all 0.2s ease',
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard value={total} label="Interventions" color="var(--primary)" />
          <StatCard value={totalGestes} label="Gestes" color="var(--text-1)" />
          <StatCard value={byChir.length} label="Chirurgiens" color="var(--text-2)" />
        </div>

        {/* Spécialité split */}
        <Card padding={16}>
          <SectionTitle>Répartition</SectionTitle>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                {total > 0 ? (() => {
                  const cardPct = cardiacCount / total;
                  const thorPct = thoracicCount / total;
                  const r = 28; const circ = 2 * Math.PI * r;
                  return (
                    <>
                      <circle cx="40" cy="40" r={r} fill="none" stroke="#EBF5FB" strokeWidth="14" />
                      {cardiacCount > 0 && (
                        <circle cx="40" cy="40" r={r} fill="none" stroke="#C0392B" strokeWidth="14"
                          strokeDasharray={`${circ * cardPct} ${circ}`}
                          transform="rotate(-90 40 40)" strokeLinecap="round" />
                      )}
                      {thoracicCount > 0 && (
                        <circle cx="40" cy="40" r={r} fill="none" stroke="#2171B5" strokeWidth="14"
                          strokeDasharray={`${circ * thorPct} ${circ}`}
                          strokeDashoffset={`-${circ * cardPct}`}
                          transform="rotate(-90 40 40)" strokeLinecap="round" />
                      )}
                    </>
                  );
                })() : <circle cx="40" cy="40" r={28} fill="none" stroke="var(--border)" strokeWidth="14" />}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{total}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: 'Thoracique 🫁', count: thoracicCount, color: '#2171B5' },
                { label: 'Cardiaque 🫀', count: cardiacCount, color: '#C0392B' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                      {item.count} {total > 0 ? `(${Math.round(item.count/total*100)}%)` : ''}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: total > 0 ? `${item.count/total*100}%` : '0%', background: item.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Gestes top */}
        {gestesCount.length > 0 && (
          <Card padding={16}>
            <SectionTitle>Top gestes</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {gestesCount.map(([label, count]) => {
                const isCardiac = SPECIALITES_CONFIG.Cardiaque.gestes.some(g => g.label === label);
                const barColor = isCardiac ? '#C0392B' : '#2171B5';
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{count}×</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / maxGeste) * 100}%`, background: barColor, borderRadius: 999, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Évolution mensuelle */}
        {byMonth.length > 0 && (
          <Card padding={16}>
            <SectionTitle>Évolution mensuelle</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {byMonth.map(([key, { label, count }]) => (
                <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)' }}>{count}</span>
                  <div style={{
                    width: '100%', background: 'var(--primary)',
                    height: `${(count / maxMonth) * 60}px`, borderRadius: 4,
                    opacity: 0.75 + (count / maxMonth) * 0.25,
                  }} />
                  <span style={{ fontSize: 9, color: 'var(--text-3)', textAlign: 'center' }}>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Par chirurgien */}
        {byChir.length > 0 && (
          <Card padding={16}>
            <SectionTitle>Par chirurgien</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byChir.map(([nom, count]) => {
                const initiales = nom.split(' ').map(w => w[0]).filter(c => c === c.toUpperCase()).join('').slice(0, 2);
                return (
                  <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initiales={initiales} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{nom}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: `${(count / (byChir[0][1])) * 100}%`, background: 'var(--primary)', borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {filtered.length === 0 && (
          <EmptyState icon="📊" title="Aucune donnée" subtitle="Ajoutez des interventions pour voir vos statistiques." />
        )}

        <div style={{ height: 90 }} />
      </div>
    </Screen>
  );
}

Object.assign(window, { StatisticsScreen });
