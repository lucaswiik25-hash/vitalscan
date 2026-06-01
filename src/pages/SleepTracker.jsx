import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Plus, X, Sparkles, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function formatHours(h) {
  if (!h) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getSleepQuality(h) {
  if (!h) return { label: 'No data', color: '#9ca3af' };
  if (h < 5) return { label: 'Very Poor', color: '#ef4444' };
  if (h < 6) return { label: 'Poor', color: '#f97316' };
  if (h < 7) return { label: 'Fair', color: '#eab308' };
  if (h <= 9) return { label: 'Good', color: '#22c55e' };
  return { label: 'Long', color: '#3b82f6' };
}

function getSleepScore(h) {
  if (!h) return 0;
  if (h < 4) return 20;
  if (h < 6) return Math.round(20 + (h - 4) * 20);
  if (h <= 9) return Math.round(60 + ((h - 6) / 3) * 40);
  return Math.max(40, 100 - Math.round((h - 9) * 15));
}

function ScoreRing({ score, hours }) {
  const SIZE = 180, STROKE = 14, R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const gapAngle = 60;
  const arcAngle = 360 - gapAngle;
  const maxDash = (arcAngle / 360) * CIRC;
  const dash = (score / 100) * maxDash;
  const rotation = 90 + gapAngle / 2;
  const quality = getSleepQuality(hours);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <linearGradient id="sleepRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
          stroke="rgba(99,102,241,0.12)" strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={`${maxDash} ${CIRC}`}
          style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }} />
        {score > 0 && (
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke="url(#sleepRingGrad)" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease' }} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-xs text-gray-400 uppercase tracking-widest">Score</span>
        <span className="font-extrabold text-gray-900" style={{ fontSize: 52, lineHeight: 1 }}>
          {score > 0 ? score : '—'}
        </span>
        <span className="text-sm font-semibold" style={{ color: quality.color }}>{quality.label}</span>
      </div>
    </div>
  );
}

function WeekChart({ weekData }) {
  const max = Math.max(...weekData.map(d => d.hours || 0), 8);
  return (
    <div className="flex items-end justify-between gap-2 h-20">
      {weekData.map((d, i) => {
        const pct = d.hours ? Math.min(1, d.hours / max) : 0;
        const isToday = d.dateStr === TODAY;
        const quality = getSleepQuality(d.hours);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end" style={{ height: 64 }}>
              <div className="w-full rounded-t-lg transition-all duration-700"
                style={{
                  height: pct > 0 ? `${Math.max(6, pct * 64)}px` : 4,
                  background: pct > 0 ? quality.color : 'rgba(0,0,0,0.07)',
                  opacity: isToday ? 1 : 0.65,
                  borderRadius: 6,
                }} />
            </div>
            <span className="text-[10px]" style={{ color: isToday ? '#1f2937' : '#9ca3af', fontWeight: isToday ? 700 : 400 }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const glassCard = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut', delay },
});

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const [showInput, setShowInput] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [tempHours, setTempHours] = useState(7.5);
  const [saving, setSaving] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};

  // Read all sleep from localStorage
  const sleepStore = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('scanly_sleep') || '{}'); } catch { return {}; }
  }, [showInput]); // re-read after closing input

  const weekData = useMemo(() => {
    const todayProfileHours = profile.last_sleep_date === TODAY ? profile.last_sleep_hours : null;
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const hours = sleepStore[dateStr] ?? (dateStr === TODAY ? todayProfileHours : null);
      return { dateStr, label: format(d, 'EEEEE'), hours };
    });
  }, [sleepStore, profile]);

  const todaySleep = weekData[6]?.hours ?? null;
  const score = getSleepScore(todaySleep);

  const logged = weekData.filter(d => d.hours);
  const avgHours = logged.length > 0 ? logged.reduce((s, d) => s + d.hours, 0) / logged.length : null;
  const lastTwo = weekData.slice(-2);
  const trend = lastTwo[0]?.hours && lastTwo[1]?.hours ? lastTwo[1].hours - lastTwo[0].hours : null;

  const saveSleep = async (h) => {
    setSaving(true);
    try {
      const stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
      stored[TODAY] = h;
      localStorage.setItem('scanly_sleep', JSON.stringify(stored));
    } catch (_) {}
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, { last_sleep_hours: h, last_sleep_date: TODAY });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
    setSaving(false);
    setShowInput(false);
  };

  const runAI = async () => {
    setLoadingAI(true);
    setAiInsights(null);
    setShowAI(true);
    const sleepHistory = weekData.map(d => ({ day: format(new Date(d.dateStr), 'EEE'), hours: d.hours || 0 }));
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sleep health coach. Analyze this user's 7-day sleep log.

Sleep data: ${JSON.stringify(sleepHistory)}
7-day average: ${avgHours ? avgHours.toFixed(1) : 'N/A'}h

Return 4 insights (title 5-7 words, description 1-2 sentences, type "positive"|"warning"|"tip", emoji).
Also return overall_summary (2 sentences).`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_summary: { type: 'string' },
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                emoji: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setAiInsights(res);
    setLoadingAI(false);
  };

  const insightStyle = (type) => {
    if (type === 'positive') return { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', color: '#16a34a' };
    if (type === 'warning') return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#dc2626' };
    return { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', color: '#4f46e5' };
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex items-center justify-between px-5 pt-12 pb-2">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-500" />
          <span className="text-xl font-bold text-gray-900">Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runAI}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-600">AI Analysis</span>
          </button>
          <button
            onClick={() => { setTempHours(todaySleep || 7.5); setShowInput(true); }}
            className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>

      <div className="px-5 space-y-4 mt-2">

        {/* Score ring card */}
        <motion.div {...fadeUp(0.05)} className="rounded-[28px] p-6 flex flex-col items-center" style={glassCard}>
          <p className="text-xs text-gray-400 mb-3">{format(new Date(), 'EEEE, d MMMM')}</p>
          <ScoreRing score={score} hours={todaySleep} />
          {todaySleep ? (
            <motion.div {...fadeUp(0.15)} className="mt-5 flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Duration</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{formatHours(todaySleep)}</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Debt</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  {todaySleep >= 8 ? 'None 🎉' : formatHours(Math.max(0, 8 - todaySleep))}
                </p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Goal</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">8h</p>
              </div>
            </motion.div>
          ) : (
            <motion.div {...fadeUp(0.15)} className="mt-5 text-center">
              <p className="text-sm text-gray-400 mb-3">No sleep logged yet today</p>
              <button
                onClick={() => { setTempHours(7.5); setShowInput(true); }}
                className="px-7 py-3 rounded-full font-semibold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                Log Last Night's Sleep
              </button>
            </motion.div>
          )}
          {todaySleep && (
            <button onClick={() => { setTempHours(todaySleep); setShowInput(true); }}
              className="mt-3 text-xs text-indigo-500 font-medium underline underline-offset-2">
              Edit
            </button>
          )}
        </motion.div>

        {/* 7-Day Overview */}
        <motion.div {...fadeUp(0.1)} className="rounded-[24px] p-5" style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900">7-Day Overview</p>
            <div className="flex items-center gap-1.5">
              {trend !== null && (
                trend > 0.1 ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> :
                trend < -0.1 ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> :
                <Minus className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="text-xs text-gray-400">avg {avgHours ? formatHours(avgHours) : '—'}</span>
            </div>
          </div>
          <WeekChart weekData={weekData} />
          <div className="flex gap-3 mt-3 flex-wrap">
            {[
              { color: '#ef4444', label: '< 6h Poor' },
              { color: '#eab308', label: '6-7h Fair' },
              { color: '#22c55e', label: '7-9h Good' },
              { color: '#3b82f6', label: '9h+ Long' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] text-gray-400">{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div {...fadeUp(0.15)} className="grid grid-cols-2 gap-3">
          {[
            { label: 'Weekly Avg', value: avgHours ? formatHours(avgHours) : '—', sub: `${logged.length}/7 days logged`, color: '#6366f1' },
            { label: 'Best Night', value: logged.length ? formatHours(Math.max(...logged.map(d => d.hours))) : '—', sub: 'This week', color: '#22c55e' },
            { label: 'Consistency', value: logged.length > 0 ? `${Math.round((logged.length / 7) * 100)}%` : '—', sub: 'Days logged', color: '#a78bfa' },
            { label: 'Total Debt', value: logged.length ? formatHours(Math.max(0, logged.reduce((s, d) => s + Math.max(0, 8 - d.hours), 0))) : '—', sub: 'vs 8h goal', color: '#f97316' },
          ].map((card, i) => (
            <div key={card.label} className="rounded-[20px] p-4" style={glassCard}>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">{card.label}</p>
              <p className="text-2xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Tips */}
        <motion.div {...fadeUp(0.2)} className="rounded-[24px] p-5" style={glassCard}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <p className="text-sm font-bold text-gray-900">Sleep Tips</p>
          </div>
          <div className="space-y-2.5">
            {[
              { emoji: '🌙', tip: 'Aim for 7–9 hours every night for optimal health and recovery' },
              { emoji: '📱', tip: 'Avoid screens 1 hour before bed to improve melatonin production' },
              { emoji: '🌡️', tip: 'Keep your room cool (16–19°C) — ideal for deep sleep' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-sm">{t.emoji}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{t.tip}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Log Sleep Sheet */}
      <AnimatePresence>
        {showInput && (
          <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInput(false)} />
            <motion.div className="relative z-10 rounded-t-[28px] px-6 pb-12 pt-5 bg-white"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5 bg-gray-200" />
              <div className="flex items-center justify-between mb-1">
                <p className="text-lg font-bold text-gray-900">Log Sleep</p>
                <button onClick={() => setShowInput(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-6">{format(new Date(), 'EEEE, d MMMM')} · Last night</p>

              {/* Big display */}
              <div className="text-center mb-3">
                <p className="font-extrabold text-gray-900" style={{ fontSize: 52, lineHeight: 1 }}>
                  {formatHours(tempHours)}
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: getSleepQuality(tempHours).color }}>
                  {getSleepQuality(tempHours).label}
                </p>
              </div>

              {/* Slider */}
              <input type="range" min={3} max={12} step={0.5} value={tempHours}
                onChange={e => setTempHours(Number(e.target.value))}
                className="w-full mb-2"
                style={{ accentColor: '#6366f1' }} />
              <div className="flex justify-between text-[10px] text-gray-400 mb-6">
                <span>3h</span><span>6h</span><span>8h ideal</span><span>10h</span><span>12h</span>
              </div>

              {/* Quick select grid */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(h => (
                  <button key={h} onClick={() => setTempHours(h)}
                    className="py-2.5 rounded-[12px] text-xs font-bold transition-all"
                    style={{
                      background: tempHours === h ? '#6366f1' : '#f3f4f6',
                      color: tempHours === h ? '#fff' : '#6b7280',
                    }}>
                    {h % 1 === 0 ? `${h}h` : `${Math.floor(h)}h30`}
                  </button>
                ))}
              </div>

              <button onClick={() => saveSleep(tempHours)} disabled={saving}
                className="w-full py-4 rounded-full font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : `Save ${formatHours(tempHours)}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Analysis Sheet */}
      <AnimatePresence>
        {showAI && (
          <motion.div className="fixed inset-0 z-50 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loadingAI && setShowAI(false)} />
            <motion.div className="absolute left-0 right-0 bottom-0 top-24 flex flex-col rounded-t-[28px] overflow-hidden bg-white"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>

              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <p className="text-lg font-bold text-gray-900">AI Sleep Analysis</p>
                </div>
                {!loadingAI && (
                  <button onClick={() => setShowAI(false)}>
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingAI && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                    <p className="text-sm text-gray-400">Analysing your sleep patterns...</p>
                  </div>
                )}
                {aiInsights && !loadingAI && (
                  <>
                    <motion.div {...fadeUp(0)} className="rounded-[16px] p-4 bg-indigo-50 border border-indigo-100">
                      <p className="text-xs text-indigo-400 font-semibold mb-1.5">Overview</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.overall_summary}</p>
                    </motion.div>
                    {(aiInsights.insights || []).map((ins, i) => {
                      const s = insightStyle(ins.type);
                      return (
                        <motion.div key={i} {...fadeUp(i * 0.07)}
                          className="rounded-[16px] p-4"
                          style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{ins.emoji}</span>
                            <div>
                              <p className="text-sm font-bold text-gray-900 mb-1">{ins.title}</p>
                              <p className="text-xs text-gray-500 leading-relaxed">{ins.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}