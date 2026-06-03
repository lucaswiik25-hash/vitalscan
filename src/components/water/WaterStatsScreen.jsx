import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const BG = '#e8e8ec';
const SURFACE = '#f0f0f4';
const BLACK = '#1a1a1a';
const NM = '8px 8px 16px rgba(174,174,192,0.4), -8px -8px 16px rgba(255,255,255,0.8)';
const NM_SM = '6px 6px 12px rgba(174,174,192,0.3), -6px -6px 12px rgba(255,255,255,0.7)';
const BLK_SM = '4px 4px 8px rgba(0,0,0,0.25), -2px -2px 6px rgba(255,255,255,0.4)';

export default function WaterStatsScreen({ allLogs, dailyTarget, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Build last 14 days
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const total = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    return { date: format(d, 'MMM d'), dateStr, ml: total, short: format(d, 'dd') };
  });

  // Stats
  const loggedDays = last14.filter(d => d.ml > 0);
  const avgMl = loggedDays.length > 0 ? Math.round(loggedDays.reduce((s, d) => s + d.ml, 0) / loggedDays.length) : 0;
  const bestDay = last14.reduce((best, d) => d.ml > best.ml ? d : best, { ml: 0, date: '—' });
  const goalDays = last14.filter(d => d.ml >= dailyTarget).length;
  const streak = (() => {
    let s = 0;
    for (let i = last14.length - 1; i >= 0; i--) {
      if (last14[i].ml >= dailyTarget) s++;
      else break;
    }
    return s;
  })();

  // Type breakdown for today
  const todayLogs = allLogs.filter(l => l.date === today);
  const typeBreakdown = ['water', 'coffee', 'tea', 'soda', 'alcohol', 'energy_drink'].map(type => ({
    type,
    ml: todayLogs.filter(l => l.type === type).reduce((s, l) => s + Math.abs(l.amount_ml), 0),
  })).filter(t => t.ml > 0);

  const typeEmoji = { water: '💧', coffee: '☕', tea: '🍵', soda: '🥤', alcohol: '🍷', energy_drink: '⚡' };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: BG }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>Statistics</h2>
        <button onClick={onClose}
          className="w-10 h-10 rounded-[14px] flex items-center justify-center"
          style={{ background: SURFACE, boxShadow: NM_SM }}>
          <X className="w-5 h-5" style={{ color: '#6b7280' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-16 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '14-Day Avg', value: avgMl >= 1000 ? `${(avgMl / 1000).toFixed(1)}L` : `${avgMl}ml`, sub: 'daily average' },
            { label: 'Best Day', value: bestDay.ml >= 1000 ? `${(bestDay.ml / 1000).toFixed(1)}L` : `${bestDay.ml}ml`, sub: bestDay.date },
            { label: 'Goal Days', value: `${goalDays}/14`, sub: 'last two weeks' },
            { label: 'Current Streak', value: `${streak}d`, sub: streak === 1 ? 'day in a row' : 'days in a row' },
          ].map(card => (
            <div key={card.label} className="rounded-[20px] p-4" style={{ background: SURFACE, boxShadow: NM_SM }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#9ca3af' }}>{card.label}</p>
              <p className="text-2xl font-extrabold" style={{ color: BLACK }}>{card.value}</p>
              <p className="text-[10px] mt-1" style={{ color: '#9ca3af' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="rounded-[24px] p-5" style={{ background: SURFACE, boxShadow: NM }}>
          <p className="text-sm font-bold mb-4" style={{ color: '#374151' }}>Last 14 Days</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last14} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barSize={12}>
              <XAxis dataKey="short" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${v / 1000}L` : `${v}`} />
              <ReferenceLine y={dailyTarget} stroke={BLACK} strokeDasharray="4 3" strokeWidth={1} />
              <Bar dataKey="ml" radius={[6, 6, 0, 0]}>
                {last14.map((entry, i) => (
                  <Cell key={i} fill={entry.ml >= dailyTarget ? BLACK : entry.ml > 0 ? '#888' : '#d4d4d4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: BLACK }} />
              <span className="text-[10px]" style={{ color: '#9ca3af' }}>Goal reached</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#888' }} />
              <span className="text-[10px]" style={{ color: '#9ca3af' }}>Partial</span>
            </div>
          </div>
        </div>

        {/* Today breakdown by type */}
        {typeBreakdown.length > 0 && (
          <div className="rounded-[24px] p-5" style={{ background: SURFACE, boxShadow: NM }}>
            <p className="text-sm font-bold mb-3" style={{ color: '#374151' }}>Today's Breakdown</p>
            <div className="space-y-3">
              {typeBreakdown.map(t => {
                const pct = Math.min(100, (t.ml / dailyTarget) * 100);
                return (
                  <div key={t.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize" style={{ color: '#374151' }}>
                        {typeEmoji[t.type]} {t.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs" style={{ color: '#9ca3af' }}>{t.ml}ml</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: '#d4d4d4' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: BLACK }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily target info */}
        <div className="rounded-[24px] p-5" style={{ background: `linear-gradient(135deg, #2d2d2d 0%, #111 100%)`, boxShadow: BLK_SM }}>
          <p className="text-sm font-semibold text-white mb-1">Daily Target</p>
          <p className="text-3xl font-extrabold text-white">
            {dailyTarget >= 1000 ? `${(dailyTarget / 1000).toFixed(1)}L` : `${dailyTarget}ml`}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Set in your profile settings
          </p>
        </div>
      </div>
    </motion.div>
  );
}