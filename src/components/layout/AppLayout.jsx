import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { BottomNav } from './BottomNav';

function shouldHideNav(pathname) {
  return pathname === '/interventions/nouvelle' || pathname.endsWith('/modifier');
}

export function AppLayout() {
  const theme = useStore((s) => s.theme);
  const { pathname } = useLocation();
  const hideNav = shouldHideNav(pathname);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg flex justify-center">
      <div
        className="relative w-full max-w-app bg-bg min-h-screen flex flex-col"
        style={{ paddingBottom: hideNav ? 0 : 88 }}
      >
        <Outlet />
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
