import React from 'react';
import { motion } from 'framer-motion';
import { X, Flame, Trophy, Target, Zap } from 'lucide-react';
import { format, subDays } from 'date-fns';

import { MODULE_BORDER, moduleCardShadow } from '@/lib/cardStyles';

const CARD = {
  background: '#FFFFFF',
  borderRadius: 28,
  padding: 20,
  border: MODULE_BORDER,
  boxShadow: moduleCardShadow,
};

const MILESTONE_TINTS = {
  3:  '#FEF3C7',
  7:  '#DBEAFE',
  14: '#FCE7F3',
  30: '#D1FAE5',
};

export default function WaterStreakScreen({ allLogs, dailyTarget, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const ml = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    return { dateStr, ml, isToday: dateStr === today, label: format(d, 'd') };
  });

  const currentStreak = (() => {
    let s = 0;
    for (let i = last30.length - 1; i >= 0; i--) {
      if (last30[i].ml >= dailyTarget) s++;
      else break;
    }
    return s;
  })();

  let bestStreak = 0, tempStreak = 0;
  for (const d of last30) {
    if (d.ml >= dailyTarget) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
    else tempStreak = 0;
  }

  const goalDays = last30.filter(d => d.ml >= dailyTarget).length;
  const completionRate = Math.round((goalDays / 30) * 100);

  const milestones = [
    { days: 3, label: '3-Day Habit', emoji: '🌱', sub: '3 day streak', unlocked: currentStreak >= 3 },
    { days: 7, label: 'Week Warrior', emoji: '💪', sub: '7 day streak', unlocked: currentStreak >= 7 },
    { days: 14, label: '2-Week Strong', emoji: '🔥', sub: '14 day streak', unlocked: currentStreak >= 14 },
    { days: 30, label: 'Hydration Master', emoji: '🏆', sub: '30 day streak', unlocked: currentStreak >= 30 },
  ];

  const gridDays = Array.from({ length: 35 }, (_, i) => {
    const d = subDays(new Date(), 34 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const ml = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    const isToday = dateStr === today;
    const pct = dailyTarget > 0 ? Math.min(1, ml / dailyTarget) : 0;
    return { dateStr, ml, pct, isToday };
  });

  const getCellStyle = (d) => {
    if (d.pct >= 1) return { background: '#0F172A', color: 'white', fontWeight: 700 };
    if (d.pct >= 0.5) return { background: '#FEF3C7', color: '#92400E' };
    return { background: '#F2F4F8', color: '#9BA3AF' };
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: '#F2F4F8' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>Streak</h2>
        <button onClick={onClose}
          className="w-10 h-10 rounded-[14px] flex items-center justify-center"
          style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: MODULE_BORDER }}>
          <X className="w-5 h-5" style={{ color: '#6b7280' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-16" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero streak */}
        <div className="text-center" style={{
          borderRadius: 32,
          padding: 32,
          background: `radial-gradient(ellipse at 50% 30%, rgba(251,146,60,0.2) 0%, transparent 60%), linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
          boxShadow: '0 8px 32px rgba(15,52,96,0.3)',
        }}>
          <div className="flex items-center justify-center mb-4" style={{
            width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.08)', margin: '0 auto 16px',
          }}>
            <Flame className="w-9 h-9 text-orange-400" />
          </div>
          <p style={{ fontSize: 72, fontWeight: 900, color: 'white', lineHeight: 1 }}>{currentStreak}</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
            day{currentStreak !== 1 ? 's' : ''} in a row
          </p>
          {currentStreak === 0 && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
              Hit your daily goal to start a streak!
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3" style={{ gap: 12, alignItems: 'stretch' }}>
          {[
            { icon: Trophy, label: 'BEST STREAK', value: `${bestStreak}d`, color: '#F59E0B' },
            { icon: Target, label: 'GOAL DAYS', value: `${goalDays}`, color: '#3B82F6' },
            { icon: Zap, label: 'COMPLETION', value: `${completionRate}%`, color: '#10B981' },
          ].map(card => (
            <div key={card.label} className="flex flex-col" style={{
              ...CARD,
              borderRadius: 24,
              padding: 16,
              minHeight: 100,
            }}>
              <card.icon style={{ width: 20, height: 20, color: card.color, marginBottom: 8 }} />
              <p style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{card.value}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#9BA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={CARD}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Last 5 Weeks</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9BA3AF', marginBottom: 2 }}>{d}</div>
            ))}
            {gridDays.map((d, i) => {
              const cs = getCellStyle(d);
              return (
                <div key={i} style={{
                  width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: cs.fontWeight || 400,
                  background: cs.background, color: cs.color,
                  outline: d.isToday ? '2px solid #3B82F6' : 'none',
                  outlineOffset: -2,
                  margin: '0 auto',
                }} />
              );
            })}
          </div>
        </div>

        {/* Milestones */}
        <div style={CARD}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Milestones</p>
          <div>
            {milestones.map((m, idx) => (
              <div key={m.days} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: idx < milestones.length - 1 ? '1px solid #F2F4F8' : 'none',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, background: MILESTONE_TINTS[m.days], flexShrink: 0,
                }}>
                  {m.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{m.label}</p>
                  <p style={{ fontSize: 12, color: '#9BA3AF' }}>{m.sub}</p>
                </div>
                {m.unlocked ? (
                  <div style={{ background: '#D1FAE5', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ Done
                  </div>
                ) : (
                  <div style={{ background: '#F2F4F8', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
                    {m.days - currentStreak}d left
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}