import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Droplets, Dumbbell, Settings, Plus, Lightbulb,
  Pill, UtensilsCrossed, ShoppingCart, ShieldAlert, Moon
} from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/water', icon: Droplets, label: 'Hydration' },
  { path: '/sleep', icon: Moon, label: 'Sleep' },
  { path: '/exercise', icon: Dumbbell, label: 'Exercise' },
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
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [ripple, setRipple] = useState(null);
  const [fabRotated, setFabRotated] = useState(false);

  const activeIdx = tabs.findIndex(t => t.path === location.pathname);

  // Update liquid indicator position
  useLayoutEffect(() => {
    const activeEl = itemRefs.current[location.pathname];
    const container = scrollRef.current;
    if (!activeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;

    setIndicatorStyle({
      left: itemRect.left - containerRect.left + scrollLeft,
      width: itemRect.width,
    });

    // Scroll active item into view
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

  const handleTabTap = (e, path) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, id: Date.now(), path });
    setTimeout(() => setRipple(null), 400);
  };

  const handleFabClick = () => {
    setFabRotated(true);
    setTimeout(() => setFabRotated(false), 400);
    navigate('/scanner');
  };

  return (
    <>
      {/* Ripple keyframes */}
      <style>{`
        @keyframes liquidBlob {
          0% { opacity: 0; transform: translateY(-50%) scale(0); }
          50% { opacity: 1; transform: translateY(-50%) scale(1.2); }
          100% { opacity: 0; transform: translateY(-50%) scale(0); }
        }
        @keyframes rippleOut {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .liquid-scroll::-webkit-scrollbar { display: none; }
        .liquid-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="fixed bottom-6 left-0 right-0 z-50 flex items-center justify-center px-5"
        style={{ gap: 12 }}
      >
        {/* Glass nav bar */}
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
          {/* Top gloss overlay */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 100%)',
              borderRadius: '28px 28px 0 0',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Liquid indicator */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              height: 'calc(100% - 16px)',
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(20px)',
              borderRadius: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
              zIndex: 0,
              pointerEvents: 'none',
              transition: 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />

          {/* Scrollable tabs */}
          <div
            ref={scrollRef}
            className="liquid-scroll"
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
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  ref={el => itemRefs.current[tab.path] = el}
                  onClick={(e) => handleTabTap(e, tab.path)}
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
                    WebkitUserSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    zIndex: 2,
                    textDecoration: 'none',
                    flexShrink: 0,
                    transform: isActive ? 'scale(1)' : 'scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Tap ripple */}
                  {ripple && ripple.path === tab.path && (
                    <div
                      key={ripple.id}
                      style={{
                        position: 'absolute',
                        width: 40, height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.35)',
                        left: ripple.x - 20,
                        top: ripple.y - 20,
                        pointerEvents: 'none',
                        animation: 'rippleOut 0.4s ease-out forwards',
                        zIndex: 3,
                      }}
                    />
                  )}

                  <Icon
                    style={{
                      width: 22, height: 22,
                      color: isActive ? '#111827' : 'rgba(255,255,255,0.75)',
                      strokeWidth: isActive ? 2.2 : 1.8,
                      transform: isActive ? 'translateY(-2px) scale(1.1)' : 'translateY(0) scale(1)',
                      transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 600,
                      whiteSpace: 'nowrap',
                      color: isActive ? '#111827' : 'rgba(255,255,255,0.75)',
                      transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
                      transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                      lineHeight: 1,
                    }}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* FAB scanner button */}
        <button
          onClick={handleFabClick}
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
          {/* Gloss overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <Plus
            style={{
              width: 24, height: 24,
              color: '#fff',
              transform: fabRotated ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            strokeWidth={2.5}
          />
        </button>
      </div>
    </>
  );
}