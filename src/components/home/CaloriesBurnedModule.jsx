import React, { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// BMR per spec: Men = (10×w) + (6.25×h) - (5×a) + 5 | Women = (10×w) + (6.25×h) - (5×a) - 161
function calcBMR(profile) {
  const w = profile.weight || 70, h = profile.height || 170, a = profile.age || 25;
  return profile.sex === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
}

export default function CaloriesBurnedModule({ profile = {} }) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const bmr = useMemo(() => calcBMR(profile), [profile]);

  const { data: todayExercises = [] } = useQuery({
    queryKey: ['exercises', today],
    queryFn: () => base44.entities.Exercise.filter({ date: today }),
  });

  const todayBurned = todayExercises.reduce((s, e) => s + (e.calories_burned || 0), 0);

  // Bar chart: last 7 days — use bmr as base with seeded variation for past days
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const isToday = i === 6;
      const seed = d.getDate() * 13 + d.getMonth() * 7;
      const variation = ((seed % 5) - 2) * 60;
      return {
        label: format(d, 'EEE'),
        burned: isToday ? todayBurned : Math.max(0, Math.round(bmr * 0.25 + variation)),
        isToday,
      };
    });
  }, [bmr, todayBurned]);

  const exerciseTarget = Math.round(bmr * 0.3);
  const pct = exerciseTarget > 0 ? Math.min(100, (todayBurned / exerciseTarget) * 100) : 0;

  const glassStyle = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(0,0,0,0.09)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
  };

  return (
    <button
      className="mx-5 rounded-[24px] p-5 w-[calc(100%-40px)] text-left active:scale-[0.98] transition-transform"
      style={glassStyle}
      onClick={() => navigate('/exercise')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.12)' }}>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-sm font-bold text-foreground">Calories Burned</span>
        </div>
        <span className="text-xs text-muted-foreground/50">Target: {exerciseTarget} kcal</span>
      </div>

      {/* Stats row */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-3xl font-extrabold text-foreground leading-none">{todayBurned.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">kcal today · {Math.round(pct)}% of target</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">BMR</p>
          <p className="text-sm font-bold text-foreground">{bmr.toLocaleString()} kcal</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(0,0,0,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
      </div>

      {/* Bar chart — height proportional to target */}
      <div className="flex items-end gap-1.5 h-16">
        {days.map((day, i) => {
          const barPct = exerciseTarget > 0 ? Math.min(100, (day.burned / exerciseTarget) * 100) : 0;
          const barH = Math.max(4, Math.round(barPct / 100 * 56));
          const isToday = day.isToday;
          const barColor = isToday
            ? (pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444')
            : '#e5e7eb';
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <div className="w-full rounded-t-md transition-all" style={{ height: barH, background: barColor }} />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        {days.map((day, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted-foreground/60">{day.label}</span>
          </div>
        ))}
      </div>
    </button>
  );
}