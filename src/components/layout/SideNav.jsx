import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Users, User, X, Plus } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/progress', icon: BarChart3, label: 'Progress' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function SideNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Small toggle pill on left edge */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1 py-4 px-1.5 rounded-r-2xl"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.55)',
          borderLeft: 'none',
          boxShadow: '2px 0 16px rgba(0,0,0,0.08)',
        }}
      >
        <span className="w-1 h-1 rounded-full bg-foreground/40" />
        <span className="w-1 h-1 rounded-full bg-foreground/40" />
        <span className="w-1 h-1 rounded-full bg-foreground/40" />
      </button>

      {/* Floating + scanner button */}
      <button
        onClick={() => navigate('/scanner')}
        aria-label="Open scanner"
        className="fixed bottom-8 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        style={{
          background: '#1a1a1a',
          border: '3px solid rgba(255,255,255,0.18)',
        }}
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          pointerEvents: open ? 'auto' : 'none',
          background: open ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0)',
          backdropFilter: open ? 'blur(3px)' : 'blur(0px)',
          WebkitBackdropFilter: open ? 'blur(3px)' : 'blur(0px)',
        }}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{
          width: 270,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(240,240,240,0.72)',
          backdropFilter: 'blur(48px)',
          WebkitBackdropFilter: 'blur(48px)',
          borderRight: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '12px 0 48px rgba(0,0,0,0.10)',
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-5">
          <div>
            <span className="text-xl font-bold text-foreground tracking-tight">Scanly</span>
            <div className="w-8 h-0.5 rounded-full mt-1" style={{ background: '#6CC5A0' }} />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.07)' }}
          >
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        {/* Nav items */}
        <div className="px-4 flex-1 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                style={{
                  background: isActive ? 'rgba(108,197,160,0.22)' : 'rgba(0,0,0,0.03)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: isActive ? 'rgba(108,197,160,0.28)' : 'rgba(0,0,0,0.06)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? '#4aad85' : '#888' }} strokeWidth={2} />
                </div>
                <span className="text-sm font-medium" style={{ color: isActive ? '#1a1a1a' : '#555' }}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#6CC5A0' }} />
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-6 pb-10 pt-4">
          <p className="text-xs text-muted-foreground/40">Scanly v1.0</p>
        </div>
      </div>
    </>
  );
}