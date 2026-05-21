import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, X, Plus, Droplets, Pill, UtensilsCrossed, ShoppingCart, ShieldAlert, Settings, Moon, Dumbbell } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/exercise', icon: Dumbbell, label: 'Exercise' },
  { path: '/water', icon: Droplets, label: 'Hydration' },
  { path: '/supplements', icon: Pill, label: 'Supplements' },
  { path: '/sleep', icon: Moon, label: 'Sleep Tracker' },
  { path: '/meal-planner', icon: UtensilsCrossed, label: 'Meal Planner' },
  { path: '/shopping', icon: ShoppingCart, label: 'Shopping List' },
  { path: '/health-risk', icon: ShieldAlert, label: 'Health Risk' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function SideNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Toggle pill — fully transparent / glass */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1 py-4 px-1.5 rounded-r-2xl"
        style={{
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.30)',
          borderLeft: 'none',
          boxShadow: '2px 0 12px rgba(0,0,0,0.06)',
        }}
      >
        <span className="w-1 h-1 rounded-full bg-foreground/30" />
        <span className="w-1 h-1 rounded-full bg-foreground/30" />
        <span className="w-1 h-1 rounded-full bg-foreground/30" />
      </button>

      {/* Floating + scanner button — liquid glass */}
      <button
        onClick={() => navigate('/scanner')}
        aria-label="Open scanner"
        className="fixed bottom-8 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        style={{
          background: 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          border: '1.5px solid rgba(255,255,255,0.75)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <Plus className="w-7 h-7 text-foreground" strokeWidth={2.5} />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          pointerEvents: open ? 'auto' : 'none',
          background: open ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0)',
          backdropFilter: open ? 'blur(4px)' : 'blur(0px)',
          WebkitBackdropFilter: open ? 'blur(4px)' : 'blur(0px)',
        }}
      />

      {/* Drawer — true liquid glass */}
      <div
        className="fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{
          width: 275,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(40px) saturate(180%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.08)',
          borderRight: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '8px 0 48px rgba(0,0,0,0.10), inset 1px 0 0 rgba(255,255,255,0.8)',
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-5">
          <div>
            <span className="text-xl font-bold text-foreground tracking-tight">Scanly</span>
            <div className="w-8 h-0.5 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <X className="w-4 h-4 text-foreground/50" />
          </button>
        </div>

        {/* Nav items */}
        <div className="px-3 flex-1 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: isActive ? 'rgba(26,26,26,0.10)' : 'transparent',
                  border: isActive ? '1px solid rgba(26,26,26,0.12)' : '1px solid transparent',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: isActive ? 'rgba(26,26,26,0.12)' : 'rgba(0,0,0,0.04)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? '#1a1a1a' : 'rgba(0,0,0,0.4)' }} strokeWidth={1.8} />
                </div>
                <span className="text-sm font-medium" style={{ color: isActive ? '#1a1a1a' : 'rgba(0,0,0,0.55)' }}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-800" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="px-6 pb-10 pt-4">
          <p className="text-xs" style={{ color: 'rgba(0,0,0,0.25)' }}>Scanly v1.0</p>
        </div>
      </div>
    </>
  );
}