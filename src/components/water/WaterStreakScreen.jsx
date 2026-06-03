import React from 'react';
import { motion } from 'framer-motion';
import { X, Flame, Trophy, Target, Zap } from 'lucide-react';
import { format, subDays } from 'date-fns';

const BG = '#e8e8ec';
const SURFACE = '#f0f0f4';
const BLACK = '#1a1a1a';
const NM = '8px 8px 16px rgba(174,174,192,0.4), -8px -8px 16px rgba(255,255,255,0.8)';
const NM_SM = '6px 6px 12px rgba(174,174,192,0.3), -6px -6px 12px rgba(255,255,255,0.7)';
const BLK_SM = '4px 4px 8px rgba(0,0,0,0.25), -2px -2px 6px rgba(255,255,255,0.4)';

export default function WaterStreakScreen({ allLogs, dailyTarget, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Build last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const ml = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    return { dateStr, ml, isToday: dateStr === today, label: format(d, 'd') };
  });

  // Current streak (from today backwards)
  const currentStreak = (() => {
    let s = 0;
    for (let i = last30.length - 1; i >= 0; i--) {
      if (last30[i].ml >= dailyTarget) s++;
      else break;
    }
    return s;
  })();

  // Best streak in last 30 days
  let bestStreak = 0, tempStreak = 0;
  for (const d of last30) {
    if (d.ml >= dailyTarget) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
    else tempStreak = 0;
  }

  // Goal completion rate
  const goalDays = last30.filter(d => d.ml >= dailyTarget).length;
  const completionRate = Math.round((goalDays / 30) * 100);

  const milestones = [
    { days: 3, label: '3-Day Habit', emoji: '🌱', unlocked: currentStreak >= 3 },
    { days: 7, label: 'Week Warrior', emoji: '💪', unlocked: currentStreak >= 7 },
    { days: 14, label: '2-Week Strong', emoji: '🔥', unlocked: currentStreak >= 14 },
    { days: 30, label: 'Hydration Master', emoji: '🏆', unlocked: currentStreak >= 30 },
  ];

  // Weeks grid (5 columns for days Mon–Fri style, show 5 weeks = 35 cells)
  const gridDays = Array.from({ length: 35 }, (_, i) => {
    const d = subDays(new Date(), 34 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const ml = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    const isToday = dateStr === today;
    const pct = dailyTarget > 0 ? Math.min(1, ml / dailyTarget) : 0;
    return { dateStr, ml, pct, isToday };
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: BG }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>Streak</h2>
        <button onClick={onClose}
          className="w-10 h-10 rounded-[14px] flex items-center justify-center"
          style={{ background: SURFACE, boxShadow: NM_SM }}>
          <X className="w-5 h-5" style={{ color: '#6b7280' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-16 space-y-4">
        {/* Hero streak */}
        <div className="rounded-[28px] p-6 text-center"
          style={{ background: `linear-gradient(135deg, #2d2d2d 0%, #111 100%)`, boxShadow: BLK_SM }}>
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Flame className="w-10 h-10 text-orange-400" />
          </div>
          <p className="text-6xl font-extrabold text-white">{currentStreak}</p>
          <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            day{currentStreak !== 1 ? 's' : ''} in a row
          </p>
          {currentStreak === 0 && (
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Hit your daily goal to start a streak!
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Trophy className="w-4 h-4" style={{ color: '#9ca3af' }} />, label: 'Best Streak', value: `${bestStreak}d` },
            { icon: <Target className="w-4 h-4" style={{ color: '#9ca3af' }} />, label: 'Goal Days', value: `${goalDays}` },
            { icon: <Zap className="w-4 h-4" style={{ color: '#9ca3af' }} />, label: 'Completion', value: `${completionRate}%` },
          ].map(card => (
            <div key={card.label} className="rounded-[18px] p-3 text-center" style={{ background: SURFACE, boxShadow: NM_SM }}>
              <div className="flex justify-center mb-1">{card.icon}</div>
              <p className="text-xl font-extrabold" style={{ color: BLACK }}>{card.value}</p>
              <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#9ca3af' }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Activity heatmap (5 weeks × 7 days) */}
        <div className="rounded-[24px] p-5" style={{ background: SURFACE, boxShadow: NM }}>
          <p className="text-sm font-bold mb-4" style={{ color: '#374151' }}>Last 5 Weeks</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[9px] font-bold mb-1" style={{ color: '#9ca3af' }}>{d}</div>
            ))}
            {gridDays.map((d, i) => {
              const opacity = d.pct === 0 ? 0.08 : d.pct < 0.5 ? 0.35 : d.pct < 1 ? 0.65 : 1;
              return (
                <div key={i}
                  className="aspect-square rounded-[6px]"
                  style={{
                    background: d.pct > 0 ? `rgba(26,26,26,${opacity})` : 'rgba(0,0,0,0.07)',
                    border: d.isToday ? `2px solid ${BLACK}` : '2px solid transparent',
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { opacity: 0.08, label: 'None' },
              { opacity: 0.35, label: '< 50%' },
              { opacity: 0.65, label: '50–99%' },
              { opacity: 1, label: 'Goal!' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-[3px]" style={{ background: `rgba(26,26,26,${l.opacity})` }} />
                <span className="text-[9px]" style={{ color: '#9ca3af' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="rounded-[24px] p-5" style={{ background: SURFACE, boxShadow: NM }}>
          <p className="text-sm font-bold mb-4" style={{ color: '#374151' }}>Milestones</p>
          <div className="space-y-3">
            {milestones.map(m => (
              <div key={m.days} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: m.unlocked ? BLACK : '#d4d4d4',
                    filter: m.unlocked ? 'none' : 'grayscale(1)',
                  }}>
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: m.unlocked ? '#374151' : '#9ca3af' }}>{m.label}</p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>{m.days} day streak</p>
                </div>
                {m.unlocked && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: '#d1fae5' }}>
                    <span className="text-xs text-green-600">✓</span>
                  </div>
                )}
                {!m.unlocked && (
                  <p className="text-xs font-semibold" style={{ color: '#9ca3af' }}>
                    {m.days - currentStreak}d left
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}