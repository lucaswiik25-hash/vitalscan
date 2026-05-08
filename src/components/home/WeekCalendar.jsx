import React from 'react';
import { format, startOfWeek, addDays, isToday, isBefore, isAfter } from 'date-fns';

export default function WeekCalendar({ loggedDates = [] }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loggedSet = new Set(loggedDates.map(d => format(new Date(d), 'yyyy-MM-dd')));

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isTodayDate = isToday(day);
          const isPast = isBefore(day, today) && !isTodayDate;
          const isFuture = isAfter(day, today);
          const hasLog = loggedSet.has(dateStr);

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1.5">
              <span className={`text-xs font-medium ${
                isTodayDate ? 'text-foreground font-semibold' : 
                isFuture ? 'text-muted-foreground/40' : 'text-muted-foreground'
              }`}>
                {format(day, 'EEE')}
              </span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isTodayDate
                  ? 'bg-foreground text-white scale-110 shadow-md'
                  : isPast && hasLog
                    ? 'border-2 border-red-400 text-foreground'
                    : isPast
                      ? 'border border-dashed border-muted-foreground/30 text-muted-foreground'
                      : 'text-muted-foreground/30'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}