import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';
import { Droplets, Plus, X, ChevronRight, Calendar } from 'lucide-react';

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
  // Pad to start on correct weekday (Mon=0)
  const firstDay = days[0].date.getDay(); // 0=Sun
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
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          {[['#6CC5A0', '≥80%'], ['#F5C842', '50–79%'], ['#F47C7C', '<50%'], ['rgba(255,255,255,0.12)', 'None']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span className="text-xs text-white/60">{l}</span>
            </div>
          ))}
        </div>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-center text-xs text-white/40">{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const isToday = cell.dateStr === TODAY;
            const color = getColor(cell.pct, cell.total > 0);
            return (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="w-full aspect-square rounded-xl flex flex-col items-center justify-center"
                  style={{
                    background: color || 'rgba(255,255,255,0.08)',
                    border: isToday ? '2px solid rgba(255,255,255,0.5)' : 'none',
                  }}
                >
                  <span className="text-xs font-semibold text-white">{format(cell.date, 'd')}</span>
                  {cell.total > 0 && (
                    <span className="text-[9px] text-white/80">{cell.pct}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function WaterTracker() {
  const queryClient = useQueryClient();
  const [showCalendar, setShowCalendar] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
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

  const handleCustomAdd = async () => {
    const ml = parseInt(customAmount);
    if (ml > 0) {
      await addWater(ml);
      setCustomAmount('');
      setShowCustom(false);
    }
  };

  const glassColor = pct >= 80 ? '#6CC5A0' : pct >= 50 ? '#F5C842' : '#60A5FA';

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-foreground">Water Tracker</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Daily goal: {dailyTarget} ml</p>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Main progress card */}
        <div className="bg-white border border-border rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-extrabold text-foreground">{totalToday} <span className="text-lg font-medium text-muted-foreground">ml</span></p>
              <p className="text-sm text-muted-foreground mt-0.5">of {dailyTarget} ml goal</p>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke={glassColor} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">{pct}%</span>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: glassColor }} />
          </div>
        </div>

        {/* Quick add buttons */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Quick Add</p>
          <div className="flex gap-2 flex-wrap">
            {[250, 330, 500, 750].map(ml => (
              <button key={ml} onClick={() => addWater(ml)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-secondary text-foreground text-sm font-semibold active:scale-95 transition-transform">
                <Droplets className="w-4 h-4" style={{ color: glassColor }} />
                {ml} ml
              </button>
            ))}
            <button onClick={() => setShowCustom(!showCustom)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-foreground text-white text-sm font-semibold active:scale-95 transition-transform">
              <Plus className="w-4 h-4" />
              Custom
            </button>
          </div>
          {showCustom && (
            <div className="flex gap-2 mt-3">
              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="Enter ml"
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              <button onClick={handleCustomAdd}
                className="px-4 py-2 rounded-xl bg-foreground text-white text-sm font-semibold">
                Add
              </button>
            </div>
          )}
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

        {/* 30-day calendar button */}
        <button onClick={() => setShowCalendar(true)}
          className="w-full bg-white border border-border rounded-[24px] p-5 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform">
          <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">30-Day Hydration History</p>
            <p className="text-xs text-muted-foreground">Tap to view calendar</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {showCalendar && (
        <HydrationCalendarModal
          onClose={() => setShowCalendar(false)}
          waterLogs={allLogs}
          dailyTarget={dailyTarget}
        />
      )}
    </div>
  );
}