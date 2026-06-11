// CardioThoNoa — Main App Router

const { useState: useAppState, useEffect: useAppEffect, useMemo: useAppMemo } = React;

const TAB_SCREENS = ['dashboard', 'stats', 'patients', 'settings'];

function App() {
  const [theme, setThemeState] = useAppState(() => localStorage.getItem('ctn-theme') || 'light');
  const [currentSemestreId, setCurrentSemestreIdState] = useAppState(() => localStorage.getItem('ctn-semestre') || SEMESTRES_DATA[0].id);
  const currentSemestre = useAppMemo(() => SEMESTRES_DATA.find(s => s.id === currentSemestreId) || SEMESTRES_DATA[0], [currentSemestreId]);
  const currentSpecialite = currentSemestre.specialite;
  const [route, setRoute] = useAppState({ screen: 'dashboard', params: {} });
  const [prevRoute, setPrevRoute] = useAppState(null);
  const [transitioning, setTransitioning] = useAppState(false);

  // Persist theme
  useAppEffect(() => {
    localStorage.setItem('ctn-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function navigate(screen, params = {}) {
    setPrevRoute(route);
    setTransitioning(true);
    setTimeout(() => {
      setRoute({ screen, params });
      setTransitioning(false);
    }, 120);
  }

  function setTheme(t) {
    setThemeState(t);
  }

  function setCurrentSemestreId(id) {
    localStorage.setItem('ctn-semestre', id);
    setCurrentSemestreIdState(id);
  }

  const isTabScreen = TAB_SCREENS.includes(route.screen);
  const isFormScreen = route.screen === 'new-scroll' || route.screen === 'new-wizard';

  const screenStyle = {
    opacity: transitioning ? 0 : 1,
    transform: transitioning ? 'translateY(8px) scale(0.99)' : 'translateY(0) scale(1)',
    transition: 'opacity 0.18s cubic-bezier(0.22,1,0.36,1), transform 0.18s cubic-bezier(0.22,1,0.36,1)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  };

  function renderScreen() {
    switch (route.screen) {
      case 'dashboard':
        return <DashboardScreen navigate={navigate} currentSemestreId={currentSemestreId} />;
      case 'stats':
        return <StatisticsScreen navigate={navigate} />;
      case 'semestres':
        return <SemestresScreen navigate={navigate} />;
      case 'semestre-detail':
        return <SemestreDetailScreen navigate={navigate} params={route.params} />;
      case 'patients':
        return <PatientsScreen navigate={navigate} />;
      case 'patient-detail':
        return <PatientDetailScreen navigate={navigate} params={route.params} />;
      case 'intervention-detail':
        return <InterventionDetailScreen navigate={navigate} params={route.params} />;
      case 'new-scroll':
        return <NewInterventionScrollScreen navigate={navigate} defaultSpecialite={currentSpecialite} onSwitchToWizard={() => navigate('new-wizard')} />;
      case 'new-wizard':
        return <NewInterventionWizardScreen navigate={navigate} defaultSpecialite={currentSpecialite} onSwitchToScroll={() => navigate('new-scroll')} />;
      case 'settings':
        return <SettingsScreen navigate={navigate} theme={theme} setTheme={setTheme} currentSemestreId={currentSemestreId} setCurrentSemestreId={setCurrentSemestreId} />;
      default:
        return <DashboardScreen navigate={navigate} />;
    }
  }

  return (
    <IOSDevice title="CardioThoNoa" dark={theme === 'dark'}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden',
        background: 'var(--bg)',
        fontFamily: 'var(--font)',
      }}>
        {/* Screen content */}
        <div style={screenStyle}>
          {renderScreen()}
        </div>

        {/* Bottom nav hidden only during form entry */}
        {!isFormScreen && (
          <BottomNav
            active={isTabScreen ? route.screen : null}
            onNavigate={navigate}
            onNew={() => navigate('new-scroll')}
          />
        )}
      </div>
    </IOSDevice>
  );
}

// Mount
const appRoot = ReactDOM.createRoot(document.getElementById('app-root'));
appRoot.render(<App />);
