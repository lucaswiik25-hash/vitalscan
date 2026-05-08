import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideNav from './SideNav';

const HIDE_NAV_PATHS = ['/onboarding', '/food-scanner', '/skincare-scanner', '/supplement-scanner'];

export default function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {!hideNav && <SideNav />}
      <div className="pl-0">
        <Outlet />
      </div>
    </div>
  );
}