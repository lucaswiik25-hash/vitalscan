import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const HIDE_NAV_PATHS = ['/onboarding', '/food-scanner', '/skincare-scanner', '/supplement-scanner', '/face-scanner', '/body-scanner', '/exercise-form-scanner'];

export default function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen max-w-lg mx-auto relative" style={{ background: 'transparent' }}>
      <div style={{ paddingBottom: hideNav ? 0 : '100px' }}>
        <Outlet />
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
