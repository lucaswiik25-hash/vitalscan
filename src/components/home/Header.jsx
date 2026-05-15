import React from 'react';
// liquid glass streak badge

export default function Header({ streak = 0 }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-foreground tracking-tight">Scanly</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{
          background: 'rgba(255,255,255,0.50)',
          backdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>
        <span className="text-base">🔥</span>
        <span className="text-sm font-bold text-foreground">{streak}</span>
      </div>
    </div>
  );
}