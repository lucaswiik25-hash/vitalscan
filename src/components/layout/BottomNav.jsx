import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Droplets, Dumbbell, Settings, Plus, Lightbulb } from 'lucide-react';

const tabs = [
{ path: '/', icon: Home, label: 'Home' },
{ path: '/water', icon: Droplets, label: 'Hydration' },
{ path: '/tips', icon: Lightbulb, label: 'Tips' },
{ path: '/exercise', icon: Dumbbell, label: 'Exercise' },
{ path: '/settings', icon: Settings, label: 'Settings' }];


export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [ripple, setRipple] = useState(null);

  const handleScannerClick = (e) => {
    e.preventDefault();
    if (!btnRef.current) { navigate('/scanner'); return; }
    const rect = btnRef.current.getBoundingClientRect();
    setRipple({ top: rect.top, left: rect.left });
    setTimeout(() => {
      navigate('/scanner');
      setRipple(null);
    }, 420);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-border px-4 pt-2 pb-6 flex items-center justify-between max-w-lg mx-auto bottom-nav-inner opacity-0">
        <div className="flex items-center gap-1 flex-1 justify-around">
          {tabs.map((tab) => {
            const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
            const Icon = tab.icon;
            return (
              <div
                key={tab.path}
                className="flex flex-col items-center gap-0.5 min-w-[56px]">
                
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                isActive ? 'bg-secondary' : ''}`
                }>
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'}`
                    }
                    strokeWidth={isActive ? 2.5 : 2} />
                  
                </div>
                <span className={`text-[10px] font-medium ${
                isActive ? 'text-foreground' : 'text-muted-foreground'}`
                }>
                  {tab.label}
                </span>
              </div>);

          })}
        </div>
      
      <button
          ref={btnRef}
          onClick={handleScannerClick}
          className="w-14 h-14 rounded-2xl flex items-center justify-center -mt-4 ml-2 active:scale-95 transition-transform"
          style={{
            background: 'rgba(26,26,26,0.70)',
            backdropFilter: 'blur(24px) saturate(180%) brightness(1.1)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(1.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.15)'
          }}>
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>

      {ripple && (
        <div
          className="scanner-ripple"
          style={{ '--btn-top': `${ripple.top}px`, '--btn-left': `${ripple.left}px` }}
        />
      )}
      </div>
    </div>);

}