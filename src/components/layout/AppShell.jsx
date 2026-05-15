import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideNav from './SideNav';

const HIDE_NAV_PATHS = ['/onboarding', '/food-scanner', '/skincare-scanner', '/supplement-scanner'];

export default function AppShell() {
  const location = useLocation();
  const hideNav = HIDE_NAV_PATHS.some(p => location.pathname.startsWith(p));
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, [location.pathname]);

  return (
    <div className="min-h-screen max-w-lg mx-auto relative" style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(255,210,220,0.18) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(190,210,255,0.13) 0%, transparent 45%), radial-gradient(ellipse at 100% 100%, rgba(240,240,255,0.10) 0%, transparent 40%), #f7f7f8', backgroundAttachment: 'fixed' }}>
      {!hideNav && <SideNav />}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(18px)',
          transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}