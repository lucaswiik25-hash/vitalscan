import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Moon, Sparkles, Loader2, Info, X, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay },
});

const TODAY = format(new Date(), 'yyyy-MM-dd');

const SLEEP_TIPS = [
  { icon: '🌙', tip: 'Go to bed at the same time every night — consistency regulates your circadian rhythm.' },
  { icon: '📵', tip: 'Put your phone away 30 min before sleep. Blue light suppresses melatonin production.' },
  { icon: '🌡️', tip: 'Keep your bedroom cool (16–19°C). Body temperature drop signals sleep onset.' },
  { icon: '☕', tip: 'Avoid caffeine after 2pm. It has a half-life of ~5–6 hours in your body.' },
  { icon: '🧘', tip: '7–9 hours is optimal for adults. Less than 6h impairs cognition like 24h of no sleep.' },
  { icon: '🌅', tip: 'Get sunlight exposure within 30–60 minutes of waking. This anchors your circadian rhythm.' },
  { icon: '🏋️', tip: 'Exercise improves sleep quality, but intense workouts within 2h of bedtime can delay sleep onset.' },
  { icon: '🍷', tip: 'Alcohol may help you fall asleep but disrupts REM sleep, leaving you less rested.' },
  { icon: '🧠', tip: "Writing tomorrow's to-do list before bed reduces the mental chatter that keeps you awake." },
];

const WAKE_FEELINGS = [
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'rested', label: 'Rested', emoji: '🙂' },
  { value: 'great', label: 'Great', emoji: '😄' },
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

// Insight card styling based on type
const insightStyle = (type) => {
  if (type === 'warning') return { bg: '#FFF8ED', icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, iconBg: '#FEF3C7' };
  if (type === 'positive') return { bg: '#EFFFF6', icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, iconBg: '#D1FAE5' };
  return { bg: '#F5F3FF', icon: <Lightbulb className="w-4 h-4 text-violet-500" />, iconBg: '#EDE9FE' };
};

export default function SleepTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hoursInput, setHoursInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [wakeFeelingInput, setWakeFeelingInput] = useState('');

  const { profile } = useUserProfile();

  const sleepData = getSleepData();
  const sleepMeta = getSleepMeta();
  const todaySleep = sleepData[TODAY];
  const todayMeta = sleepMeta[TODAY] || {};

  const saveSleep = async (h) => {
    const updated = { ...sleepData, [TODAY]: h };
    saveSleepData(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setHoursInput(String(h));
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, {
        last_sleep_hours: h,
        last_sleep_date: TODAY,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  };

  const saveWakeFeeling = (feeling) => {
    setWakeFeelingInput(feeling);
    const updatedMeta = { ...sleepMeta, [TODAY]: { ...todayMeta, wake_feeling: feeling } };
    saveSleepMeta(updatedMeta);
  };

  const handleLogSleep = () => {
    const h = parseFloat(hoursInput);
    if (h >= 1 && h <= 24) saveSleep(h);
  };

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return { day: format(d, 'MMM d'), hours: sleepData[dateStr] || null };
  });

  const avgSleep = (() => {
    const vals = Object.values(sleepData).filter(v => v > 0);
    if (vals.length === 0) return 0;
    return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  })();

  const qualityLabel = (h) => {
    if (!h) return '';
    if (h < 5) return 'Very low';
    if (h < 6.5) return 'Low';
    if (h <= 9) return 'Optimal';
    return 'Oversleeping';
  };
  const qualityColor = (h) => {
    if (!h) return '#888';
    if (h < 5) return '#F47C7C';
    if (h < 6.5) return '#F5C842';
    if (h <= 9) return '#6CC5A0';
    return '#F5C842';
  };

  const getAiInsights = async () => {
    setLoadingInsights(true);
    setShowAiPanel(true);

    // Build rich context: last 7 days sleep + wake feelings + meals today
    const recentSleep = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const meta = sleepMeta[dateStr] || {};
      return {
        date: format(d, 'EEE MMM d'),
        hours: sleepData[dateStr] || null,
        wake_feeling: meta.wake_feeling || null,
      };
    });

    // Fetch today's meals for pattern analysis
    let todayMeals = [];
    try {
      todayMeals = await base44.entities.Meal.filter({ date: TODAY, logged: true });
    } catch (_) {}

    const mealContext = todayMeals.length > 0
      ? `Today's meals: ${todayMeals.map(m => `${m.name} (${m.calories}kcal, sodium:${m.sodium || 0}mg, sugar:${m.sugar || 0}g)`).join(', ')}`
      : 'No meals logged today.';

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a personalized sleep coach. Analyze this user's sleep data and give specific, actionable insights in a friendly tone.

Sleep log (last 7 days with wake feelings):
${JSON.stringify(recentSleep, null, 2)}

Average sleep: ${avgSleep}h
${mealContext}

Return exactly 3 insights. Each insight should:
- Have a short, direct title (5-8 words max)
- Have a specific, data-driven description (1-2 sentences referencing their actual numbers)
- Be typed as: "warning" (problem/concern), "positive" (doing well), or "tip" (actionable suggestion)

Consider patterns like: inconsistent sleep times, wake feelings vs hours slept (e.g. tired despite 8h could indicate diet/caffeine issues), weekday vs weekend differences, recent food that could impact sleep.`,
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
    setLoadingInsights(false);
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sleep Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and improve your sleep</p>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Insights button */}
          <button onClick={getAiInsights}
            className="w-10 h-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
            {loadingInsights
              ? <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
              : <Sparkles className="w-5 h-5 text-violet-500" />}
          </button>
          {/* Tips button */}
          <button onClick={() => setShowTips(true)}
            className="w-10 h-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
            <Info className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.div>

      <div className="px-5 space-y-4">
        {/* 14-day chart */}
        <motion.div {...fadeUp(0.2)} className="rounded-[24px] overflow-hidden" style={{ background: '#B8C4DA' }}>
          <div className="px-5 pt-5 pb-2 flex items-start justify-between">
            <div>
              <span className="text-white text-base font-bold">Sleep Trend </span>
              <span className="text-white/70 text-sm font-normal">· 14 days</span>
            </div>
            {todaySleep && (
              <div className="px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span className="text-white text-xs font-semibold">{todaySleep}h last night</span>
              </div>
            )}
          </div>
          <div className="pb-2" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.8)', fontWeight: 500 }}
                  interval={0} tickFormatter={(v) => v.split(' ')[1] || v} />
                <YAxis domain={[0, 13]} ticks={[0, 3, 6, 9, 12]} tickFormatter={(v) => `${v}h`}
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.75)', fontWeight: 500 }} width={28} />
                <CartesianGrid vertical={false} strokeDasharray="0" stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, background: 'white', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12, padding: '8px 14px' }}
                  labelStyle={{ color: '#888', fontSize: 10, marginBottom: 2 }}
                  formatter={(v) => v ? [`${v}h`, 'Sleep'] : ['—', 'No data']}
                  cursor={{ stroke: 'rgba(255,255,255,0.5)', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="hours" stroke="white" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"
                  isAnimationActive animationDuration={800} animationEasing="ease-out"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.hours == null) return <g key={`empty-${payload.day}`} />;
                    return <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={5} fill="white" stroke="rgba(255,255,255,0.4)" strokeWidth={3} />;
                  }}
                  activeDot={{ fill: 'white', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 4, r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Insights inline (if loaded) */}
        <AnimatePresence>
          {aiInsights && aiInsights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white border border-border rounded-[24px] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <p className="text-sm font-bold text-foreground">AI Sleep Insights</p>
                </div>
                <button onClick={() => setAiInsights(null)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {aiInsights.map((insight, i) => {
                  const style = insightStyle(insight.type);
                  return (
                    <div key={i} className="flex items-start gap-3 px-5 py-4">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: style.iconBg }}>
                        {style.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{insight.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Log Sleep title */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pt-1">Log Sleep</p>

        {/* Log last night */}
        <motion.div {...fadeUp(0.6)} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-bold text-foreground">Last Night's Sleep</p>
          </div>

          {/* Hour buttons */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10].map((h, i) => (
              <motion.button key={h}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.04, duration: 0.3, ease: 'easeOut' }}
                onClick={() => saveSleep(h)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background: todaySleep === h ? '#3b82f6' : 'hsl(var(--secondary))',
                  color: todaySleep === h ? 'white' : 'hsl(var(--foreground))',
                }}>
                {h}h
              </motion.button>
            ))}
          </div>

          {/* How did you feel */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">How did you feel when you woke up?</p>
            <div className="flex gap-2">
              {WAKE_FEELINGS.map(({ value, label, emoji }) => {
                const current = wakeFeelingInput || todayMeta.wake_feeling;
                const isSelected = current === value;
                return (
                  <button key={value} onClick={() => saveWakeFeeling(value)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex flex-col items-center gap-0.5"
                    style={{
                      background: isSelected ? '#3b82f6' : 'hsl(var(--secondary))',
                      color: isSelected ? 'white' : 'hsl(var(--foreground))',
                    }}>
                    <span className="text-base">{emoji}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="number" min="1" max="24" step="0.5"
              value={hoursInput}
              onChange={e => setHoursInput(e.target.value)}
              placeholder="Custom hours (e.g. 7.5)"
              className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button onClick={handleLogSleep}
              className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold active:scale-95 transition-transform">
              Log
            </button>
          </div>
          {saved && <p className="text-xs text-green-600 mt-2 font-medium">Saved!</p>}
        </motion.div>
      </div>

      {/* Sleep Tips — full screen slide-up */}
      {showTips && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
            onClick={() => setShowTips(false)} />
          <motion.div className="absolute left-0 right-0 bottom-0 bg-white flex flex-col overflow-hidden"
            style={{ top: 0, borderRadius: '24px 24px 0 0' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-start justify-between px-6 pt-3 pb-4 shrink-0 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-foreground">Sleep Science Tips</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Evidence-based sleep advice</p>
              </div>
              <button onClick={() => setShowTips(false)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {SLEEP_TIPS.map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease: 'easeOut' }}
                  className="flex items-start gap-4 p-4 rounded-[20px]" style={{ background: '#f8f9fa' }}>
                  <span className="text-2xl shrink-0">{t.icon}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{t.tip}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}