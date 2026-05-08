import React from 'react';
import { format, startOfWeek, addDays, isToday, isBefore, isAfter } from 'date-fns';

// Health score: calculated from meals logged that day (calories, macros coverage)
function calcHealthScore(dateStr, meals, profile, waterLogs) {
  const dayMeals = meals.filter(m => m.date === dateStr);
  if (dayMeals.length === 0) return null;

  const totalCal = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProt = dayMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const calTarget = profile.calorie_target || 2000;
  const protTarget = profile.protein_target || 150;
  const waterTarget = profile.water_target_ml || 2000;

  const dayWater = (waterLogs || []).filter(w => w.date === dateStr).reduce((s, w) => s + (w.amount_ml || 0), 0);

  // Score components (0-100 each)
  const calScore = Math.min(100, Math.max(0, 100 - Math.abs(totalCal - calTarget) / calTarget * 100));
  const protScore = Math.min(100, (totalProt / protTarget) * 100);
  const waterScore = Math.min(100, (dayWater / waterTarget) * 100);
  const mealScore = Math.min(100, dayMeals.length * 20); // up to 5 meals

  const score = Math.round((calScore * 0.35 + protScore * 0.25 + waterScore * 0.25 + mealScore * 0.15));
  return Math.max(0, Math.min(100, score));
}

function scoreColor(score) {
  if (score === null) return null;
  if (score >= 75) return '#6CC5A0';
  if (score >= 45) return '#F5C842';
  return '#F47C7C';
}

export default function WeekCalendar({ loggedDates = [], meals = [], profile = {}, waterLogs = [] }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isTodayDate = isToday(day);
          const isPast = isBefore(day, today) && !isTodayDate;
          const isFuture = isAfter(day, today);
          const score = isPast || isTodayDate ? calcHealthScore(dateStr, meals, profile, waterLogs) : null;
          const dotColor = scoreColor(score);

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1.5">
              <span className={`text-xs font-medium ${isTodayDate ? 'text-foreground font-semibold' : isFuture ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                {format(day, 'EEE')}
              </span>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all relative ${
                  isTodayDate ? 'bg-foreground text-white scale-110 shadow-md' : isFuture ? 'text-muted-foreground/30' : 'text-foreground border border-border'
                }`}
                style={!isTodayDate && !isFuture && dotColor ? { borderColor: dotColor, borderWidth: 2 } : {}}
              >
                {format(day, 'd')}
              </div>
              {/* Health score dot */}
              {dotColor && !isTodayDate && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
              )}
              {isTodayDate && (
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
              )}
              {isFuture && <div className="w-1.5 h-1.5" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 justify-center">
        {[['#6CC5A0', '≥75'], ['#F5C842', '45–74'], ['#F47C7C', '<45']].map(([c, l]) => (
          <div key={l} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: c }} />
            <span className="text-[10px] text-muted-foreground">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}