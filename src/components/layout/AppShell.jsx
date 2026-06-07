import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

const HIDE_NAV_PATHS = ['/onboarding', '/food-scanner', '/skincare-scanner', '/supplement-scanner', '/face-scanner', '/body-scanner', '/exercise-form-scanner'];

export default function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    setPhase('exit');
    const exitTimer = setTimeout(() => setPhase('enter'), 150);
    return () => clearTimeout(exitTimer);
  }, [location.pathname]);

  useEffect(() => {
    if (phase === 'enter') {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('visible'));
      });
      return () => cancelAnimationFrame(t);
    }
  }, [phase]);

  const isVisible = phase === 'visible';
  const isExiting = phase === 'exit';

  return (
    <div className="min-h-screen max-w-lg mx-auto relative" style={{ background: 'transparent' }}>
      <div
        className={`page-route-enter ${isVisible ? 'is-visible' : ''} ${isExiting ? 'page-route-exit is-exiting' : ''}`}
        style={{ paddingBottom: hideNav ? 0 : '100px' }}
      >
        <Outlet />
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
