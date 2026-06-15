import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useData, useCurrentSemester } from '../../store/hooks';
import { specialtyForSemester } from '../../lib/queries';
import { getSpecialty } from '../../data/constants';
import { BottomNav } from './BottomNav';
import { BackgroundArt } from './BackgroundArt';
import { DemoBanner } from './DemoBanner';
import { UpgradeModal } from '../billing/UpgradeModal';
import { OnboardingWizard } from '../onboarding/OnboardingWizard';

function shouldHideNav(pathname) {
  return pathname === '/interventions/nouvelle' || pathname.endsWith('/modifier');
}

export function AppLayout() {
  const theme = useStore((s) => s.theme);
  const isDemo = useAuthStore((s) => s.isDemo);
  const isPaid = useAuthStore((s) => s.isPaid);
  const entitlementLoaded = useAuthStore((s) => s.entitlementLoaded);
  // Bandeau « lecture seule » : démo (sans compte) ou compte gratuit (connecté,
  // non payé). On attend le chargement du droit d'accès pour éviter un flash.
  const showLockedBanner = isDemo || (entitlementLoaded && !isPaid);
  const { pathname } = useLocation();
  const hideNav = shouldHideNav(pathname);

  const data = useData();
  const semester = useCurrentSemester();
  const specialty = semester ? specialtyForSemester(data, semester.id) : getSpecialty('autre');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg flex justify-center">
      {theme !== 'dark' && <BackgroundArt type={specialty.key} />}
      <div
        className="relative z-10 w-full max-w-app min-h-screen flex flex-col"
        style={{ paddingBottom: hideNav ? 0 : 88 }}
      >
        {showLockedBanner && <DemoBanner isDemo={isDemo} />}
        <Outlet />
        {!hideNav && <BottomNav />}
      </div>
      <UpgradeModal />
      <OnboardingWizard />
    </div>
  );
}
