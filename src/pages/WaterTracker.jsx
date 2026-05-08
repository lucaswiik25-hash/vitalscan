import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Droplets, X, Calendar, Plus } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function HydrationCalendarModal({ onClose, waterLogs, dailyTarget }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLogs = waterLogs.filter(l => l.date === dateStr);
    const total = dayLogs.reduce((s, l) => s + (l.amount_ml || 0), 0);
    const pct = dailyTarget > 0 ? Math.round((total / dailyTarget) * 100) : 0;
    return { date: d, dateStr, total, pct };
  });

  const getColor = (pct, hasData) => {
    if (!hasData) return null;
    if (pct >= 80) return '#6CC5A0';
    if (pct >= 50) return '#F5C842';
    return '#F47C7C';
  };

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const firstDay = days[0].date.getDay();
  const startPad = firstDay === 0 ? 6 : firstDay - 1;
  const cells = [...Array(startPad).fill(null), ...days];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-[32px] px-5 pt-6 pb-10"
        style={{ background: 'rgba(30,30,30,0.92)', backdropFilter: 'blur(40px)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Hydration History</h2>
            <p className="text-sm text-white/50">Last 30 days</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          {[['#6CC5A0', '≥80%'], ['#F5C842', '50–79%'], ['#F47C7C', '<50%'], ['rgba(255,255,255,0.12)', 'None']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span className="text-xs text-white/60">{l}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-center text-xs text-white/40">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const isToday = cell.dateStr === TODAY;
            const color = getColor(cell.pct, cell.total > 0);
            return (
              <div key={i} className="flex flex-col items-center">
                <div className="w-full aspect-square rounded-xl flex flex-col items-center justify-center"
                  style={{ background: color || 'rgba(255,255,255,0.08)', border: isToday ? '2px solid rgba(255,255,255,0.5)' : 'none' }}>
                  <span className="text-xs font-semibold text-white">{format(cell.date, 'd')}</span>
                  {cell.total > 0 && <span className="text-[9px] text-white/80">{cell.pct}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CustomAmountModal({ onClose, onAdd }) {
  const [value, setValue] = useState('');
  const handleAdd = () => {
    const ml = parseInt(value);
    if (ml > 0) { onAdd(ml); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] px-5 pt-6 pb-10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Custom Amount</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Enter ml (e.g. 350)"
          className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          autoFocus
        />
        <button onClick={handleAdd}
          className="w-full h-12 rounded-2xl bg-foreground text-white font-semibold text-sm">
          Add Water
        </button>
      </div>
    </div>
  );
}

export default function WaterTracker() {
  const queryClient = useQueryClient();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};
  const dailyTarget = profile.water_target_ml || 2000;

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['waterLogs', TODAY],
    queryFn: () => base44.entities.WaterLog.filter({ date: TODAY }),
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => base44.entities.WaterLog.list(),
  });

  const totalToday = todayLogs.reduce((s, l) => s + (l.amount_ml || 0), 0);
  const pct = Math.min(100, Math.round((totalToday / dailyTarget) * 100));

  const addWater = async (ml) => {
    await base44.entities.WaterLog.create({ date: TODAY, amount_ml: ml, type: 'water' });
    queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
    queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
  };

  const glassColor = pct >= 80 ? '#6CC5A0' : pct >= 50 ? '#F5C842' : '#60A5FA';

  // Big circular ring dimensions
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  // Cup grid: each cup = 250ml, show enough cups to cover target
  const cupsNeeded = Math.ceil(dailyTarget / 250);
  const cupsFilled = Math.floor(totalToday / 250);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Water Tracker</h1>
        <button onClick={() => setShowCalendar(true)}
          className="w-10 h-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
          <Calendar className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Big circular progress */}
        <div className="bg-white border border-border rounded-[24px] p-6 shadow-sm flex flex-col items-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
              <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={glassColor}
                strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-foreground">{pct}%</span>
              <span className="text-sm text-muted-foreground font-medium">of goal</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-2xl font-extrabold text-foreground">
              {totalToday} <span className="text-base font-medium text-muted-foreground">ml</span>
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">of {dailyTarget} ml daily goal</p>
          </div>
        </div>

        {/* Cup grid — each cup = 250ml */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Tap cups to log • 250ml each</p>
            <button onClick={() => setShowCustom(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold text-foreground">
              <Plus className="w-3.5 h-3.5" /> Custom
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: cupsNeeded }, (_, i) => {
              const filled = i < cupsFilled;
              return (
                <button
                  key={i}
                  onClick={() => addWater(250)}
                  className="aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: filled ? `${glassColor}33` : 'hsl(var(--secondary))',
                    border: filled ? `2px solid ${glassColor}` : '2px solid transparent',
                  }}
                >
                  <Droplets className="w-6 h-6" style={{ color: filled ? glassColor : 'hsl(var(--muted-foreground))' }} />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {cupsFilled} / {cupsNeeded} cups filled · {totalToday} ml logged
          </p>
        </div>

        {/* Today's log */}
        {todayLogs.length > 0 && (
          <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Today's Log</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...todayLogs].reverse().map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" style={{ color: glassColor }} />
                    <span className="text-foreground font-medium">{log.amount_ml} ml</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{format(new Date(log.created_date), 'h:mm a')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCalendar && (
        <HydrationCalendarModal
          onClose={() => setShowCalendar(false)}
          waterLogs={allLogs}
          dailyTarget={dailyTarget}
        />
      )}

      {showCustom && (
        <CustomAmountModal
          onClose={() => setShowCustom(false)}
          onAdd={addWater}
        />
      )}
    </div>
  );
}