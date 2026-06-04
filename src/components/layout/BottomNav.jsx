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
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{ opacity: 0, pointerEvents: 'none' }}>
      <div className="bg-white border-t border-border px-4 pt-2 pb-6 flex items-center justify-between max-w-lg mx-auto bottom-nav-inner">
        <div className="flex items-center gap-1 flex-1 justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div key={tab.path} className="flex flex-col items-center gap-0.5 min-w-[48px]">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl">
                  <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{tab.label}</span>
              </div>);
          })}
        </div>
      </div>
    </div>);

}