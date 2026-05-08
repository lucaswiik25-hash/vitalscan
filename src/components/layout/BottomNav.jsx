import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Users, User, Plus } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/progress', icon: BarChart3, label: 'Progress' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-border px-4 pb-6 pt-2 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-1 flex-1 justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center gap-0.5 min-w-[56px]"
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  isActive ? 'bg-secondary' : ''
                }`}>
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={`text-[10px] font-medium ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
        <Link
          to="/scanner"
          className="w-14 h-14 bg-foreground rounded-2xl flex items-center justify-center shadow-lg -mt-4 ml-2"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}