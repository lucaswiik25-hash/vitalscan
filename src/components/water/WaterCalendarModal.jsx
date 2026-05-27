import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WaterCalendarModal({ allLogs, dailyTarget, onClose }) {
  const [viewDate, setViewDate] = useState(new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Monday-based offset (Mon=0 ... Sun=6)
  const startDow = getDay(monthStart); // 0=Sun
  const offset = startDow === 0 ? 6 : startDow - 1;

  const today = format(new Date(), 'yyyy-MM-dd');

  const getPct = (dateStr) => {
    const total = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    return dailyTarget > 0 ? Math.min(1, total / dailyTarget) : 0;
  };

  // Build grid cells: nulls for offset, then real days
  const cells = [...Array(offset).fill(null), ...days];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const SIZE = 40, STROKE = 4, R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }} onClick={onClose} />
      <motion.div className="absolute inset-0 flex flex-col"
        style={{ background: '#000' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4">
          <button onClick={onClose}
            className="px-4 py-2 rounded-full text-white text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.12)' }}>
            Close
          </button>
          <h2 className="text-white text-lg font-semibold">Hydration</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewDate(d => subMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setViewDate(d => addMonths(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
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
          {format(viewDate, 'MMMM').toLowerCase()}
        </p>

        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto px-4">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 mb-4">
              {row.map((day, ci) => {
                if (!day) return <div key={ci} />;
                const dateStr = format(day, 'yyyy-MM-dd');
                const pct = getPct(dateStr);
                const dash = pct * CIRC;
                const isToday = dateStr === today;
                const dayNum = format(day, 'd');

                return (
                  <div key={ci} className="flex flex-col items-center gap-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                      {dayNum}
                    </span>
                    <div className="relative" style={{ width: SIZE, height: SIZE }}>
                      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
                        {/* Track */}
                        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                          stroke={isToday ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.12)'}
                          strokeWidth={STROKE} />
                        {/* Progress */}
                        {pct > 0 && (
                          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                            stroke={pct >= 1 ? '#60A5FA' : '#F97316'}
                            strokeWidth={STROKE}
                            strokeDasharray={`${dash} ${CIRC}`}
                            strokeLinecap="round" />
                        )}
                      </svg>
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
            <div className="w-3 h-3 rounded-full" style={{ background: '#F97316' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>In progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#60A5FA' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Goal reached</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}