import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format, subDays, differenceInMinutes, parse } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Moon, Sun, Clock, Star, Zap, Plus, X, Sparkles, Loader2, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const PRIMARY = '#4A7DFF';
const PRIMARY_LIGHT = '#E8F0FE';
const BG = '#F0F4F8';
const TEXT_PRIMARY = '#1A1A2E';
const TEXT_SECONDARY = '#6B7280';

const WAKE_FEELINGS = [
  { value: 'refreshed', label: 'Refreshed', emoji: '😊' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'groggy', label: 'Groggy', emoji: '😑' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
];

function getSleepData() {
  try { return JSON.parse(localStorage.getItem('scanly_sleep') || '{}'); } catch { return {}; }
}
function saveSleepData(data) {
  localStorage.setItem('scanly_sleep', JSON.stringify(data));
}
function getSleepMeta() {
  try { return JSON.parse(localStorage.getItem('scanly_sleep_meta') || '{}'); } catch { return {}; }
}
function saveSleepMeta(data) {
  localStorage.setItem('scanly_sleep_meta', JSON.stringify(data));
}

function calcDuration(bedTime, wakeTime) {
  if (!bedTime || !wakeTime) return null;
  try {
    const bed = parse(bedTime, 'HH:mm', new Date());
    let wake = parse(wakeTime, 'HH:mm', new Date());
    let mins = differenceInMinutes(wake, bed);
    if (mins < 0) mins += 24 * 60; // crossed midnight
    return Math.round((mins / 60) * 100) / 100;
  } catch { return null; }
}

const insightStyle = (type) => {
  if (type === 'warning') return { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, iconBg: '#FEF3C7' };
  if (type === 'positive') return { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, iconBg: '#D1FAE5' };
  return { icon: <Lightbulb className="w-4 h-4" style={{ color: PRIMARY }} />, iconBg: PRIMARY_LIGHT };
};

// Log Sleep Panel
function LogSleepPanel({ onClose, onSave }) {
  const [bedTime, setBedTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(7);
  const [feelings, setFeelings] = useState([]);

  const duration = calcDuration(bedTime, wakeTime);
  const TARGET = 8;
  const debtMin = duration ? Math.round(Math.max(0, TARGET - duration) * 60) : 0;

  const toggleFeeling = (val) => setFeelings(f => f.includes(val) ? f.filter(x => x !== val) : [...f, val]);

  const handleSave = () => {
    if (!duration) return;
    onSave({ bedTime, wakeTime, duration, quality, feelings });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }} onClick={onClose} />
      <motion.div className="absolute left-0 right-0 bottom-0 flex flex-col overflow-hidden bg-white"
        style={{ borderRadius: '28px 28px 0 0', maxHeight: '90vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-6 pt-2 pb-4 shrink-0">
          <h2 className="text-xl font-bold" style={{ color: TEXT_PRIMARY }}>Log Sleep</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-5">
          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] p-4 bg-white border border-gray-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4" style={{ color: PRIMARY }} />
                <span className="text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Bedtime</span>
              </div>
              <input type="time" value={bedTime} onChange={e => setBedTime(e.target.value)}
                className="w-full text-lg font-bold border-none outline-none" style={{ color: TEXT_PRIMARY }} />
            </div>
            <div className="rounded-[16px] p-4 bg-white border border-gray-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold" style={{ color: TEXT_SECONDARY }}>Wake time</span>
              </div>
              <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                className="w-full text-lg font-bold border-none outline-none" style={{ color: TEXT_PRIMARY }} />
            </div>
          </div>

          {/* Duration preview */}
          {duration && (
            <div className="rounded-[16px] p-4 text-center" style={{ background: PRIMARY_LIGHT }}>
              <p className="text-xs font-semibold mb-1" style={{ color: PRIMARY }}>Calculated Duration</p>
              <p className="text-3xl font-bold" style={{ color: TEXT_PRIMARY }}>{duration}h</p>
            </div>
          )}

          {/* Quality slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Sleep Quality</p>
              <span className="text-sm font-bold" style={{ color: PRIMARY }}>{quality}/10</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="w-full" style={{ accentColor: PRIMARY }} />
            <div className="flex justify-between text-xs mt-1" style={{ color: TEXT_SECONDARY }}>
              <span>Poor</span><span>Excellent</span>
            </div>
          </div>

          {/* Feelings */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>How did you feel?</p>
            <div className="flex flex-wrap gap-2">
              {WAKE_FEELINGS.map(({ value, label, emoji }) => {
                const sel = feelings.includes(value);
                return (
                  <button key={value} onClick={() => toggleFeeling(value)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
                    style={{
                      background: sel ? PRIMARY : BG,
                      color: sel ? 'white' : TEXT_SECONDARY,
                    }}>
                    <span>{emoji}</span>{label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={!duration}
            className="w-full h-14 rounded-[16px] text-white text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition-transform"
            style={{ background: TEXT_PRIMARY }}>
            Save Sleep Log
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const [showLog, setShowLog] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const sleepData = getSleepData();
  const sleepMeta = getSleepMeta();
  const todaySleep = sleepData[TODAY]; // hours
  const todayMeta = sleepMeta[TODAY] || {};

  const TARGET_HOURS = 8;

  // Stats
  const vals = Object.values(sleepData).filter(v => v > 0);
  const avgSleep = vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  const lastQuality = todayMeta.quality || null;
  const sleepDebtMin = todaySleep ? Math.round(Math.max(0, TARGET_HOURS - todaySleep) * 60) : null;
  const timeInBed = todayMeta.bedTime && todayMeta.wakeTime ? calcDuration(todayMeta.bedTime, todayMeta.wakeTime) : todaySleep;

  // Streak
  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (sleepData[d]) s++;
      else break;
    }
    return s;
  }, [sleepData]);

  // Progress ring
  const RING_SIZE = 220, RING_STROKE = 14, RING_R = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRC = 2 * Math.PI * RING_R;
  const ringPct = todaySleep ? Math.min(1, todaySleep / TARGET_HOURS) : 0;
  const ringDash = ringPct * RING_CIRC;

  // 7-day chart
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return { day: format(d, 'EEE'), hours: sleepData[dateStr] || 0 };
  });
  const avgLine = weekData.filter(d => d.hours > 0).reduce((s, d, _, a) => s + d.hours / a.length, 0);

  const handleSave = async ({ bedTime, wakeTime, duration, quality, feelings }) => {
    const updated = { ...sleepData, [TODAY]: duration };
    saveSleepData(updated);
    const meta = { ...sleepMeta, [TODAY]: { bedTime, wakeTime, quality, feelings, wake_feeling: feelings[0] || '' } };
    saveSleepMeta(meta);
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, { last_sleep_hours: duration, last_sleep_date: TODAY });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  };

  const getAiInsights = async () => {
    setLoadingAI(true);
    setAiInsights(null);
    setShowAI(true);
    const recentSleep = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const meta = sleepMeta[dateStr] || {};
      return { date: format(d, 'EEE MMM d'), hours: sleepData[dateStr] || null, quality: meta.quality || null };
    });
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sleep coach. Analyze 7 days of sleep data and return 3 specific insights.
Data: ${JSON.stringify(recentSleep)}
Target: ${TARGET_HOURS}h/night
Each insight: title (short), description (1-2 sentences with numbers), type: "warning"|"positive"|"tip"`,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: { type: 'array', items: { type: 'object', properties: {
            title: { type: 'string' }, description: { type: 'string' }, type: { type: 'string' }
          }}}
        }
      },
    });
    setAiInsights(res?.insights || []);
    setLoadingAI(false);
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-2">
        <div className="flex items-center gap-2">
          <Moon className="w-6 h-6" style={{ color: TEXT_SECONDARY }} />
          <h1 className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>SleepLogger</h1>
        </div>
        <button onClick={getAiInsights}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {loadingAI
            ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: PRIMARY }} />
            : <Sparkles className="w-5 h-5" style={{ color: PRIMARY }} />}
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {[
            { label: 'Duration', value: todaySleep ? `${todaySleep}` : '—', unit: 'h', icon: <Clock className="w-4 h-4" style={{ color: PRIMARY }} />, color: PRIMARY },
            { label: 'Quality', value: lastQuality || '—', unit: '/10', icon: <Star className="w-4 h-4 text-amber-400" />, color: '#F59E0B' },
            { label: 'Streak', value: streak, unit: 'days', icon: <Zap className="w-4 h-4 text-red-400" />, color: '#EF4444' },
          ].map(({ label, value, unit, icon, color }) => (
            <div key={label} className="bg-white rounded-[14px] p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                {icon}
                <span className="text-[11px] font-medium" style={{ color: TEXT_SECONDARY }}>{label}</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>{value}</span>
                <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main ring card */}
        <div className="bg-white rounded-[24px] p-6 flex flex-col items-center"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {/* Ring */}
          <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
            {/* Outer glow bg */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, #F8FAFC 60%, #E8F0FE 100%)' }} />
            <svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
              <circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R} fill="none"
                stroke={PRIMARY_LIGHT} strokeWidth={RING_STROKE} />
              {ringPct > 0 && (
                <circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R} fill="none"
                  stroke={PRIMARY} strokeWidth={RING_STROKE}
                  strokeDasharray={`${ringDash} ${RING_CIRC}`} strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 6px ${PRIMARY}55)` }} />
              )}
            </svg>
            {/* Clock badge */}
            <div className="absolute" style={{ top: 28, left: 28 }}>
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)', border: `2px solid ${PRIMARY_LIGHT}` }}>
                <Clock className="w-4 h-4" style={{ color: TEXT_SECONDARY }} />
              </div>
            </div>
            {/* Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold" style={{ color: TEXT_PRIMARY }}>
                {todaySleep ? `${todaySleep}h` : '—'}
              </span>
              <span className="text-sm mt-1" style={{ color: TEXT_SECONDARY }}>hours</span>
            </div>
          </div>
        </div>

        {/* Duration section */}
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>Duration</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] p-4" style={{ background: '#F0F9FF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: TEXT_SECONDARY }}>Sleep</p>
              <p className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>{todaySleep ? `${todaySleep}h` : '—'}</p>
            </div>
            <div className="rounded-[14px] p-4" style={{ background: '#F0FDF4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: TEXT_SECONDARY }}>Time in bed</p>
              <p className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>{timeInBed ? `${timeInBed}h` : '—'}</p>
            </div>
            <div className="rounded-[14px] p-4" style={{ background: '#FEF2F2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: TEXT_SECONDARY }}>Sleep debt</p>
              <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>
                {sleepDebtMin != null ? `${sleepDebtMin}min` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* 7-day chart */}
        <div>
          <h2 className="text-lg font-semibold mb-3" style={{ color: TEXT_PRIMARY }}>7 day view</h2>
          <div className="bg-white rounded-[16px] p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekData} barCategoryGap="30%">
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: TEXT_SECONDARY, fontWeight: 500 }} />
                <YAxis domain={[0, 12]} hide />
                {avgLine > 0 && (
                  <ReferenceLine y={avgLine} stroke="#F59E0B" strokeDasharray="4 3" strokeWidth={1.5} />
                )}
                <Bar dataKey="hours" radius={[6, 6, 6, 6]}>
                  {weekData.map((entry, i) => (
                    <Cell key={i}
                      fill={format(new Date(), 'EEE') === entry.day ? PRIMARY : PRIMARY_LIGHT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-px" style={{ background: '#F59E0B', borderTop: '2px dashed #F59E0B' }} />
              <span className="text-xs" style={{ color: TEXT_SECONDARY }}>
                Avg {avgLine > 0 ? avgLine.toFixed(1) : '—'}h
              </span>
            </div>
          </div>
        </div>

        {/* Log Sleep button */}
        <button onClick={() => setShowLog(true)}
          className="w-full h-14 rounded-[16px] flex items-center justify-center gap-2 text-white text-base font-semibold active:scale-[0.99] transition-transform"
          style={{ background: TEXT_PRIMARY, boxShadow: '0 4px 12px rgba(26,26,46,0.25)' }}>
          <Plus className="w-5 h-5" />
          Log Sleep
        </button>
      </div>

      {/* Log Sleep Panel */}
      <AnimatePresence>
        {showLog && (
          <LogSleepPanel onClose={() => setShowLog(false)} onSave={handleSave} />
        )}
      </AnimatePresence>

      {/* AI Insights full-screen */}
      <AnimatePresence>
        {showAI && (
          <motion.div className="fixed inset-0 z-50 flex flex-col overflow-hidden"
            style={{ background: BG }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center justify-between px-5 pt-12 pb-4">
              <h2 className="text-2xl font-bold" style={{ color: TEXT_PRIMARY }}>Sleep Insights</h2>
              <button onClick={() => setShowAI(false)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <X className="w-5 h-5" style={{ color: TEXT_SECONDARY }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-16">
              {loadingAI ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: PRIMARY }} />
                  <p className="font-semibold" style={{ color: TEXT_PRIMARY }}>Analysing your sleep...</p>
                </div>
              ) : aiInsights?.map((insight, i) => {
                const s = insightStyle(insight.type);
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-[20px] p-5"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{ background: s.iconBg }}>
                        {s.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold mb-1" style={{ color: TEXT_PRIMARY }}>{insight.title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: TEXT_SECONDARY }}>{insight.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}