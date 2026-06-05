import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { format, subDays } from 'date-fns';

const CARD = {
  background: '#FFFFFF',
  borderRadius: 28,
  padding: 20,
  border: '1px solid rgba(0,0,0,0.09)',
  boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
};

export default function WaterStatsScreen({ allLogs, dailyTarget, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const total = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    return { date: format(d, 'MMM d'), dateStr, ml: total, short: format(d, 'd') };
  });

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

  const todayLogs = allLogs.filter(l => l.date === today);
  const typeBreakdown = ['water', 'coffee', 'tea', 'soda', 'alcohol', 'energy_drink'].map(type => ({
    type,
    ml: todayLogs.filter(l => l.type === type).reduce((s, l) => s + Math.abs(l.amount_ml), 0),
  })).filter(t => t.ml > 0);
  const typeEmoji = { water: '💧', coffee: '☕', tea: '🍵', soda: '🥤', alcohol: '🍷', energy_drink: '⚡' };

  // Area chart calculation
  const maxMl = Math.max(...last14.map(d => d.ml).filter(v => v > 0), dailyTarget * 1.2, 1);
  const chartH = 200;
  const PAD = 4; // horizontal padding %

  const pts = last14.map((d, i) => ({
    x: PAD + (i / (last14.length - 1)) * (100 - PAD * 2),
    y: d.ml > 0 ? chartH - (d.ml / maxMl) * (chartH - 10) - 4 : null,
    ml: d.ml,
    short: d.short,
  }));
  const goalY = chartH - (dailyTarget / maxMl) * (chartH - 10) - 4;

  // Build smooth bezier path, skipping null (zero) points — creates gaps
  const buildSmoothPath = (points) => {
    const segments = [];
    let current = [];
    for (const p of points) {
      if (p.y !== null) { current.push(p); }
      else { if (current.length > 0) { segments.push(current); current = []; } }
    }
    if (current.length > 0) segments.push(current);

    return segments.map(seg => {
      if (seg.length === 1) return `M ${seg[0].x} ${seg[0].y}`;
      let d = `M ${seg[0].x} ${seg[0].y}`;
      for (let i = 1; i < seg.length; i++) {
        const prev = seg[i - 1];
        const curr = seg[i];
        const cpx = (prev.x + curr.x) / 2;
        d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
      }
      return d;
    }).join(' ');
  };

  const buildAreaPath = (points) => {
    const segments = [];
    let current = [];
    for (const p of points) {
      if (p.y !== null) { current.push(p); }
      else { if (current.length > 0) { segments.push(current); current = []; } }
    }
    if (current.length > 0) segments.push(current);

    return segments.map(seg => {
      if (seg.length === 0) return '';
      let d = `M ${seg[0].x} ${chartH}`;
      d += ` L ${seg[0].x} ${seg[0].y}`;
      for (let i = 1; i < seg.length; i++) {
        const prev = seg[i - 1];
        const curr = seg[i];
        const cpx = (prev.x + curr.x) / 2;
        d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
      }
      d += ` L ${seg[seg.length - 1].x} ${chartH} Z`;
      return d;
    }).join(' ');
  };

  const linePath = buildSmoothPath(pts);
  const areaPath = buildAreaPath(pts);

  const statCards = [
    { label: '14-DAY AVG', value: avgMl >= 1000 ? `${(avgMl / 1000).toFixed(1)}L` : `${avgMl}ml`, sub: 'daily average', dot: '#3B82F6' },
    { label: 'BEST DAY', value: bestDay.ml >= 1000 ? `${(bestDay.ml / 1000).toFixed(1)}L` : `${bestDay.ml}ml`, sub: bestDay.date, dot: '#10B981' },
    { label: 'GOAL DAYS', value: `${goalDays}/14`, sub: 'last two weeks', dot: '#F59E0B' },
    { label: 'CURRENT STREAK', value: `${streak}d`, sub: streak === 1 ? 'day in a row' : 'days in a row', dot: '#EF4444' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: '#F2F4F8' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>Statistics</h2>
        <button onClick={onClose}
          className="w-10 h-10 rounded-[14px] flex items-center justify-center"
          style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <X className="w-5 h-5" style={{ color: '#6b7280' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-16" style={{ gap: 16, display: 'flex', flexDirection: 'column' }}>
        {/* Stats grid */}
        <div className="grid grid-cols-2" style={{ gap: 16, alignItems: 'stretch' }}>
          {statCards.map(card => (
            <div key={card.label} className="relative flex flex-col" style={{ ...CARD, minHeight: 110 }}>
              {/* Accent dot */}
              <div className="absolute top-4 right-4 rounded-full" style={{ width: 6, height: 6, background: card.dot }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9BA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {card.label}
              </p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{card.value}</p>
              <p style={{ fontSize: 13, color: '#9BA3AF', marginTop: 4 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <div style={CARD}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Last 14 Days</p>
          <div style={{ position: 'relative' }}>
            <svg
              width="100%"
              height={chartH}
              viewBox={`0 0 100 ${chartH}`}
              preserveAspectRatio="none"
              style={{ display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                </linearGradient>
              </defs>
              {/* Goal dashed line */}
              {goalY > 0 && goalY < chartH && (
                <line x1="0" y1={goalY} x2="94" y2={goalY}
                  stroke="#10B981" strokeDasharray="4 4" strokeWidth="1" />
              )}
              {/* Area fill */}
              {areaPath && <path d={areaPath} fill="url(#areaGrad2)" />}
              {/* Line */}
              {linePath && <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              {/* Dots — only on days with data */}
              {pts.filter(p => p.y !== null).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3B82F6" stroke="white" strokeWidth="2" />
              ))}
            </svg>
            {/* Goal pill — positioned absolutely */}
            {goalY > 0 && goalY < chartH && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: goalY - 11,
                background: '#10B981',
                color: 'white',
                borderRadius: 20,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.4,
              }}>Goal</div>
            )}
          </div>
          {/* X-axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: `${PAD}%`, paddingRight: `${PAD + 4}%` }}>
            {last14.map((d, i) => (
              i % 2 === 0
                ? <span key={i} style={{ fontSize: 11, color: '#9BA3AF' }}>{d.short}</span>
                : <span key={i} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#9BA3AF', marginTop: 10 }}>
            Goal reached on {goalDays} of the last 14 days
          </p>
        </div>

        {/* Today breakdown */}
        {typeBreakdown.length > 0 && (
          <div style={CARD}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Today's Breakdown</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {typeBreakdown.map(t => {
                const pct = Math.min(100, (t.ml / dailyTarget) * 100);
                return (
                  <div key={t.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', textTransform: 'capitalize' }}>
                        {typeEmoji[t.type]} {t.type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: 12, color: '#9BA3AF' }}>{t.ml}ml</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: '#F2F4F8', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: '#3B82F6', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily target */}
        <div style={{
          borderRadius: 28,
          padding: 24,
          background: `radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 70%), #0F172A`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>💧</span>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Daily Target</p>
          </div>
          <p style={{ fontSize: 40, fontWeight: 800, color: 'white', lineHeight: 1 }}>
            {dailyTarget >= 1000 ? `${(dailyTarget / 1000).toFixed(1)}L` : `${dailyTarget}ml`}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            Set in your profile settings
          </p>
        </div>
      </div>
    </motion.div>
  );
}