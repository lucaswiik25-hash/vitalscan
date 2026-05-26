import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const scoreColor = (s) => {
  if (s >= 75) return { text: '#22c55e', bg: '#dcfce7', bar: '#22c55e', label: 'Good' };
  if (s >= 50) return { text: '#f59e0b', bg: '#fef9c3', bar: '#f59e0b', label: 'Fair' };
  return { text: '#ef4444', bg: '#fee2e2', bar: '#ef4444', label: 'Poor' };
};

const FACTOR_ICONS = {
  caffeine: '☕',
  diet: '🥗',
  sugar: '🍬',
  sodium: '🧂',
  alcohol: '🍷',
  exercise: '🏃',
  stress: '🧠',
  hydration: '💧',
  sleep_debt: '🌙',
};

export default function SleepReadinessModule() {
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animated, setAnimated] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setAnimated(false);

    let meals = [];
    let waterLogs = [];
    let exercises = [];
    try {
      [meals, waterLogs, exercises] = await Promise.all([
        base44.entities.Meal.filter({ date: TODAY, logged: true }),
        base44.entities.WaterLog.filter({ date: TODAY }),
        base44.entities.Exercise.filter({ date: TODAY }),
      ]);
    } catch (_) {}

    const totalCaffeine = meals.filter(m =>
      /coffee|espresso|energy|tea|cola|coke/i.test(m.name)
    ).reduce((s, m) => s + (m.calories || 0), 0);

    const totalSugar = meals.reduce((s, m) => s + (m.sugar || 0), 0);
    const totalSodium = meals.reduce((s, m) => s + (m.sodium || 0), 0);
    const totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const waterMl = waterLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0);
    const alcoholLogged = waterLogs.some(l => l.type === 'alcohol');
    const exerciseMinutes = exercises.reduce((s, e) => s + (e.duration_minutes || 0), 0);
    const currentHour = new Date().getHours();

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a sleep science expert. Based on today's data, predict tonight's sleep readiness.

Today's data:
- Meals: ${meals.map(m => `${m.name} (${m.calories}kcal, sugar:${m.sugar || 0}g, sodium:${m.sodium || 0}mg)`).join(', ') || 'none logged'}
- High-caffeine items: ${meals.filter(m => /coffee|espresso|energy|tea|cola/i.test(m.name)).map(m => m.name).join(', ') || 'none'}
- Total sugar today: ${totalSugar}g
- Total sodium today: ${totalSodium}mg  
- Water intake: ${waterMl}ml
- Alcohol logged: ${alcoholLogged}
- Exercise today: ${exerciseMinutes} minutes
- Current time: ${currentHour}:00

Return:
- sleep_score: number 1-100 (how good their sleep quality will likely be tonight)
- fallasleep_ease: number 1-100 (how easy it will be to fall asleep)
- summary: one sentence about tonight's sleep outlook (max 12 words)
- factors: array of up to 4 key factors affecting tonight's sleep, each with:
  - name: short label (e.g. "High caffeine", "Good hydration")
  - impact: "positive" or "negative"
  - key: one of: caffeine, diet, sugar, sodium, alcohol, exercise, hydration, sleep_debt
  - detail: one short phrase (max 8 words)`,
      response_json_schema: {
        type: 'object',
        properties: {
          sleep_score: { type: 'number' },
          fallasleep_ease: { type: 'number' },
          summary: { type: 'string' },
          factors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                impact: { type: 'string' },
                key: { type: 'string' },
                detail: { type: 'string' },
              }
            }
          }
        }
      }
    });

    setReadiness(res);
    setLoading(false);
    setTimeout(() => setAnimated(true), 50);
  };

  useEffect(() => {
    analyze();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm flex items-center justify-center gap-3 py-8">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
        <p className="text-sm text-gray-400">Analysing tonight's sleep readiness…</p>
      </div>
    );
  }

  if (!readiness) return null;

  const sleepC = scoreColor(readiness.sleep_score);
  const easeC = scoreColor(readiness.fallasleep_ease);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white border border-border rounded-[24px] shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Tonight's Sleep Readiness</p>
          <p className="text-xs text-gray-400 mt-0.5">{readiness.summary}</p>
        </div>
        <button onClick={analyze}
          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Two score bars */}
      <div className="px-5 pb-4 space-y-3">
        {/* Sleep Quality */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">Sleep Quality</span>
            <span className="text-xs font-extrabold" style={{ color: sleepC.text }}>{readiness.sleep_score}/100 · {sleepC.label}</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: sleepC.bar }}
              initial={{ width: 0 }}
              animate={{ width: animated ? `${readiness.sleep_score}%` : 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>

        {/* Fall Asleep Ease */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500">Ease of Falling Asleep</span>
            <span className="text-xs font-extrabold" style={{ color: easeC.text }}>{readiness.fallasleep_ease}/100 · {easeC.label}</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: easeC.bar }}
              initial={{ width: 0 }}
              animate={{ width: animated ? `${readiness.fallasleep_ease}%` : 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.25 }}
            />
          </div>
        </div>
      </div>

      {/* Factors */}
      {readiness.factors && readiness.factors.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3 grid grid-cols-2 gap-2">
          {readiness.factors.map((f, i) => {
            const isPos = f.impact === 'positive';
            return (
              <div key={i} className="flex items-start gap-2 rounded-[12px] px-3 py-2.5"
                style={{ background: isPos ? '#f0fdf4' : '#fef9ec' }}>
                <span className="text-base shrink-0">{FACTOR_ICONS[f.key] || '•'}</span>
                <div>
                  <p className="text-[11px] font-bold" style={{ color: isPos ? '#16a34a' : '#b45309' }}>{f.name}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">{f.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}