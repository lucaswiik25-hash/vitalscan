import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Scatter, ScatterChart, CartesianGrid } from 'recharts';
import { Moon, Sparkles, Loader2, Info, X, ArrowLeft } from 'lucide-react';

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
];

function getSleepData() {
  try { return JSON.parse(localStorage.getItem('scanly_sleep') || '{}'); } catch { return {}; }
}
function saveSleepData(data) {
  localStorage.setItem('scanly_sleep', JSON.stringify(data));
}

export default function SleepTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hoursInput, setHoursInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const { profile } = useUserProfile();

  const sleepData = getSleepData();
  const todaySleep = sleepData[TODAY];

  const saveSleep = async (h) => {
    const updated = { ...sleepData, [TODAY]: h };
    saveSleepData(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setHoursInput(String(h));
    // Also sync to UserProfile so home page carousel & DailyModules reflect it
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, {
        last_sleep_hours: h,
        last_sleep_date: TODAY,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
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

  const getAnalysis = async () => {
    setLoadingAdvice(true);
    const recentSleep = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return { date: format(d, 'EEE'), hours: sleepData[dateStr] };
    });

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sleep health expert. Analyze this user's recent sleep data and give personalized advice.

Sleep log (last 7 days): ${JSON.stringify(recentSleep)}
Average sleep: ${avgSleep}h

Provide:
1. A short assessment of their sleep pattern
2. 3 specific, personalized recommendations based on their data
3. A score from 0-100 for their sleep quality this week
4. One key insight about what their sleep pattern tells you`,
      response_json_schema: {
        type: 'object',
        properties: {
          assessment: { type: 'string' },
          score: { type: 'number' },
          recommendations: { type: 'array', items: { type: 'string' } },
          key_insight: { type: 'string' },
        },
      },
    });
    setAiAdvice(res);
    setLoadingAdvice(false);
  };

  const scoreColor = (s) => s >= 75 ? '#6CC5A0' : s >= 50 ? '#F5C842' : '#F47C7C';
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

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sleep Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track and improve your sleep</p>
        </div>
        <button onClick={() => setShowTips(true)}
          className="w-10 h-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center">
          <Info className="w-5 h-5 text-foreground" />
        </button>
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
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.8)', fontWeight: 500 }}
                  interval={0}
                  tickFormatter={(v) => {
                    const parts = v.split(' ');
                    return parts[1] || v;
                  }}
                />
                <YAxis
                  domain={[0, 13]}
                  ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]}
                  tickFormatter={(v) => `${v}h`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.75)', fontWeight: 500 }}
                  width={28}
                />
                <CartesianGrid
                  vertical={false}
                  horizontal={true}
                  strokeDasharray="0"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1}
                />
                {/* Vertical grid lines through every dot position */}
                <CartesianGrid
                  vertical={true}
                  horizontal={false}
                  strokeDasharray="0"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 14, background: 'white', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 12, padding: '8px 14px' }}
                  labelStyle={{ color: '#888', fontSize: 10, marginBottom: 2 }}
                  formatter={(v) => v ? [`${v}h`, 'Sleep'] : ['—', 'No data']}
                  cursor={{ stroke: 'rgba(255,255,255,0.5)', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="white"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.hours == null) return <g key={`empty-${payload.day}`} />;
                    return (
                      <circle
                        key={`dot-${payload.day}`}
                        cx={cx} cy={cy} r={5}
                        fill="white" stroke="rgba(255,255,255,0.4)" strokeWidth={3}
                      />
                    );
                  }}
                  activeDot={{ fill: 'white', stroke: 'rgba(255,255,255,0.5)', strokeWidth: 4, r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="flex gap-3">
          {[
            { val: todaySleep || '—', label: 'hrs last night', color: '#3b82f6', badge: todaySleep },
            { val: avgSleep || '—', label: 'avg hrs / night', color: null },
            { val: '7–9', label: 'recommended', color: null },
          ].map(({ val, label, color, badge }, i) => (
            <motion.div key={label} {...fadeUp(0.5 + i * 0.08)} className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
              <p className="text-3xl font-extrabold" style={{ color: color || 'hsl(var(--foreground))' }}>{val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{ background: qualityColor(badge) + '22', color: qualityColor(badge) }}>
                  {qualityLabel(badge)}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Log Sleep title */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pt-1">Log Sleep</p>

        {/* Log last night — UNDER chart */}
        <motion.div {...fadeUp(0.6)} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-bold text-foreground">Last Night's Sleep</p>
          </div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10].map((h, i) => (
              <motion.button key={h} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.04, duration: 0.3, ease: 'easeOut' }} onClick={() => saveSleep(h)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background: todaySleep === h ? '#3b82f6' : 'hsl(var(--secondary))',
                  color: todaySleep === h ? 'white' : 'hsl(var(--foreground))',
                }}>
                {h}h
              </motion.button>
            ))}
          </div>
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

        {/* Analysis title */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pt-1">Analysis</p>

        {/* AI Analysis */}
        <motion.div {...fadeUp(0.72)} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-foreground" />
            <p className="text-sm font-bold text-foreground">AI Sleep Analysis</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Get personalized insights based on your sleep patterns.</p>
          <button onClick={getAnalysis} disabled={loadingAdvice}
            className="w-full h-12 rounded-2xl bg-foreground text-white text-sm font-semibold flex items-center justify-center gap-2">
            {loadingAdvice ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</> : <><Sparkles className="w-4 h-4" /> Analyse My Sleep</>}
          </button>
          {aiAdvice && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Sleep Score</p>
                <p className="text-2xl font-extrabold" style={{ color: scoreColor(aiAdvice.score) }}>{aiAdvice.score}/100</p>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${aiAdvice.score}%`, background: scoreColor(aiAdvice.score) }} />
              </div>
              <p className="text-sm text-muted-foreground">{aiAdvice.assessment}</p>
              {aiAdvice.key_insight && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                  <p className="text-xs font-bold text-blue-700 mb-0.5">Key Insight</p>
                  <p className="text-xs text-blue-600">{aiAdvice.key_insight}</p>
                </div>
              )}
              <div className="space-y-2">
                {(aiAdvice.recommendations || []).map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-[10px]">{i + 1}</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sleep Tips — full screen slide-up */}
      {showTips && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} onClick={() => setShowTips(false)} />
          <motion.div className="relative w-full bg-white flex flex-col overflow-hidden"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '24px 24px 0 0' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
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
              {/* Extra tips */}
              {[
                { icon: '🌅', tip: 'Get sunlight exposure within 30–60 minutes of waking. This anchors your circadian rhythm and makes falling asleep easier at night.' },
                { icon: '🏋️', tip: 'Exercise improves sleep quality significantly, but intense workouts too close to bedtime (within 2h) can delay sleep onset for some people.' },
                { icon: '🍷', tip: 'Alcohol may help you fall asleep but disrupts REM sleep in the second half of the night, leaving you less rested.' },
                { icon: '🧠', tip: 'Writing down tomorrow\'s to-do list before bed reduces "cognitive arousal" — the mental chatter that keeps you awake.' },
              ].map((t, i) => (
                <motion.div key={`extra-${i}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.07, duration: 0.35, ease: 'easeOut' }}
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