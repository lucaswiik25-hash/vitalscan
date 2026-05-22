import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideNav from './SideNav';
import BottomNav from './BottomNav';

const HIDE_NAV_PATHS = ['/onboarding', '/food-scanner', '/skincare-scanner', '/supplement-scanner', '/face-scanner', '/body-scanner', '/exercise-form-scanner'];

export default function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));
  const [visible, setVisible] = useState(false);

  // Sync dark mode with system preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);

  return (
    <div className="min-h-screen max-w-lg mx-auto relative" style={{ background: 'transparent' }}>
      {!hideNav && <SideNav />}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(18px)',
          transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)',
          paddingBottom: hideNav ? 0 : '80px',
        }}
      >
        <Outlet />
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}