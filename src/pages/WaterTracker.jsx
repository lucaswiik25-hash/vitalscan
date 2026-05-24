import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { X, Calendar, Plus, Target, Zap, Droplets, Info, ChevronRight, ArrowLeft, Trash2 } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const DEHYDRATING_DRINKS = [
  { name: 'Coffee', ml: -150, type: 'coffee' },
  { name: 'Alcohol', ml: -250, type: 'alcohol' },
  { name: 'Energy Drink', ml: -200, type: 'energy_drink' },
  { name: 'Soda', ml: -100, type: 'soda' },
  { name: 'Tea', ml: -50, type: 'tea' },
];

function DropIcon({ filled, color, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}
      stroke={filled ? color : '#9ca3af'} strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2z" />
    </svg>
  );
}

// Full-screen slide-up panel with swipe-down-to-close
function FullScreenPanel({ onClose, title, subtitle, children }) {
  const y = useMotionValue(0);
  const handleDragEnd = (_, info) => {
    if (info.offset.y > 80 || info.velocity.y > 400) {
      onClose();
    } else {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };
  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute left-0 right-0 bottom-0 bg-white flex flex-col overflow-hidden"
        style={{ top: 0, borderRadius: '24px 24px 0 0', y }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-3 pb-4 shrink-0 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Calendar panel — full screen
function HydrationCalendarPanel({ onClose, waterLogs, dailyTarget }) {
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

  const totalConsumed = days.reduce((s, d) => s + Math.max(0, d.total), 0);
  const daysHit = days.filter(d => d.pct >= 80).length;
  const avgDaily = days.filter(d => d.total > 0).length > 0
    ? Math.round(days.filter(d => d.total > 0).reduce((s, d) => s + d.total, 0) / days.filter(d => d.total > 0).length)
    : 0;

  return (
    <FullScreenPanel onClose={onClose} title="30-Day Hydration" subtitle="Your hydration history">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Days Hit Goal', value: daysHit, unit: 'days', color: '#6CC5A0' },
          { label: 'Avg Daily', value: `${avgDaily}`, unit: 'ml', color: '#60c4f5' },
          { label: 'Total Logged', value: (totalConsumed / 1000).toFixed(1), unit: 'L', color: '#8b5cf6' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-[20px] p-4 text-center" style={{ background: '#f8f9fa' }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{unit}</p>
            <p className="text-[10px] text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 px-1">
        {[{ color: '#6CC5A0', label: '≥80% goal' }, { color: '#F5C842', label: '50–79%' }, { color: '#F47C7C', label: '<50%' }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-[24px] overflow-hidden p-4" style={{ background: '#1a1a1a' }}>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-center text-[11px] text-white/40 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const isToday = cell.dateStr === TODAY;
            const color = getColor(cell.pct, cell.total > 0);
            const row = Math.floor(i / 7);
            return (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.02 + row * 0.04, duration: 0.3, ease: 'easeOut' }}
                className="aspect-square rounded-xl flex flex-col items-center justify-center"
                style={{
                  background: color || 'rgba(255,255,255,0.08)',
                  border: isToday ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
                }}>
                <span className="text-[11px] font-bold text-white">{format(cell.date, 'd')}</span>
                {cell.total > 0 && <span className="text-[9px] text-white/70">{cell.pct}%</span>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Day-by-day recent list */}
      <div className="mt-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Days</p>
        <div className="space-y-2">
          {[...days].reverse().slice(0, 10).map((d, i) => {
            const color = getColor(d.pct, d.total > 0);
            return (
              <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-[14px]" style={{ background: '#f8f9fa' }}>
                <span className="text-sm font-semibold text-gray-800">{format(d.date, 'EEE, MMM d')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">{d.total > 0 ? `${d.total}ml` : '—'}</span>
                  {color && <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FullScreenPanel>
  );
}

// Log Water panel — full screen
function LogWaterPanel({ onClose, cupsNeeded, cupsFilled, effective, onAddWater }) {
  const [customVal, setCustomVal] = useState('');

  const handleCustom = () => {
    const ml = parseInt(customVal);
    if (ml > 0) { onAddWater(ml); setCustomVal(''); }
  };

  const QUICK_AMOUNTS = [100, 150, 200, 250, 300, 330, 400, 500, 750];

  return (
    <FullScreenPanel onClose={onClose} title="Log Water" subtitle="Track your hydration intake">
      {/* Cup grid */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tap cups (250ml each)</p>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: cupsNeeded }, (_, i) => {
            const filled = i < cupsFilled;
            return (
              <motion.button key={i}
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.25, ease: 'easeOut' }}
                onClick={() => onAddWater(250)}
                className="aspect-square rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
                style={{ background: filled ? '#eff6ff' : '#f3f4f6', border: filled ? '2px solid #3b82f6' : '2px solid transparent' }}>
                <DropIcon filled={filled} color="#3b82f6" size={30} />
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">{cupsFilled} / {cupsNeeded} cups · {effective}ml effective</p>
      </div>

      {/* Quick amounts */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Add</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_AMOUNTS.map(ml => (
            <motion.button key={ml}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAddWater(ml)}
              className="h-14 rounded-[16px] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
              style={{ background: '#f3f4f6' }}>
              <span className="text-base font-black text-gray-900">{ml}</span>
              <span className="text-[10px] text-gray-400 font-medium">ml</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Custom Amount</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={customVal}
            onChange={e => setCustomVal(e.target.value)}
            placeholder="Enter ml (e.g. 350)"
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button onClick={handleCustom}
            className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold">
            Add
          </button>
        </div>
      </div>

      {/* Hydration tip */}
      <div className="rounded-[20px] p-4 mt-2" style={{ background: '#eff6ff' }}>
        <p className="text-xs font-bold text-blue-700 mb-1">💧 Hydration Tip</p>
        <p className="text-xs text-blue-600 leading-relaxed">Drinking water before meals can reduce hunger and help with weight management. Aim for 500ml in the morning right after waking up.</p>
      </div>
    </FullScreenPanel>
  );
}

// Swipeable water log row
function SwipeableLogRow({ log, onDelete }) {
  const x = useMotionValue(0);
  const [deleted, setDeleted] = useState(false);
  const cups = (log.amount_ml / 250).toFixed(1).replace(/\.0$/, '');

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -60) {
      setDeleted(true);
      setTimeout(() => onDelete(log.id), 280);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  if (deleted) return null;

  return (
    <motion.div
      className="relative overflow-hidden rounded-[14px]"
      animate={deleted ? { opacity: 0, height: 0 } : { opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Red delete background */}
      <div className="absolute inset-0 flex items-center justify-end pr-4 rounded-[14px]" style={{ background: '#fee2e2' }}>
        <Trash2 className="w-4 h-4 text-red-500" />
      </div>
      {/* Draggable row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative flex items-center justify-between px-4 py-3 rounded-[14px] bg-white cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-3">
          <DropIcon filled color="#3b82f6" size={20} />
          <div>
            <p className="text-sm font-bold text-gray-900">{cups} {parseFloat(cups) === 1 ? 'cup' : 'cups'}</p>
            <p className="text-xs text-gray-400">{log.amount_ml} ml</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{format(new Date(log.created_date), 'h:mm a')}</span>
      </motion.div>
    </motion.div>
  );
}

export default function WaterTracker() {
  const queryClient = useQueryClient();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLogPanel, setShowLogPanel] = useState(false);

  const { profile } = useUserProfile();
  const dailyTarget = profile.water_target_ml || 2000;

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['waterLogs', TODAY],
    queryFn: () => base44.entities.WaterLog.filter({ date: TODAY }),
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => base44.entities.WaterLog.list(),
  });

  const consumed = todayLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
  const deducted = todayLogs.filter(l => l.amount_ml < 0).reduce((s, l) => s + Math.abs(l.amount_ml), 0);
  const effective = Math.max(0, consumed - deducted);
  const remaining = Math.max(0, dailyTarget - effective);
  const pct = Math.min(100, Math.round((effective / dailyTarget) * 100));

  const ringSize = 320;
  const ringStroke = 28;
  const ringR = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringR;

  const cupsNeeded = Math.ceil(dailyTarget / 250);
  const cupsFilled = Math.floor(effective / 250);
  const dehydratingLogs = todayLogs.filter(l => l.amount_ml < 0);

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

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
        className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Hydration</h1>
        <button onClick={() => setShowCalendar(true)}
          className="w-10 h-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
          <Calendar className="w-5 h-5 text-foreground" />
        </button>
      </motion.div>

      <div className="px-5 mt-4 space-y-4">
        {/* Ring */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="flex flex-col items-center pt-4 pb-2">
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
              <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={ringStroke} strokeLinecap="round" />
              <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="#60c4f5" strokeWidth={ringStroke}
                strokeDasharray={ringCirc} strokeDashoffset={ringCirc * (1 - pct / 100)} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 2px 8px rgba(96,196,245,0.35))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-foreground">{pct}%</span>
              <span className="text-sm text-muted-foreground font-medium">of goal</span>
              <p className="text-xl font-extrabold text-foreground mt-1">{effective}<span className="text-sm font-medium text-muted-foreground"> ml</span></p>
              <p className="text-xs text-muted-foreground">of {dailyTarget} ml</p>
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="flex gap-2">
          {[
            { icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="#3b82f6"><path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0C19 9.5 12 2 12 2z"/></svg>, label: 'Consumed', value: consumed },
            { icon: <Zap size={16} className="text-yellow-500" />, label: 'Effective', value: effective },
            { icon: <Target size={16} className="text-gray-400" />, label: 'Remaining', value: remaining },
          ].map(({ icon, label, value }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.6 + i * 0.08 }}
              className="flex-1 rounded-[12px] flex flex-col items-center justify-center py-3 px-2 gap-1"
              style={{ background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.78)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div>{icon}</div>
              <p className="text-[10px] text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-black text-gray-900">{value}<span className="text-[10px] font-medium text-gray-400 ml-0.5">ml</span></p>
            </motion.div>
          ))}
        </div>

        {/* Log Water button */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pt-1">Log Water</p>
        <motion.button initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.7 }}
          onClick={() => setShowLogPanel(true)}
          className="w-full rounded-[24px] p-5 text-left flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.78)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div>
            <p className="text-sm font-semibold text-foreground">Log your water intake</p>
            <p className="text-xs text-muted-foreground mt-0.5">{cupsFilled} / {cupsNeeded} cups · {effective} ml effective</p>
          </div>
          <div className="flex items-center gap-2">
            <DropIcon filled color="#60c4f5" size={20} />
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </motion.button>

        {/* Quality */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pt-1">Hydration Quality</p>
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-xs text-muted-foreground mb-3">Log drinks that reduce hydration</p>
          <div className="space-y-2">
            {DEHYDRATING_DRINKS.map(drink => {
              const isLogged = todayLogs.some(l => l.type === drink.type && l.amount_ml < 0);
              return (
                <button key={drink.type} onClick={() => addDehydrating(drink)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-[14px] transition-all active:scale-[0.98]"
                  style={{ background: isLogged ? '#fef2f2' : '#f3f4f6', border: isLogged ? '1.5px solid #fca5a5' : '1.5px solid transparent' }}>
                  <span className="text-sm font-semibold text-gray-700">{drink.name}</span>
                  <span className="text-sm font-bold text-red-500">{drink.ml}ml</span>
                </button>
              );
            })}
          </div>
          {dehydratingLogs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
              {dehydratingLogs.map(log => {
                const drink = DEHYDRATING_DRINKS.find(d => d.type === log.type);
                return (
                  <div key={log.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
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

        {/* Today's log with swipe-to-delete */}
        {todayLogs.filter(l => l.amount_ml > 0).length > 0 && (
          <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Today's Log</p>
              <p className="text-[10px] text-gray-400">← swipe to delete</p>
            </div>
            <div className="space-y-2">
              {[...todayLogs].filter(l => l.amount_ml > 0).reverse().map(log => (
                <SwipeableLogRow key={log.id} log={log} onDelete={removeLog} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full-screen panels */}
      <AnimatePresence>
        {showCalendar && (
          <HydrationCalendarPanel onClose={() => setShowCalendar(false)} waterLogs={allLogs} dailyTarget={dailyTarget} />
        )}
        {showLogPanel && (
          <LogWaterPanel
            onClose={() => setShowLogPanel(false)}
            cupsNeeded={cupsNeeded}
            cupsFilled={cupsFilled}
            effective={effective}
            onAddWater={(ml) => { addWater(ml); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}