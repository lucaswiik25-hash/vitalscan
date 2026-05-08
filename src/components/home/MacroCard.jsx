import React from 'react';
import ProgressRing from './ProgressRing';

export default function MacroCard({ value, unit = 'g', label, emoji, progress = 0 }) {
  return (
    <div className="bg-white border border-border rounded-[20px] p-4 flex flex-col shadow-sm flex-1">
      <span className="text-2xl font-bold text-foreground">{value}{unit}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
      <div className="mt-3 flex justify-start">
        <ProgressRing progress={progress} size={44} strokeWidth={4} />
      </div>
    </div>
  );
}