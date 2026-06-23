import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function SleepCalendarModal({ sleepLogs, onClose }) {
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDow = getDay(monthStart);
  const offset = startDow === 0 ? 6 : startDow - 1;

  const today = format(new Date(), 'yyyy-MM-dd');

  const getHours = (dateStr) => {
    const log = sleepLogs.find(l => l.date === dateStr);
    if (!log || !log.duration_minutes) return null;
    return log.duration_minutes / 60;
  };

  // Color: red < 6h, yellow 6-7h, green >= 7h
  const getColor = (hours) => {
    if (hours === null) return null;
    if (hours >= 7) return '#60A5FA';
    if (hours >= 6) return '#F97316';
    return '#F87171';
  };

  const cells = [...Array(offset).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const SIZE = 40, STROKE = 4, R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute left-0 right-0 bottom-0 flex flex-col overflow-hidden"
        style={{ background: '#0a0a0a', top: 0, borderRadius: '32px 32px 0 0' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-white text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            Close
          </button>
          <h2 className="text-white text-lg font-semibold">Sleep</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-4 mb-1">
          {DAY_HEADERS.map((d, i) => (
            <div key={i} className="flex justify-center">
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Month label */}
        <p className="px-5 text-white text-2xl font-bold mb-3 mt-2">
          {format(viewDate, 'MMMM')}
        </p>

        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto px-4">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 mb-4">
              {row.map((day, ci) => {
                if (!day) return <div key={ci} />;
                const dateStr = format(day, 'yyyy-MM-dd');
                const hours = getHours(dateStr);
                const color = getColor(hours);
                const pct = hours !== null ? Math.min(1, hours / 9) : 0;
                const dash = pct * CIRC;
                const isToday = dateStr === today;

                return (
                  <div key={ci} className="flex flex-col items-center gap-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                      {format(day, 'd')}
                    </span>
                    <div className="relative" style={{ width: SIZE, height: SIZE }}>
                      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                          stroke={isToday ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)'}
                          strokeWidth={STROKE} />
                        {pct > 0 && (
                          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                            stroke={color}
                            strokeWidth={STROKE}
                            strokeDasharray={`${dash} ${CIRC}`}
                            strokeLinecap="round" />
                        )}
                      </svg>
                      {hours !== null && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                            {hours.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-4 pb-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#F87171' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{'< 6h'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#F97316' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>6–7h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#60A5FA' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{'≥ 7h'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}