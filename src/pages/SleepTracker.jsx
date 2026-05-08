import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Moon, Sun, Sparkles, Loader2, Plus } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

// We store sleep in UserProfile as a simple array of sleep logs
// But since we can't store arrays in profile easily, we'll use a simple entity approach
// and store each day's sleep as a WaterLog-like entry using a Meal note — instead
// we'll use localStorage for the chart data + profile for today's value

function getSleepData() {
  try {
    return JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
  } catch { return {}; }
}

function saveSleepData(data) {
  localStorage.setItem('scanly_sleep', JSON.stringify(data));
}

const SLEEP_TIPS = [
  { icon: '🌙', tip: 'Go to bed at the same time every night — consistency regulates your circadian rhythm.' },
  { icon: '📵', tip: 'Put your phone away 30 min before sleep. Blue light suppresses melatonin production.' },
  { icon: '🌡️', tip: 'Keep your bedroom cool (16–19°C). Body temperature drop signals sleep onset.' },
  { icon: '☕', tip: 'Avoid caffeine after 2pm. It has a half-life of ~5–6 hours in your body.' },
  { icon: '🧘', tip: '7–9 hours is optimal for adults. Less than 6h impairs cognition like 24h of no sleep.' },
];

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const [hoursInput, setHoursInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const sleepData = getSleepData();
  const todaySleep = sleepData[TODAY];

  const saveSleep = (h) => {
    const updated = { ...sleepData, [TODAY]: h };
    saveSleepData(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // force re-render
    setHoursInput(String(h));
  };

  const handleLogSleep = () => {
    const h = parseFloat(hoursInput);
    if (h >= 1 && h <= 24) saveSleep(h);
  };

  // Build last 14 days chart data
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), 13 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      day: format(d, 'EEE dd'),
      hours: sleepData[dateStr] || null,
    };
  }).filter(d => d.hours !== null || true);

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
    <div className="min-h-screen bg-background pb-10">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Sleep Tracker</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track and improve your sleep</p>
      </div>

      <div className="px-5 space-y-4">
        {/* Log today */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-bold text-foreground">Last Night's Sleep</p>
            {todaySleep && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: qualityColor(todaySleep) + '22', color: qualityColor(todaySleep) }}>
                {qualityLabel(todaySleep)}
              </span>
            )}
          </div>
          {/* Quick buttons */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10].map(h => (
              <button key={h} onClick={() => saveSleep(h)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                style={{
                  background: todaySleep === h ? '#3b82f6' : 'hsl(var(--secondary))',
                  color: todaySleep === h ? 'white' : 'hsl(var(--foreground))',
                }}>
                {h}h
              </button>
            ))}
          </div>
          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="number"
              min="1" max="24" step="0.5"
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
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
            <p className="text-3xl font-extrabold" style={{ color: '#3b82f6' }}>{todaySleep || '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">hrs last night</p>
          </div>
          <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-foreground">{avgSleep || '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">avg hrs / night</p>
          </div>
          <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-foreground">7–9</p>
            <p className="text-xs text-muted-foreground mt-0.5">hrs recommended</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-4">14-Day Sleep Chart</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
              <YAxis domain={[0, 12]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                formatter={(v) => [`${v}h`, 'Sleep']}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Optimal zone indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-0.5 bg-blue-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Sleep hours · 7–9h optimal zone</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
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
        </div>

        {/* Sleep tips */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-sm font-bold text-foreground mb-3">Sleep Science Tips</p>
          <div className="space-y-3">
            {SLEEP_TIPS.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg shrink-0">{t.icon}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}