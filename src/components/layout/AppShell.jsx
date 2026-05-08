import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const HIDE_NAV_PATHS = ['/onboarding', '/scanner', '/food-scanner', '/skincare-scanner', '/supplement-scanner'];

export default function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <div className={hideNav ? '' : 'pb-28'}>
        <Outlet />
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}