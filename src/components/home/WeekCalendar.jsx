import React, { useState } from 'react';
import { format, startOfWeek, addDays, isToday, isBefore, isAfter, subWeeks, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function calcHealthScore(dateStr, meals, profile, waterLogs) {
  const dayMeals = meals.filter((m) => m.date === dateStr);
  if (dayMeals.length === 0) return null;
  const totalCal = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProt = dayMeals.reduce((s, m) => s + (m.protein || 0), 0);
  const calTarget = profile.calorie_target || 2000;
  const protTarget = profile.protein_target || 150;
  const waterTarget = profile.water_target_ml || 2000;
  const dayWater = (waterLogs || []).filter((w) => w.date === dateStr).reduce((s, w) => s + (w.amount_ml || 0), 0);
  const calScore = Math.min(100, Math.max(0, 100 - Math.abs(totalCal - calTarget) / calTarget * 100));
  const protScore = Math.min(100, totalProt / protTarget * 100);
  const waterScore = Math.min(100, dayWater / waterTarget * 100);
  const mealScore = Math.min(100, dayMeals.length * 20);
  return Math.max(0, Math.min(100, Math.round(calScore * 0.35 + protScore * 0.25 + waterScore * 0.25 + mealScore * 0.15)));
}

export default function WeekCalendar({ meals = [], profile = {}, waterLogs = [], onDayClick }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const baseWeek = weekOffset === 0 ? today : weekOffset < 0 ? subWeeks(today, Math.abs(weekOffset)) : addWeeks(today, weekOffset);
  const weekStart = startOfWeek(baseWeek, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthLabel = format(weekStart, 'MMMM yyyy');

  return (
    <div className="px-5 mb-2">
      <div
        className="rounded-[22px] px-4 py-4"
        style={{
          background: 'rgba(230,237,245,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-foreground">{monthLabel}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              disabled={weekOffset >= 0}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Day columns */}
        <div className="flex items-end justify-between">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isTodayDate = isToday(day);
            const isFuture = isAfter(day, today) && !isTodayDate;
            const isPast = isBefore(day, today) && !isTodayDate;
            const isClickable = isPast;
            const score = (isPast || isTodayDate) ? calcHealthScore(dateStr, meals, profile, waterLogs) : null;

            return (
              <button
                key={dateStr}
                onClick={() => isClickable && onDayClick && onDayClick(dateStr)}
                disabled={isFuture}
                className="flex flex-col items-center gap-1 transition-all active:scale-95"
                style={{ minWidth: 36 }}
              >
                {/* Day letter */}
                <span className="text-[11px] font-semibold" style={{ color: isFuture ? '#c0c8d4' : isTodayDate ? '#1a1a1a' : '#8a95a3' }}>
                  {format(day, 'EEEEE')}
                </span>

                {/* Pill for today, plain number otherwise */}
                {isTodayDate ? (
                  <div
                    className="flex flex-col items-center justify-center rounded-[14px] shadow-sm"
                    style={{ width: 34, height: 46, background: '#1a1a1a' }}
                  >
                    <span className="text-[10px] font-bold text-white/60 leading-none">{format(day, 'EEEEE')}</span>
                    <span className="text-base font-extrabold text-white leading-tight">{format(day, 'd')}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center" style={{ width: 34, height: 46 }}>
                    <span
                      className="text-base font-semibold leading-none"
                      style={{ color: isFuture ? '#c0c8d4' : '#374151' }}
                    >
                      {format(day, 'd')}
                    </span>
                    {/* Score dot for past days */}
                    {score !== null && (
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1"
                        style={{ background: score >= 75 ? '#6CC5A0' : score >= 45 ? '#F5C842' : '#F47C7C' }}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}