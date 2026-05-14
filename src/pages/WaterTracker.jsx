import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { X, Calendar, Plus, Target, Zap } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const DEHYDRATING_DRINKS = [
  { emoji: '☕', name: 'Coffee', ml: -150, type: 'coffee' },
  { emoji: '🍺', name: 'Alcohol', ml: -250, type: 'alcohol' },
  { emoji: '⚡', name: 'Energy Drink', ml: -200, type: 'energy_drink' },
  { emoji: '🥤', name: 'Soda', ml: -100, type: 'soda' },
  { emoji: '🍵', name: 'Tea', ml: -50, type: 'tea' },
];

// Drop SVG — bold filled when active
function DropIcon({ filled, color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}
      stroke={filled ? color : '#9ca3af'} strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2z" />
    </svg>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-[28px] px-5 pt-6 pb-8"
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
  // Effective = only positive (water) logs
  const consumed = todayLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
  const deducted = todayLogs.filter(l => l.amount_ml < 0).reduce((s, l) => s + Math.abs(l.amount_ml), 0);
  const effective = Math.max(0, consumed - deducted);
  const remaining = Math.max(0, dailyTarget - effective);
  const pct = Math.min(100, Math.round((effective / dailyTarget) * 100));

  const addWater = async (ml) => {
    await base44.entities.WaterLog.create({ date: TODAY, amount_ml: ml, type: 'water' });
    queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
    queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
  };

  const addDehydrating = async (drink) => {
    await base44.entities.WaterLog.create({ date: TODAY, amount_ml: drink.ml, type: drink.type });
    queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
    queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
  };

  const removeLog = async (id) => {
    await base44.entities.WaterLog.delete(id);
    queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
    queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
  };

  const ringColor = '#3b82f6'; // solid blue always
  const ringSize = 280;
  const ringStroke = 20;
  const ringR = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringR;

  const cupsNeeded = Math.ceil(dailyTarget / 250);
  const cupsFilled = Math.floor(effective / 250);

  const dehydratingLogs = todayLogs.filter(l => l.amount_ml < 0);

  const statCard = (icon, label, value, unit = 'ml') => (
    <div className="flex-1 rounded-[12px] flex flex-col items-center justify-center py-3 px-2 gap-1"
      style={{ background: '#f3f4f6' }}>
      <div className="text-gray-400">{icon}</div>
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-black text-gray-900">{value}<span className="text-[10px] font-medium text-gray-400 ml-0.5">{unit}</span></p>
    </div>
  );

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
        {/* Circular ring */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="#e5e7eb" strokeWidth={ringStroke} strokeLinecap="round" />
              <circle
                cx={ringSize / 2} cy={ringSize / 2} r={ringR}
                fill="none"
                stroke={ringColor}
                strokeWidth={ringStroke}
                strokeDasharray={ringCirc}
                strokeDashoffset={ringCirc * (1 - pct / 100)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-foreground">{pct}%</span>
              <span className="text-sm text-muted-foreground font-medium">of goal</span>
              <p className="text-xl font-extrabold text-foreground mt-1">
                {effective}<span className="text-sm font-medium text-muted-foreground"> ml</span>
              </p>
              <p className="text-xs text-muted-foreground">of {dailyTarget} ml</p>
            </div>
          </div>
        </div>

        {/* Stat cards row */}
        <div className="flex gap-2">
          {statCard(<svg width={16} height={16} viewBox="0 0 24 24" fill="#3b82f6"><path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2z"/></svg>, 'Consumed', consumed)}
          {statCard(<Zap size={16} className="text-yellow-500" />, 'Effective', effective)}
          {statCard(<Target size={16} className="text-gray-400" />, 'Remaining', remaining)}
        </div>

        {/* Cup grid */}
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
                    background: filled ? '#eff6ff' : 'hsl(var(--secondary))',
                    border: filled ? '2px solid #3b82f6' : '2px solid transparent',
                  }}
                >
                  <DropIcon filled={filled} color="#3b82f6" size={28} />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {cupsFilled} / {cupsNeeded} cups · {effective} ml effective
          </p>
        </div>

        {/* Hydration Quality — dehydrating drinks */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-sm font-bold text-foreground">Hydration Quality</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">Log drinks that reduce hydration</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {DEHYDRATING_DRINKS.map(drink => {
              const loggedCount = todayLogs.filter(l => l.type === drink.type && l.amount_ml < 0).length;
              const isLogged = loggedCount > 0;
              return (
                <button
                  key={drink.type}
                  onClick={() => addDehydrating(drink)}
                  className="shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-[12px] transition-all active:scale-95"
                  style={{
                    background: isLogged ? '#fef2f2' : '#f3f4f6',
                    border: isLogged ? '1.5px solid #fca5a5' : '1.5px solid transparent',
                  }}
                >
                  <span className="text-lg">{drink.emoji}</span>
                  <span className="text-[10px] font-semibold text-gray-700">{drink.name}</span>
                  <span className="text-[10px] font-bold text-red-500">{drink.ml}ml</span>
                </button>
              );
            })}
          </div>

          {/* Logged dehydrating drinks */}
          {dehydratingLogs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
              {dehydratingLogs.map(log => {
                const drink = DEHYDRATING_DRINKS.find(d => d.type === log.type);
                return (
                  <div key={log.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                    <span>{drink?.emoji || '🥤'}</span>
                    <span className="text-red-700">{drink?.name || log.type} ({log.amount_ml}ml)</span>
                    <button onClick={() => removeLog(log.id)} className="text-red-400 hover:text-red-600 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's water log */}
        {todayLogs.filter(l => l.amount_ml > 0).length > 0 && (
          <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Today's Log</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...todayLogs].filter(l => l.amount_ml > 0).reverse().map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DropIcon filled color="#3b82f6" size={16} />
                    <span className="text-foreground font-medium">{log.amount_ml} ml</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{format(new Date(log.created_date), 'h:mm a')}</span>
                    <button onClick={() => removeLog(log.id)} className="text-gray-300 hover:text-gray-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCalendar && (
        <HydrationCalendarModal onClose={() => setShowCalendar(false)} waterLogs={allLogs} dailyTarget={dailyTarget} />
      )}
      {showCustom && (
        <CustomAmountModal onClose={() => setShowCustom(false)} onAdd={addWater} />
      )}
    </div>
  );
}