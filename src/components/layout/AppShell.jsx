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
    <div className="min-h-screen max-w-lg mx-auto relative" style={{ background: 'linear-gradient(160deg, #fce4ec 0%, #f9f0ff 18%, #f7f7f8 45%, #f7f7f8 100%)', backgroundAttachment: 'fixed' }}>
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