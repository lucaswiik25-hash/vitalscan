import React from 'react';

export default function Header({ streak = 0 }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-foreground tracking-tight">Scanly</span>
      </div>
      <div className="flex items-center gap-1.5 bg-white border border-border rounded-full px-3 py-1.5 shadow-sm">
        <span className="text-base">🔥</span>
        <span className="text-sm font-bold text-foreground">{streak}</span>
      </div>
    </div>
  );
}