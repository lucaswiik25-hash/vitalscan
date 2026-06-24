import React, { useRef, useState, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Settings, Plus, Lightbulb,
  Pill, UtensilsCrossed, ShoppingCart, ShieldAlert
} from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/supplements', icon: Pill, label: 'Supps' },
  { path: '/tips', icon: Lightbulb, label: 'Tips' },
  { path: '/meal-planner', icon: UtensilsCrossed, label: 'Meals' },
  { path: '/shopping', icon: ShoppingCart, label: 'Shop' },
  { path: '/health-risk', icon: ShieldAlert, label: 'Health' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const itemRefs = useRef({});
  const [tappedPath, setTappedPath] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);

  useLayoutEffect(() => {
    const activeEl = itemRefs.current[location.pathname];
    const container = scrollRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;

    const itemLeft = itemRect.left - containerRect.left + scrollLeft;
    const itemRight = itemLeft + itemRect.width;
    const viewLeft = scrollLeft + 20;
    const viewRight = scrollLeft + container.clientWidth - 20;
    if (itemLeft < viewLeft) {
      container.scrollTo({ left: itemLeft - 20, behavior: 'smooth' });
    } else if (itemRight > viewRight) {
      container.scrollTo({ left: itemRight - container.clientWidth + 20, behavior: 'smooth' });
    }
  }, [location.pathname]);

  const handleTabTap = (path) => {
    setTappedPath(path);
    setTimeout(() => setTappedPath(null), 280);
  };

  const handleFabClick = () => {
    setFabOpen(true);
    setTimeout(() => {
      setFabOpen(false);
      navigate('/scanner');
    }, 180);
  };

  return (
    <div
      className="fixed left-0 right-0 z-50 flex items-center justify-center px-5"
      style={{ gap: 12, bottom: 'max(24px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          maxWidth: 380,
          borderRadius: 28,
          padding: 8,
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.22)',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 100%)',
            borderRadius: '28px 28px 0 0',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        <div
          ref={scrollRef}
          className="liquid-scroll no-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflowX: 'auto',
            position: 'relative',
            zIndex: 2,
            padding: '0 4px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            const isTapped = tappedPath === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                ref={el => { itemRefs.current[tab.path] = el; }}
                onClick={() => handleTabTap(tab.path)}
                className="press-scale"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '10px 16px',
                  minWidth: 60,
                  borderRadius: 20,
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  zIndex: 2,
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                <div
                  className={`nav-tab-pill ${isActive ? 'is-active' : ''}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,255,255,0.92)',
                    borderRadius: 20,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                <Icon
                  className={`nav-tab-icon ${isActive || isTapped ? 'is-active' : ''}`}
                  style={{
                    width: isActive ? 24 : 22,
                    height: isActive ? 24 : 22,
                    color: '#111827',
                    strokeWidth: isActive ? 2.2 : 1.8,
                    position: 'relative',
                    zIndex: 1,
                    transition: 'width 280ms cubic-bezier(0.34, 1.56, 0.64, 1), height 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
                <span
                  className={`nav-tab-label ${isActive ? 'is-active' : ''}`}
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 600,
                    whiteSpace: 'nowrap',
                    color: '#111827',
                    lineHeight: 1,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleFabClick}
        className={`fab-btn press-scale ${fabOpen ? 'is-open' : ''}`}
        style={{
          position: 'relative',
          width: 56, height: 56,
          borderRadius: '50%',
          background: '#111827',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <Plus
          className="fab-icon"
          style={{ width: 24, height: 24, color: '#fff' }}
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}