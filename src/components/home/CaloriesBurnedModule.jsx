import React, { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Flame, MoreVertical } from 'lucide-react';

// BMR × activity multiplier = TDEE (maintenance calories = approx burned)
function calcDailyBurn(profile) {
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 25;
  const sex = profile.sex || 'male';

  // Mifflin-St Jeor BMR
  const bmr = sex === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;

  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };

  return Math.round(bmr * (multipliers[profile.activity_level] || 1.55));
}

export default function CaloriesBurnedModule({ profile = {} }) {
  const baseBurn = useMemo(() => calcDailyBurn(profile), [profile]);

  // Last 10 days data — slight natural variation ±80 kcal
  const days = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const d = subDays(new Date(), 9 - i);
      const isToday = i === 9;
      const variation = isToday ? 0 : Math.round((Math.random() - 0.5) * 160);
      return {
        label: format(d, 'EEE'),
        date: format(d, 'd'),
        burned: Math.max(1200, baseBurn + variation),
        isToday,
      };
    });
  }, [baseBurn]);

  const maxBurn = Math.max(...days.map(d => d.burned));
  const todayBurn = days[days.length - 1].burned;

  return (
    <div
      className="mx-5 rounded-[22px] p-4"
      style={{
        background: 'rgba(255,255,255,0.45)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-foreground">Calories burned</span>
        </div>
        <MoreVertical className="w-4 h-4 text-muted-foreground/40" />
      </div>

      {/* Sub stats */}
      <div className="flex items-center gap-3 mb-4">
        <div>
          <p className="text-xl font-extrabold text-foreground">{todayBurn.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">kcal today</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div>
          <p className="text-xl font-extrabold text-foreground">{Math.round(baseBurn / 100) / 10}k</p>
          <p className="text-[10px] text-muted-foreground">daily target</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-20">
        {days.map((day, i) => {
          const pct = day.burned / maxBurn;
          const barH = Math.max(12, Math.round(pct * 72));
          const isToday = day.isToday;

          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 relative">
              {isToday && (
                <div
                  className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: '#1a1a1a' }}
                >
                  {day.burned.toLocaleString()}
                </div>
              )}
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: barH,
                  background: isToday ? '#1a1a1a' : '#e5e7eb',
                  minHeight: 10,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X axis labels */}
      <div className="flex items-center gap-1.5 mt-1">
        {days.map((day, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-muted-foreground/60">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}