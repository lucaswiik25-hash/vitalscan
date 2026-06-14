import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format, subDays } from 'date-fns';
import { X, Plus, Minus, Sparkles, CalendarDays, Loader2, AlertTriangle, CheckCircle2, Lightbulb, BarChart2, Zap } from 'lucide-react';
import WaterCalendarModal from '../components/water/WaterCalendarModal';
import { MODULE_BORDER } from '@/lib/cardStyles';
import WaterStatsScreen from '../components/water/WaterStatsScreen';
import WaterStreakScreen from '../components/water/WaterStreakScreen';
import { animCard, usePageVisible, pageRevealStyle } from '@/lib/animHelpers';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { listHydrationLogs, createHydrationLog, deleteHydrationLog } from '@/lib/db';
import { invokeLLM } from '@/lib/ai';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const WATER_SLOTS = [
  { key: 'morning',  label: 'Morning',   icon: '🌅' },
  { key: 'lunch',    label: 'Lunchtime', icon: '☀️' },
  { key: 'dinner',   label: 'Dinnertime',icon: '🌆' },
  { key: 'night',    label: 'Night',     icon: '🌙' },
];

// Neumorphic shadow styles
const NM = '8px 8px 16px rgba(174,174,192,0.4), -8px -8px 16px rgba(255,255,255,0.8), inset 1px 1px 1px rgba(255,255,255,0.6)';
const NM_SM = '6px 6px 12px rgba(174,174,192,0.3), -6px -6px 12px rgba(255,255,255,0.7)';
const NM_INSET = 'inset 4px 4px 8px rgba(174,174,192,0.3), inset -4px -4px 8px rgba(255,255,255,0.7)';
const BLK_SM = '4px 4px 8px rgba(0,0,0,0.25), -2px -2px 6px rgba(255,255,255,0.4)';

const BG = '#e8e8ec';
const SURFACE = '#f0f0f4';
const BLACK = '#1a1a1a';
const BLACK_MED = '#374151';
const SURFACE_CARD = { background: SURFACE, boxShadow: NM, border: MODULE_BORDER };

// Custom ml popup at top of screen (replaces full log water page)
function WaterMlPopup({ slotLabel, onClose, onAdd }) {
  const [customVal, setCustomVal] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const submit = () => {
    const ml = parseInt(customVal, 10);
    if (ml > 0) onAdd(ml);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div
        className={`fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}
      >
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-4 shadow-xl glow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Log water</p>
              <p className="text-xs text-gray-400">{slotLabel}</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
              placeholder="ml"
              autoFocus
              className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none border border-black"
            />
            <button
              type="button"
              onClick={submit}
              className="px-5 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ background: BLACK }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// AI Insights panel
const insightStyle = (type) => {
  if (type === 'warning') return { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, iconBg: '#FEF3C7' };
  if (type === 'positive') return { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, iconBg: '#D1FAE5' };
  return { icon: <Lightbulb className="w-4 h-4" style={{ color: BLACK }} />, iconBg: '#e5e7eb' };
};

export default function WaterTracker() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const dailyTarget = profile.water_target_ml || 2000;
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showStreak, setShowStreak] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);
  const [openSlot, setOpenSlot] = useState(null);
  const [dropPulse, setDropPulse] = useState(false);
  const prevGlasses = useRef(0);
  const pageVisible = usePageVisible();

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['waterLogs', TODAY],
    queryFn: () => listHydrationLogs({ date: TODAY }),
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => listHydrationLogs(),
  });

  const consumed = todayLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
  const effective = Math.max(0, consumed);
  const pct = Math.min(100, Math.round((effective / dailyTarget) * 100));

  // Glass count (each glass = 250ml)
  const glassSize = 250;
  const totalGlasses = Math.round(dailyTarget / glassSize);
  const filledGlasses = Math.min(totalGlasses, Math.round(effective / glassSize));
  const { display: displayGlasses, animClass: glassAnimClass } = useAnimatedCounter(filledGlasses);

  useEffect(() => {
    if (filledGlasses > prevGlasses.current) {
      setDropPulse(true);
      const t = setTimeout(() => setDropPulse(false), 300);
      prevGlasses.current = filledGlasses;
      return () => clearTimeout(t);
    }
    prevGlasses.current = filledGlasses;
  }, [filledGlasses]);

  const logMutation = useMutation({
    mutationFn: ({ ml, slot }) => createHydrationLog({ date: TODAY, amount_ml: ml, type: 'water', slot }),
    onMutate: async ({ ml, slot }) => {
      await queryClient.cancelQueries({ queryKey: ['waterLogs', TODAY] });
      const prev = queryClient.getQueryData(['waterLogs', TODAY]);
      const optimistic = { id: `opt-${Date.now()}`, date: TODAY, amount_ml: ml, type: 'water', slot, created_at: new Date().toISOString() };
      queryClient.setQueryData(['waterLogs', TODAY], (old = []) => [...old, optimistic]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['waterLogs', TODAY], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
      queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
    },
  });

  const logSlot = (ml, slot) => logMutation.mutate({ ml, slot });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteHydrationLog(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['waterLogs', TODAY] });
      const prev = queryClient.getQueryData(['waterLogs', TODAY]);
      queryClient.setQueryData(['waterLogs', TODAY], (old = []) => old.filter(l => l.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['waterLogs', TODAY], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['waterLogs', TODAY] });
      queryClient.invalidateQueries({ queryKey: ['allWaterLogs'] });
    },
  });

  // Remove last log entry (undo)
  const removeLastLog = () => {
    if (todayLogs.length === 0) return;
    const sorted = [...todayLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    removeMutation.mutate(sorted[0].id);
  };

  const getAiInsights = async () => {
    setLoadingAI(true);
    setAiInsights(null);
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const total = allLogs.filter(l => l.date === dateStr && l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
      return { date: format(d, 'EEE MMM d'), ml: total };
    });

    const res = await invokeLLM({
      prompt: `You are a hydration coach. Analyze the user's last 14 days of water consumption and give 3 specific, actionable insights.

Data (daily ml consumed):
${JSON.stringify(last14, null, 2)}

Daily target: ${dailyTarget}ml

Return exactly 3 insights. Each must have: title (5-8 words), description (1-2 sentences with actual numbers), type ("warning" | "positive" | "tip").`,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['warning', 'positive', 'tip'] },
              }
            }
          }
        }
      },
    });

    setAiInsights(res?.insights || []);
    setLoadingAI(false);
    setShowAiResults(true);
  };

  // Slot targets
  let rem = dailyTarget;
  const slotsWithTargets = WATER_SLOTS.map((slot, idx) => {
    const logged = todayLogs.filter(l => l.amount_ml > 0 && l.slot === slot.key).reduce((s, l) => s + l.amount_ml, 0);
    const slotsLeft = 4 - idx;
    const t = Math.round(rem / slotsLeft);
    rem = Math.max(0, rem - logged);
    return { ...slot, logged, target: t };
  });

  // Ring
  const RING_SIZE = 120, RING_STROKE = 12, RING_R = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRC = 2 * Math.PI * RING_R;
  const ringOffset = RING_CIRC - (pct / 100) * RING_CIRC;

  return (
    <div className="min-h-screen pb-28" style={pageRevealStyle(pageVisible)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <h1 className="text-xl font-semibold" style={{ color: '#1f2937' }}>Hydro</h1>
        <div className="flex items-center gap-3">
        </div>
      </div>

      <div className="px-5 space-y-4">

        {/* Daily progress banner */}
        <div {...animCard(0, pageVisible, { background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)', boxShadow: BLK_SM })} className="rounded-[28px] px-5 py-5 relative overflow-hidden">
          <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Daily progress</p>
          <p className="text-3xl font-bold text-white">
            {effective.toLocaleString()} <span className="text-xl font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>/ {dailyTarget.toLocaleString()} ml</span>
          </p>
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-10"
            style={{ background: 'white' }} />
        </div>

        {/* Icon row */}
        <div className="flex justify-between">
          {[
            { icon: <CalendarDays className="w-6 h-6 text-white" />, label: 'Calendar', accent: true, action: () => setShowCalendar(true) },
            { icon: <Sparkles className="w-6 h-6" style={{ color: '#374151' }} />, label: 'Analyze', accent: false, action: getAiInsights },
            { icon: <Zap className="w-6 h-6 text-white" />, label: 'Streak', accent: true, action: () => setShowStreak(true) },
            { icon: <BarChart2 className="w-6 h-6" style={{ color: '#374151' }} />, label: 'Stats', accent: false, action: () => setShowStats(true) },
          ].map(({ icon, label, accent, action }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <button
                onClick={action || undefined}
                className="w-14 h-14 rounded-[18px] flex items-center justify-center active:scale-95 transition-transform"
                style={accent
                  ? { background: BLACK, boxShadow: BLK_SM }
                  : { background: SURFACE, boxShadow: NM_SM }}>
                {icon}
              </button>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Main row: tracker card + vertical bar */}
        <div className="flex gap-3">
          {/* Tracker card */}
          <div {...animCard(1, pageVisible, SURFACE_CARD)} className="flex-1 rounded-[28px] p-5">
            <p className="text-base font-semibold mb-0.5" style={{ color: '#374151' }}>Drink water!</p>
            <p className="text-sm mb-5" style={{ color: '#9ca3af' }}>Check off a glass</p>
            <div className="flex items-center gap-5">
              {/* Water drop progress indicator */}
              <div className={`shrink-0 flex flex-col items-center gap-1 ${dropPulse ? 'hydration-drop-pulse' : ''}`}>
                <svg width="52" height="68" viewBox="0 0 52 68" fill="none">
                  <defs>
                    <clipPath id="dropClip">
                      <path d="M26 2 C26 2 4 28 4 42 C4 55.255 13.745 65 26 65 C38.255 65 48 55.255 48 42 C48 28 26 2 26 2Z" />
                    </clipPath>
                    <linearGradient id="dropFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#555" />
                      <stop offset="100%" stopColor="#111" />
                    </linearGradient>
                  </defs>
                  <path d="M26 2 C26 2 4 28 4 42 C4 55.255 13.745 65 26 65 C38.255 65 48 55.255 48 42 C48 28 26 2 26 2Z"
                    fill="rgba(0,0,0,0.06)" stroke={BLACK} strokeWidth="2.5" />
                  <rect x="0" y={65 - (63 * pct / 100)} width="52" height="63"
                    fill="url(#dropFill)" clipPath="url(#dropClip)"
                    style={{ transition: 'y 0.7s ease, height 0.7s ease' }} />
                </svg>
                <span className="text-[10px] font-bold" style={{ color: BLACK }}>{pct}%</span>
              </div>
              {/* Progress ring */}
              <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
                <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R} fill="none"
                    stroke="#d4d4d4" strokeWidth={RING_STROKE} />
                  {pct > 0 && (
                    <circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_R} fill="none"
                      stroke={BLACK} strokeWidth={RING_STROKE}
                      strokeDasharray={RING_CIRC}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      className="hydration-ring-arc" />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-bold ${glassAnimClass}`} style={{ color: '#4b5563' }}>
                    {displayGlasses}/{totalGlasses}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical add/minus bar */}
          <div className="w-[72px] rounded-[28px] relative overflow-hidden flex flex-col items-center"
            style={{ ...SURFACE_CARD, minHeight: 180 }}>
            {/* Top: Minus button */}
            <div className="flex flex-col items-center pt-3 pb-2 z-10">
              <button
                onClick={removeLastLog}
                disabled={todayLogs.length === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center mb-1 active:scale-90 transition-transform disabled:opacity-30"
                style={{ background: '#e5e7eb', boxShadow: NM_SM }}>
                <Minus className="w-4 h-4" style={{ color: BLACK }} strokeWidth={2.5} />
              </button>
              <span className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>Undo</span>
            </div>
            {/* Middle: amount */}
            <div className="flex-1 flex items-center justify-center z-10">
              <span className="text-lg font-bold" style={{ color: effective > 0 ? 'white' : '#4b5563' }}>
                {effective >= 1000 ? `${(effective/1000).toFixed(1)}L` : effective}
              </span>
            </div>
            {/* Fill bar */}
            <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 rounded-b-[28px]"
              style={{
                height: `${Math.max(20, pct)}%`,
                background: `linear-gradient(180deg, #555 0%, #1a1a1a 100%)`
              }} />
            {/* Add button */}
            <button
              onClick={() => {
                const hour = new Date().getHours();
                const autoSlot = hour < 11 ? 'morning' : hour < 14 ? 'lunch' : hour < 19 ? 'dinner' : 'night';
                logSlot(100, autoSlot);
              }}
              className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-3 active:scale-95 transition-transform"
              style={{ background: BLACK, boxShadow: BLK_SM }}>
              <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Meal-time slots */}
        <div {...animCard(2, pageVisible)}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>Log by time</p>
          <div className="rounded-[24px] overflow-hidden" style={SURFACE_CARD}>
            {slotsWithTargets.map((slot, i) => (
              <div key={slot.key}>
                {i > 0 && <div className="mx-4 h-px" style={{ background: 'rgba(174,174,192,0.2)' }} />}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 text-lg"
                    style={{ background: BG, boxShadow: NM_SM }}>
                    {slot.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#374151' }}>{slot.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                      {slot.logged > 0 ? slot.logged : 0} / {slot.target} ml
                    </p>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-16 h-1.5 rounded-full mr-2" style={{ background: '#d4d4d4' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (slot.logged / slot.target) * 100)}%`,
                        background: BLACK
                      }} />
                  </div>
                  <button onClick={() => setOpenSlot(slot)}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                    style={{ background: BLACK, boxShadow: BLK_SM }}>
                    <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Log Water Panel */}
      {openSlot && (
        <WaterMlPopup
          slotLabel={openSlot.label}
          onClose={() => setOpenSlot(null)}
          onAdd={(ml) => {
            logSlot(ml, openSlot.key);
            setOpenSlot(null);
          }}
        />
      )}

      {/* AI loading overlay */}
      {loadingAI && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bottom-sheet-backdrop is-visible"
          style={{ background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)' }}
        >
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-white" />
          <p className="text-white text-lg font-semibold">Analysing 14 days...</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Your hydration coach is reviewing your data</p>
        </div>
      )}

      {/* AI Results full-screen */}
      {showAiResults && aiInsights && (
        <div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bottom-sheet-panel is-visible"
          style={{ background: BG }}
        >
            <div className="flex items-center justify-between px-5 pt-12 pb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>AI Analysis</h2>
              <button onClick={() => setShowAiResults(false)}
                className="w-10 h-10 rounded-[14px] flex items-center justify-center"
                style={{ background: SURFACE, boxShadow: NM_SM }}>
                <X className="w-5 h-5" style={{ color: '#6b7280' }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-16">
              {/* Score card */}
              <div className="rounded-[24px] p-5 flex gap-5 items-center"
                style={SURFACE_CARD}>
                <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
                  <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={50} cy={50} r={42} fill="none" stroke="#d4d4d4" strokeWidth={10} />
                    <circle cx={50} cy={50} r={42} fill="none" stroke={BLACK} strokeWidth={10}
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold" style={{ color: '#1f2937' }}>{pct}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#374151' }}>Hydration Score</p>
                  <p className="text-xs mt-1 mb-2" style={{ color: '#9ca3af' }}>Based on your last 14 days</p>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#d1fae5', color: '#059669' }}>
                    {pct >= 80 ? 'Great' : pct >= 60 ? 'Good' : 'Needs work'}
                  </span>
                </div>
              </div>

              {aiInsights.map((insight, i) => {
                const style = insightStyle(insight.type);
                return (
                  <div key={i} {...animCard(i, pageVisible, { background: SURFACE, boxShadow: NM_SM })} className="rounded-[24px] p-4 glow-card">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0"
                        style={{ background: style.iconBg }}>
                        {style.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>{insight.title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Recommendation banner */}
              <div className="rounded-[24px] p-5"
                style={{ background: 'linear-gradient(135deg, #2d2d2d 0%, #111 100%)', boxShadow: BLK_SM }}>
                <p className="text-sm font-semibold text-white mb-2">AI Recommendation</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Keep a consistent schedule — drinking at the same time each day trains your body to signal thirst more reliably.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Calendar modal */}
      {showCalendar && (
        <WaterCalendarModal
          allLogs={allLogs}
          dailyTarget={dailyTarget}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Stats screen */}
      {showStats && (
        <WaterStatsScreen
          allLogs={allLogs}
          dailyTarget={dailyTarget}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Streak screen */}
      {showStreak && (
        <WaterStreakScreen
          allLogs={allLogs}
          dailyTarget={dailyTarget}
          onClose={() => setShowStreak(false)}
        />
      )}
    </div>
  );
}