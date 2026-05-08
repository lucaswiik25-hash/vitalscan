import React from 'react';
import { Flame, RotateCcw } from 'lucide-react';
import ProgressRing from './ProgressRing';

export default function CalorieCard({ caloriesLeft = 0, caloriesTarget = 2000, caloriesConsumed = 0 }) {
  const progress = caloriesTarget > 0 ? ((caloriesConsumed / caloriesTarget) * 100) : 0;

  return (
    <div className="bg-white border border-border rounded-[20px] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-5xl font-extrabold text-foreground tracking-tight">
            {Math.max(0, caloriesLeft)}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Calories left ⇅</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">+200</span>
          </div>
        </div>
        <ProgressRing progress={progress} size={100} strokeWidth={8}>
          <Flame className="w-7 h-7 text-foreground" />
        </ProgressRing>
      </div>
    </div>
  );
}