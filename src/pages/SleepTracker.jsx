import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Plus, X, Sparkles, Loader2, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function formatHours(h) {
  if (!h) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getSleepQuality(h) {
  if (!h) return { label: 'No data', color: '#6b7280' };
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
  return Math.max(40, 100 - (h - 9) * 15);
}

// 7-day bar chart
function WeekChart({ weekData }) {
  const max = Math.max(...weekData.map(d => d.hours || 0), 8);
  return (
    <div className="flex items-end justify-between gap-1.5 h-20">
      {weekData.map((d, i) => {
        const pct = d.hours ? Math.min(1, d.hours / max) : 0;
        const isToday = d.dateStr === TODAY;
        const quality = getSleepQuality(d.hours);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full relative flex items-end" style={{ height: 64 }}>
              <div className="w-full rounded-t-lg transition-all duration-700"
                style={{
                  height: pct > 0 ? `${Math.max(8, pct * 64)}px` : 4,
                  background: pct > 0 ? quality.color : 'rgba(255,255,255,0.08)',
                  opacity: isToday ? 1 : 0.7,
                  borderRadius: 6,
                }} />
            </div>
            <span style={{ fontSize: 10, color: isToday ? '#fff' : '#9ca3af', fontWeight: isToday ? 700 : 400 }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Big score ring
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
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE} strokeLinecap="round"
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
        <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</span>
        <span style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {score > 0 ? score : '—'}
        </span>
        <span style={{ fontSize: 13, color: quality.color, fontWeight: 600 }}>{quality.label}</span>
      </div>
    </div>
  );
}

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const [showInput, setShowInput] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [tempHours, setTempHours] = useState(8);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};

  // Build 7-day data from localStorage
  const weekData = useMemo(() => {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}'); } catch (_) {}
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const hours = stored[dateStr] ?? (dateStr === TODAY && profile.last_sleep_hours ? profile.last_sleep_hours : null);
      return { dateStr, label: format(d, 'EEE')[0], hours };
    });
  }, [profile.last_sleep_hours]);

  const todaySleep = weekData[6]?.hours ?? null;
  const score = getSleepScore(todaySleep);
  const quality = getSleepQuality(todaySleep);

  // Weekly average
  const logged = weekData.filter(d => d.hours);
  const avgHours = logged.length > 0 ? logged.reduce((s, d) => s + d.hours, 0) / logged.length : null;

  // Trend
  const lastTwo = weekData.slice(-2);
  const trend = lastTwo[0]?.hours && lastTwo[1]?.hours
    ? lastTwo[1].hours - lastTwo[0].hours
    : null;

  const saveSleep = async (h) => {
    // Save to localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
      stored[TODAY] = h;
      localStorage.setItem('scanly_sleep', JSON.stringify(stored));
    } catch (_) {}
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, { last_sleep_hours: h, last_sleep_date: TODAY });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
    setShowInput(false);
  };

  const runAI = async () => {
    setLoadingAI(true);
    setAiInsights(null);
    setShowAI(true);
    const sleepHistory = weekData.map(d => ({ day: d.dateStr, hours: d.hours || 0 }));
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sleep health coach. Analyze this user's 7-day sleep log and provide personalized insights.

Sleep data (last 7 days): ${JSON.stringify(sleepHistory)}
Today's sleep: ${todaySleep || 'not logged'}h
7-day average: ${avgHours ? avgHours.toFixed(1) : 'N/A'}h

Return 4 insights. Each has: title (5-7 words), description (1-2 sentences, specific with data), type ("positive"|"warning"|"tip"), emoji (1 relevant emoji).
Also return an overall_summary (2 sentences about their sleep pattern).`,
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

  const insightBg = (type) => {
    if (type === 'positive') return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', color: '#22c55e' };
    if (type === 'warning') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', color: '#ef4444' };
    return { bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', color: '#818cf8' };
  };

  return (
    <div className="min-h-screen pb-28 select-none" style={{ background: '#111827' }}>
      {/* Gradient orb */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 70%)',
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-2">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5" style={{ color: '#818cf8' }} />
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runAI}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>AI Analysis</span>
          </button>
          <button onClick={() => { setTempHours(todaySleep || 8); setShowInput(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(129,140,248,0.2)' }}>
            <Plus className="w-4 h-4" style={{ color: '#818cf8' }} />
          </button>
        </div>
      </div>

      <div className="relative z-10 px-5 space-y-4 mt-2">

        {/* Score ring + date */}
        <div className="rounded-[28px] p-6 flex flex-col items-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>{format(new Date(), 'EEEE, d MMMM')}</span>
          <ScoreRing score={score} hours={todaySleep} />
          {todaySleep ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="text-center">
                <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duration</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{formatHours(todaySleep)}</p>
              </div>
              <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Debt</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
                  {todaySleep >= 8 ? 'None' : formatHours(8 - todaySleep)}
                </p>
              </div>
              <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goal</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>8h</p>
              </div>
            </div>
          ) : (
            <button onClick={() => { setTempHours(8); setShowInput(true); }}
              className="mt-5 px-8 py-3 rounded-full font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', fontSize: 15 }}>
              Log Tonight's Sleep
            </button>
          )}
        </div>

        {/* 7-Day Overview */}
        <div className="rounded-[24px] p-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>7-Day Overview</p>
            <div className="flex items-center gap-1.5">
              {trend !== null && (
                trend > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> :
                trend < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> :
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                avg {avgHours ? formatHours(avgHours) : '—'}
              </span>
            </div>
          </div>
          <WeekChart weekData={weekData} />
          {/* Legend */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {[
              { color: '#ef4444', label: '< 6h Poor' },
              { color: '#eab308', label: '6-7h Fair' },
              { color: '#22c55e', label: '7-9h Good' },
              { color: '#3b82f6', label: '9h+ Long' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span style={{ fontSize: 10, color: '#6b7280' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Weekly Avg</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{avgHours ? formatHours(avgHours) : '—'}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{logged.length} / 7 days logged</p>
          </div>
          <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Best Night</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#22c55e' }}>
              {logged.length ? formatHours(Math.max(...logged.map(d => d.hours))) : '—'}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>This week</p>
          </div>
          <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Consistency</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#818cf8' }}>
              {logged.length > 0 ? `${Math.round((logged.length / 7) * 100)}%` : '—'}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Days logged</p>
          </div>
          <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Total Debt</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#f97316' }}>
              {logged.length ? formatHours(Math.max(0, logged.reduce((s, d) => s + Math.max(0, 8 - d.hours), 0))) : '—'}
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>vs 8h goal</p>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-[24px] p-5"
          style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 18 }}>💡</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>Sleep Tips</p>
          </div>
          <div className="space-y-2">
            {[
              { emoji: '🌙', tip: 'Aim for 7–9 hours every night for optimal health' },
              { emoji: '📱', tip: 'Avoid screens 1 hour before bed to improve sleep quality' },
              { emoji: '🌡️', tip: 'Keep your bedroom cool — 16–19°C is ideal for sleep' },
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ fontSize: 14 }}>{t.emoji}</span>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{t.tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Log Sleep Sheet */}
      <AnimatePresence>
        {showInput && (
          <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInput(false)} />
            <motion.div className="relative z-10 rounded-t-[28px] px-6 pb-12 pt-5"
              style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="flex items-center justify-between mb-1">
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Log Sleep</p>
                <button onClick={() => setShowInput(false)}>
                  <X className="w-5 h-5" style={{ color: '#6b7280' }} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
                {format(new Date(), 'EEEE, d MMMM')} · Last night
              </p>

              {/* Slider */}
              <div className="text-center mb-6">
                <p style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{formatHours(tempHours)}</p>
                <p style={{ fontSize: 13, color: getSleepQuality(tempHours).color, marginTop: 4, fontWeight: 600 }}>
                  {getSleepQuality(tempHours).label}
                </p>
              </div>

              <input type="range" min={3} max={12} step={0.5} value={tempHours}
                onChange={e => setTempHours(Number(e.target.value))}
                className="w-full mb-6"
                style={{ accentColor: '#818cf8' }} />

              <div className="flex justify-between text-xs mb-6" style={{ color: '#6b7280' }}>
                <span>3h</span><span>6h</span><span>8h ideal</span><span>10h</span><span>12h</span>
              </div>

              {/* Quick hour grid */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10, 11].map(h => (
                  <button key={h} onClick={() => setTempHours(h)}
                    className="py-2.5 rounded-[12px] text-xs font-bold transition-all"
                    style={{
                      background: tempHours === h ? '#6366f1' : 'rgba(255,255,255,0.06)',
                      color: tempHours === h ? '#fff' : '#9ca3af',
                    }}>
                    {h % 1 === 0 ? `${h}h` : `${Math.floor(h)}h30`}
                  </button>
                ))}
              </div>

              <button onClick={() => saveSleep(tempHours)}
                className="w-full py-4 rounded-full font-bold text-white text-base"
                style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                Save {formatHours(tempHours)} Sleep
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !loadingAI && setShowAI(false)} />
            <motion.div className="absolute left-0 right-0 bottom-0 top-20 flex flex-col rounded-t-[28px] overflow-hidden"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>

              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: '#818cf8' }} />
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>AI Sleep Analysis</p>
                </div>
                {!loadingAI && (
                  <button onClick={() => setShowAI(false)}>
                    <X className="w-5 h-5" style={{ color: '#6b7280' }} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-4">
                {loadingAI && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#818cf8' }} />
                    <p style={{ color: '#9ca3af', fontSize: 14 }}>Analysing your sleep patterns...</p>
                  </div>
                )}

                {aiInsights && !loadingAI && (
                  <>
                    {/* Summary */}
                    <div className="rounded-[20px] p-4"
                      style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
                      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Overview</p>
                      <p style={{ fontSize: 14, color: '#e5e7eb', lineHeight: 1.6 }}>{aiInsights.overall_summary}</p>
                    </div>

                    {/* Insights */}
                    {(aiInsights.insights || []).map((ins, i) => {
                      const style = insightBg(ins.type);
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-[20px] p-4"
                          style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                          <div className="flex items-start gap-3">
                            <span style={{ fontSize: 22 }}>{ins.emoji}</span>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{ins.title}</p>
                              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{ins.description}</p>
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