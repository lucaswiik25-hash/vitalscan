import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const DAY_LABELS = ['MON', 'TUE', 'WED', 'TURS', 'FRI', 'SAT', 'SUN'];

// Water slot time-of-day definitions
const WATER_SLOTS = [
  { key: 'morning',  label: 'Morning',   icon: '🥛' },
  { key: 'lunch',    label: 'Lunchtime', icon: '💧' },
  { key: 'dinner',   label: 'Dinnertime',icon: '🫗' },
  { key: 'night',    label: 'Night',     icon: '💧' },
];

// Log Water panel (full-screen slide-up)
function LogWaterPanel({ onClose, slotLabel, onAdd }) {
  const [customVal, setCustomVal] = useState('');
  const QUICK = [150, 200, 250, 300, 400, 500, 750, 1000];

  const handleAdd = (ml) => { onAdd(ml); onClose(); };
  const handleCustom = () => { const ml = parseInt(customVal); if (ml > 0) handleAdd(ml); };

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }} onClick={onClose} />
      <motion.div className="absolute left-0 right-0 bottom-0 bg-white flex flex-col overflow-hidden"
        style={{ borderRadius: '24px 24px 0 0' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-start justify-between px-6 pt-3 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Log Water</h2>
            <p className="text-sm text-gray-400 mt-0.5">{slotLabel}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Add</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK.map(ml => (
                <button key={ml} onClick={() => handleAdd(ml)}
                  className="h-14 rounded-[16px] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform bg-gray-100">
                  <span className="text-base font-black text-gray-900">{ml >= 1000 ? `${ml/1000}L` : ml}</span>
                  <span className="text-[10px] text-gray-400">{ml >= 1000 ? '' : 'ml'}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Custom</p>
            <div className="flex gap-2">
              <input type="number" value={customVal} onChange={e => setCustomVal(e.target.value)}
                placeholder="Enter ml..." autoFocus
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <button onClick={handleCustom}
                className="px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold">Add</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 7-Day Calendar Strip
function WeekStrip({ allLogs, dailyTarget }) {
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun
  const mondayOffset = todayDow === 0 ? 6 : todayDow - 1;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, mondayOffset - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const total = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    const pct = dailyTarget > 0 ? Math.min(1, total / dailyTarget) : 0;
    const isToday = dateStr === TODAY;
    return { label: DAY_LABELS[i], pct, isToday, dateStr };
  });

  return (
    <div className="mx-5 mt-10 mb-4 rounded-[20px] px-4 pt-4 pb-5"
      style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Title */}
      <p className="text-center text-gray-400 text-base mb-5"
        style={{ fontFamily: 'var(--font-inria)', fontStyle: 'italic' }}>
        7-Day view
      </p>

      {/* Strip */}
      <div className="relative flex items-end justify-between">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 flex items-center pointer-events-none"
          style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <div className="w-full" style={{ height: 1.5, background: '#1a1a1a', opacity: 0.18 }} />
        </div>

        {days.map((day, i) => {
          const CAPSULE_H = 90;
          const CAPSULE_W = 38;
          const waterH = Math.round(day.pct * (CAPSULE_H - 16));
          return (
            <div key={i} className="flex flex-col items-center gap-1 z-10"
              style={{ transform: day.isToday ? 'translateY(-10px)' : 'translateY(0)', transition: 'transform 0.3s ease' }}>
              {/* Day label */}
              <span className="text-[11px] mb-1"
                style={{
                  fontFamily: 'var(--font-inria)', fontStyle: 'italic',
                  fontWeight: day.isToday ? 600 : 400,
                  color: day.isToday ? '#1A1814' : '#9CA3AF',
                }}>
                {day.label}
              </span>
              {/* Capsule */}
              <div className="relative overflow-hidden"
                style={{
                  width: CAPSULE_W, height: CAPSULE_H,
                  borderRadius: 999,
                  border: '1.5px solid rgba(0,0,0,0.10)',
                  background: '#F9FAFB',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                }}>
                {/* Water fill */}
                {waterH > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                    style={{
                      height: waterH,
                      background: 'linear-gradient(to top, #60A5FA, #93C5FD)',
                      borderRadius: '0 0 999px 999px',
                    }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Progress Ring + Metric Bars module
function HydrationStatsModule({ pct, effective, dailyTarget, todayLogs, profile }) {
  const SIZE = 160, STROKE = 20, R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const dash = (Math.min(pct, 100) / 100) * CIRC;

  // Calculate metrics
  const pureWater = todayLogs.filter(l => l.amount_ml > 0 && l.type === 'water').reduce((s, l) => s + l.amount_ml, 0);
  const caffeineLogs = todayLogs.filter(l => ['coffee', 'tea', 'energy_drink'].includes(l.type));
  const sodaLogs = todayLogs.filter(l => l.type === 'soda');
  const alcoholLogs = todayLogs.filter(l => l.type === 'alcohol');
  const dehydratingTotal = todayLogs.filter(l => l.amount_ml < 0).reduce((s, l) => s + Math.abs(l.amount_ml), 0);

  // Effectiveness: ratio of pure water to goal, penalised by caffeine/exercise
  const exerciseBonus = (profile.last_active_date === TODAY) ? 0.15 : 0;
  const caffeineHits = caffeineLogs.length;
  const effectivenessPct = Math.min(100, Math.max(0,
    pct - caffeineHits * 8 - exerciseBonus * 100 + (pureWater / (dailyTarget || 2000)) * 100
  ) / 2);

  // Quality: how much is pure water vs other drinks
  const totalPositive = todayLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
  const qualityPct = totalPositive > 0 ? Math.min(100, (pureWater / totalPositive) * 100) : 0;

  // Hydration: penalise for soda/alcohol
  const sodaPenalty = sodaLogs.length * 15 + alcoholLogs.length * 20;
  const hydrationPct = Math.min(100, Math.max(0, pct - sodaPenalty));

  const bars = [
    { label: 'Effectiveness', value: effectivenessPct },
    { label: 'Quality', value: qualityPct },
    { label: 'Hydration', value: hydrationPct },
  ];

  return (
    <div className="mx-5 rounded-[28px] p-5 flex items-center gap-5"
      style={{ background: 'linear-gradient(135deg, #2D2A26 0%, #1A1814 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#000" strokeWidth={STROKE} strokeLinecap="round" />
          {pct > 0 && (
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#fff" strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round"
              style={{
                transition: 'stroke-dasharray 0.7s ease',
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))',
              }} />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white" style={{ fontSize: 32, fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-4">
        {bars.map(({ label, value }) => (
          <div key={label}>
            <p className="mb-1.5" style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{label}</p>
            <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${value}%`,
                  background: 'linear-gradient(to right, #93C5FD, #60A5FA)',
                }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Water Slots (like MealSlotsModule)
function WaterSlotsModule({ dailyTarget, todayLogs, onLogSlot, onRemoveLog }) {
  const slotTarget = Math.round(dailyTarget / 4);
  const [openSlot, setOpenSlot] = useState(null);

  // Group logs by time-of-day slot
  const slotLogs = WATER_SLOTS.reduce((acc, slot) => {
    acc[slot.key] = todayLogs.filter(l => l.amount_ml > 0 && l.slot === slot.key);
    return acc;
  }, {});

  // Running balance: redistribute remaining after each slot
  let remaining = dailyTarget;
  const slotData = WATER_SLOTS.map((slot) => {
    const logged = slotLogs[slot.key].reduce((s, l) => s + l.amount_ml, 0);
    const target = Math.round(remaining / (WATER_SLOTS.length - WATER_SLOTS.indexOf(slot) + 1));
    const slotTarget = Math.round(remaining / (4 - WATER_SLOTS.indexOf(slot)));
    remaining = Math.max(0, remaining - logged);
    return { ...slot, logged, slotTarget };
  });

  // Recompute with proper redistribution
  let rem = dailyTarget;
  const slotsWithTargets = WATER_SLOTS.map((slot, idx) => {
    const logged = slotLogs[slot.key].reduce((s, l) => s + l.amount_ml, 0);
    const slotsLeft = 4 - idx;
    const t = Math.round(rem / slotsLeft);
    rem = Math.max(0, rem - logged);
    return { ...slot, logged, target: t };
  });

  return (
    <div className="mx-5 mb-8">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Log</p>
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        {slotsWithTargets.map((slot, i) => (
          <div key={slot.key}>
            {i > 0 && <div className="mx-4 h-px bg-gray-100" />}
            <div className="flex items-center gap-3 px-4 py-3.5">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-lg">
                {i % 2 === 0 ? '🥛' : '🫗'}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-gray-900">{slot.label}</p>
                  <span className="text-sm text-gray-400">→</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {slot.logged > 0 ? `${slot.logged}` : '0'} / {slot.target} ml
                </p>
              </div>
              {/* Plus button */}
              <button onClick={() => setOpenSlot(slot)}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#1a1a1a' }}>
                <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Log panel */}
      <AnimatePresence>
        {openSlot && (
          <LogWaterPanel
            slotLabel={openSlot.label}
            onClose={() => setOpenSlot(null)}
            onAdd={(ml) => { onLogSlot(ml, openSlot.key); setOpenSlot(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WaterTracker() {
  const queryClient = useQueryClient();
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
  const pct = Math.min(100, Math.round((effective / dailyTarget) * 100));

  const logSlot = async (ml, slot) => {
    await base44.entities.WaterLog.create({ date: TODAY, amount_ml: ml, type: 'water', slot });
    queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
    queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
  };

  const removeLog = async (id) => {
    await base44.entities.WaterLog.delete(id);
    queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
    queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
  };

  return (
    <div className="min-h-screen pb-28">
      {/* 7-Day calendar strip */}
      <WeekStrip allLogs={allLogs} dailyTarget={dailyTarget} />

      {/* Progress ring + bars */}
      <div className="mb-5">
        <HydrationStatsModule
          pct={pct}
          effective={effective}
          dailyTarget={dailyTarget}
          todayLogs={todayLogs}
          profile={profile}
        />
      </div>

      {/* Water slots */}
      <WaterSlotsModule
        dailyTarget={dailyTarget}
        todayLogs={todayLogs}
        onLogSlot={logSlot}
        onRemoveLog={removeLog}
      />
    </div>
  );
}