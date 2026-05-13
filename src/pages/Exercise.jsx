import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Flame, Dumbbell, Timer, Trash2, X, Loader2, ChevronRight } from 'lucide-react';

const glassStyle = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)',
};

const deepGlassStyle = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(30px) saturate(200%)',
  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,1)',
};

const CATEGORY_CONFIG = {
  cardio:      { emoji: '🏃', color: '#ef4444', bg: '#fef2f2' },
  strength:    { emoji: '💪', color: '#8b5cf6', bg: '#f5f3ff' },
  flexibility: { emoji: '🧘', color: '#06b6d4', bg: '#ecfeff' },
  sports:      { emoji: '⚽', color: '#f59e0b', bg: '#fffbeb' },
  other:       { emoji: '🏋️', color: '#64748b', bg: '#f8fafc' },
};

const QUICK_EXERCISES = [
  { name: 'Running', category: 'cardio', met: 9.8 },
  { name: 'Walking', category: 'cardio', met: 3.5 },
  { name: 'Cycling', category: 'cardio', met: 7.5 },
  { name: 'Swimming', category: 'cardio', met: 8.0 },
  { name: 'Weight Training', category: 'strength', met: 5.0 },
  { name: 'HIIT', category: 'cardio', met: 10.0 },
  { name: 'Yoga', category: 'flexibility', met: 2.5 },
  { name: 'Jump Rope', category: 'cardio', met: 11.0 },
  { name: 'Basketball', category: 'sports', met: 8.0 },
  { name: 'Football', category: 'sports', met: 8.3 },
  { name: 'Pilates', category: 'flexibility', met: 3.5 },
  { name: 'Rowing', category: 'cardio', met: 8.5 },
];

function calcBMR(profile) {
  const w = profile.weight || 70, h = profile.height || 170, a = profile.age || 25;
  return profile.sex === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
}

function calcCalories(met, weight, minutes) {
  return Math.round((met * weight * minutes) / 60);
}

export default function Exercise() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'cardio', duration_minutes: 30, intensity: 'medium', notes: '' });
  const [saving, setSaving] = useState(false);
  const [selectedQuick, setSelectedQuick] = useState(null);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => base44.entities.UserProfile.list() });
  const profile = profiles[0] || {};
  const weight = profile.weight || 70;

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', today],
    queryFn: () => base44.entities.Exercise.filter({ date: today }),
  });

  const { data: allExercises = [] } = useQuery({
    queryKey: ['allExercises'],
    queryFn: () => base44.entities.Exercise.list('-created_date', 50),
  });

  const bmr = useMemo(() => calcBMR(profile), [profile]);
  const totalBurned = exercises.reduce((s, e) => s + (e.calories_burned || 0), 0);

  // Exercise calorie target = BMR (just the base metabolic rate for exercise goal)
  const exerciseTarget = Math.round(bmr * 0.3); // 30% of BMR as daily exercise burn target

  const handleQuickSelect = (ex) => {
    setSelectedQuick(ex);
    const cal = calcCalories(ex.met, weight, form.duration_minutes || 30);
    setForm(f => ({ ...f, name: ex.name, category: ex.category, calories_burned: cal }));
    setShowAdd(true);
  };

  const handleDurationChange = (mins) => {
    const met = QUICK_EXERCISES.find(e => e.name === form.name)?.met;
    const cal = met ? calcCalories(met, weight, mins) : form.calories_burned;
    setForm(f => ({ ...f, duration_minutes: mins, calories_burned: cal }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const met = QUICK_EXERCISES.find(e => e.name === form.name)?.met || 5;
    const cal = form.calories_burned || calcCalories(met, weight, form.duration_minutes || 30);
    await base44.entities.Exercise.create({ ...form, date: today, calories_burned: cal });
    queryClient.invalidateQueries({ queryKey: ['exercises', today] });
    queryClient.invalidateQueries({ queryKey: ['allExercises'] });
    setShowAdd(false);
    setForm({ name: '', category: 'cardio', duration_minutes: 30, intensity: 'medium', notes: '' });
    setSelectedQuick(null);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Exercise.delete(id);
    queryClient.invalidateQueries({ queryKey: ['exercises', today] });
    queryClient.invalidateQueries({ queryKey: ['allExercises'] });
  };

  const pct = exerciseTarget > 0 ? Math.min(100, (totalBurned / exerciseTarget) * 100) : 0;
  const ringColor = pct >= 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(135deg, #fff8f5 0%, #f0f4ff 100%)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center" style={glassStyle}>
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900 flex-1">Exercise</h1>
        <button onClick={() => setShowAdd(true)} className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shadow-lg">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Today Summary Card */}
      <div className="mx-5 mb-5 rounded-[24px] p-5" style={deepGlassStyle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Today's Burn</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-black text-gray-900">{totalBurned.toLocaleString()}</span>
              <span className="text-base font-semibold text-gray-400">kcal</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Target: {exerciseTarget} kcal</p>
          </div>
          {/* Ring */}
          <div className="relative w-20 h-20">
            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={ringColor} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-4 h-4" style={{ color: ringColor }} />
              <span className="text-xs font-bold text-gray-700">{Math.round(pct)}%</span>
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <Timer className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-gray-900">{exercises.reduce((s, e) => s + (e.duration_minutes || 0), 0)}</p>
            <p className="text-[10px] text-gray-400">min</p>
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <Dumbbell className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-gray-900">{exercises.length}</p>
            <p className="text-[10px] text-gray-400">sessions</p>
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-extrabold text-gray-900">{Math.max(0, exerciseTarget - totalBurned)}</p>
            <p className="text-[10px] text-gray-400">left</p>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="px-5 mb-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Add</p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_EXERCISES.map(ex => {
            const cfg = CATEGORY_CONFIG[ex.category];
            return (
              <button key={ex.name} onClick={() => handleQuickSelect(ex)}
                className="rounded-[18px] p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                style={{ ...glassStyle, background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
                <span className="text-2xl">{cfg.emoji}</span>
                <span className="text-[10px] font-bold text-center leading-tight" style={{ color: cfg.color }}>{ex.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's exercises */}
      {exercises.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today's Sessions</p>
          <div className="space-y-2">
            {exercises.map(ex => {
              const cfg = CATEGORY_CONFIG[ex.category] || CATEGORY_CONFIG.other;
              return (
                <div key={ex.id} className="rounded-[20px] p-4 flex items-center gap-3" style={deepGlassStyle}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: cfg.bg }}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{ex.name}</p>
                    <p className="text-xs text-gray-400">{ex.duration_minutes} min · <span style={{ color: cfg.color }}>{ex.calories_burned} kcal</span></p>
                  </div>
                  <button onClick={() => handleDelete(ex.id)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="mx-5 rounded-[20px] p-8 text-center" style={glassStyle}>
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No exercises logged today</p>
          <p className="text-xs text-gray-300 mt-1">Tap a quick-add or use the + button</p>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-[28px] px-5 pt-5 pb-10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Exercise</h2>
              <button onClick={() => { setShowAdd(false); setSelectedQuick(null); }} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Exercise Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Morning Run"
                  className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Duration: {form.duration_minutes} min</label>
                <input type="range" min="5" max="180" step="5" value={form.duration_minutes}
                  onChange={e => handleDurationChange(Number(e.target.value))}
                  className="w-full accent-gray-900"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>5 min</span><span>180 min</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(lvl => (
                  <button key={lvl} onClick={() => setForm(f => ({ ...f, intensity: lvl }))}
                    className="h-10 rounded-2xl text-xs font-bold capitalize transition-all"
                    style={{ background: form.intensity === lvl ? '#1a1a1a' : '#f3f4f6', color: form.intensity === lvl ? 'white' : '#6b7280' }}>
                    {lvl}
                  </button>
                ))}
              </div>

              {form.calories_burned && (
                <div className="rounded-2xl p-3 text-center" style={{ background: '#fef3c7' }}>
                  <p className="text-xs text-amber-600 font-semibold">Estimated Calories Burned</p>
                  <p className="text-2xl font-black text-amber-700">{form.calories_burned} <span className="text-sm font-semibold">kcal</span></p>
                </div>
              )}

              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="w-full h-13 h-12 rounded-full bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Log Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}