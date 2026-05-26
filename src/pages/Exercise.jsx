import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Flame, Dumbbell, Timer, Trash2, X, Loader2, ChevronRight, Pencil, Bike, PersonStanding, Waves, Zap, Activity, SkipForward } from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay },
});

const QUICK_EXERCISES = [
  { name: 'Running', icon: Activity, met: 9.8, category: 'cardio' },
  { name: 'Walking', icon: PersonStanding, met: 3.5, category: 'cardio' },
  { name: 'Cycling', icon: Bike, met: 7.5, category: 'cardio' },
  { name: 'Swimming', icon: Waves, met: 8.0, category: 'cardio' },
  { name: 'Weight Training', icon: Dumbbell, met: 5.0, category: 'strength' },
  { name: 'HIIT', icon: Zap, met: 10.0, category: 'cardio' },
  { name: 'Jump Rope', icon: SkipForward, met: 11.0, category: 'cardio' },
  { name: 'Yoga', icon: Activity, met: 2.5, category: 'flexibility' },
  { name: 'Basketball', icon: Activity, met: 8.0, category: 'sports' },
  { name: 'Football', icon: Activity, met: 8.3, category: 'sports' },
  { name: 'Pilates', icon: Activity, met: 3.5, category: 'flexibility' },
  { name: 'Rowing', icon: Activity, met: 8.5, category: 'cardio' },
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
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'cardio', duration_minutes: 30, intensity: 'medium', notes: '' });
  const [saving, setSaving] = useState(false);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => base44.entities.UserProfile.list() });
  const profile = profiles[0] || {};
  const weight = profile.weight || 70;

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', today],
    queryFn: () => base44.entities.Exercise.filter({ date: today }),
  });

  const bmr = useMemo(() => calcBMR(profile), [profile]);
  const totalBurned = exercises.reduce((s, e) => s + (e.calories_burned || 0), 0);
  const totalMinutes = exercises.reduce((s, e) => s + (e.duration_minutes || 0), 0);
  const exerciseTarget = Math.round(bmr * 0.3);
  const pct = exerciseTarget > 0 ? (totalBurned / exerciseTarget) * 100 : 0;

  const handleQuickSelect = (ex) => {
    const cal = calcCalories(ex.met, weight, 30);
    setForm({ name: ex.name, category: ex.category, duration_minutes: 30, intensity: 'medium', notes: '', calories_burned: cal });
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
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Exercise.delete(id);
    queryClient.invalidateQueries({ queryKey: ['exercises', today] });
    queryClient.invalidateQueries({ queryKey: ['allExercises'] });
  };

  const visibleExercises = showAll ? QUICK_EXERCISES : QUICK_EXERCISES.slice(0, 6);

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center mr-3">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">Exercise</h1>
        <button onClick={() => setShowAdd(true)} className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-5 space-y-5">
        {/* Today's Burn Hero Card */}
        <motion.div {...fadeUp(0)} className="rounded-[24px] p-6 -mx-1" style={{ background: '#E8EFF4' }}>
          {/* Label */}
          <p className="text-sm font-semibold text-gray-500 mb-4">Todays Burn</p>

          {/* Circular progress */}
          <div className="flex justify-center mb-5">
            <div className="relative" style={{ width: 260, height: 260 }}>
              <svg width={260} height={260} viewBox="0 0 260 260" style={{ transform: 'rotate(-45deg)', overflow: 'visible' }}>
                {/* Track */}
                <circle cx={130} cy={130} r={108} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={32} strokeLinecap="round" />
                {/* Progress */}
                <circle cx={130} cy={130} r={108} fill="none" stroke="#1a1a1a" strokeWidth={32}
                  strokeDasharray={2 * Math.PI * 108}
                  strokeDashoffset={(2 * Math.PI * 108) * (1 - Math.min(1, pct / 100))}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-extrabold text-gray-900">{Math.round(Math.min(100, pct))}%</span>
              </div>
            </div>
          </div>

          {/* Linear progress */}
          <p className="text-sm font-semibold text-gray-700 mb-2">{totalBurned} of {exerciseTarget} Kcal</p>
          <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.55)' }}>
            <div className="h-full rounded-full bg-gray-900 transition-all duration-700"
              style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </motion.div>

        {/* Add Exercise section */}
        <div>
          <motion.div {...fadeUp(0.5)} className="mb-3">
            <h2 className="text-base font-bold text-gray-900">Add Exercise</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tap to log instantly</p>
          </motion.div>
          <div className="space-y-2">
            {visibleExercises.map((ex, i) => {
              const Icon = ex.icon;
              const calPerHour = Math.round(calcCalories(ex.met, weight, 60));
              return (
                <motion.button key={ex.name} {...fadeUp(0.6 + i * 0.06)} onClick={() => handleQuickSelect(ex)}
                  className="w-full rounded-[14px] p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(20px) saturate(200%) brightness(1.05)',
                    WebkitBackdropFilter: 'blur(20px) saturate(200%) brightness(1.05)',
                    border: '1px solid rgba(255,255,255,0.75)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                  }}>
                  <div className="w-10 h-10 rounded-[10px] bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-gray-900" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{ex.name}</p>
                    <p className="text-xs text-gray-400">approx {calPerHour} kcal per hour</p>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                </motion.button>
              );
            })}
          </div>
          {!showAll && (
            <button onClick={() => setShowAll(true)} className="w-full mt-3 text-sm text-gray-400 font-medium py-2">
              Show more
            </button>
          )}
        </div>

        {/* Today's Sessions */}
        {exercises.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Today's Sessions</h2>
            <div className="space-y-2">
              {exercises.map(ex => (
                <div key={ex.id} className="bg-white rounded-[14px] p-4 flex items-center gap-3 shadow-sm border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{ex.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ex.duration_minutes} min · {ex.calories_burned} kcal</p>
                  </div>
                  <button onClick={() => handleDelete(ex.id)}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {exercises.length === 0 && (
          <div className="rounded-[14px] border border-gray-100 p-8 text-center">
            <Dumbbell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No exercises logged today</p>
          </div>
        )}
      </div>

      {/* Add Exercise — full screen slide-up */}
      {showAdd && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} onClick={() => setShowAdd(false)} />
          <motion.div className="absolute left-0 right-0 bottom-0 bg-white flex flex-col overflow-hidden"
            style={{ top: 0, borderRadius: '24px 24px 0 0' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-start justify-between px-6 pt-3 pb-4 shrink-0 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Log Exercise</h2>
                <p className="text-sm text-gray-400 mt-0.5">Track your workout session</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Quick select */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Select</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_EXERCISES.map(ex => {
                    const Icon = ex.icon;
                    const isSelected = form.name === ex.name;
                    return (
                      <button key={ex.name} onClick={() => handleQuickSelect(ex)}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[16px] transition-all active:scale-95"
                        style={{ background: isSelected ? '#1a1a1a' : '#f3f4f6', border: isSelected ? '2px solid #1a1a1a' : '2px solid transparent' }}>
                        <Icon className="w-5 h-5" style={{ color: isSelected ? 'white' : '#6b7280' }} strokeWidth={1.8} />
                        <span className="text-[11px] font-bold text-center leading-tight" style={{ color: isSelected ? 'white' : '#374151' }}>{ex.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Exercise Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Morning Run"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Duration: {form.duration_minutes} min</label>
                <input type="range" min="5" max="180" step="5" value={form.duration_minutes}
                  onChange={e => handleDurationChange(Number(e.target.value))}
                  className="w-full accent-gray-900"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>5 min</span><span>180 min</span></div>
              </div>

              {/* Intensity */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Intensity</label>
                <div className="grid grid-cols-3 gap-2">
                  {['low', 'medium', 'high'].map(lvl => (
                    <button key={lvl} onClick={() => setForm(f => ({ ...f, intensity: lvl }))}
                      className="h-12 rounded-2xl text-sm font-bold capitalize transition-all"
                      style={{ background: form.intensity === lvl ? '#1a1a1a' : '#f3f4f6', color: form.intensity === lvl ? 'white' : '#6b7280' }}>
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calories estimate */}
              {form.calories_burned ? (
                <div className="rounded-2xl p-4 text-center bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Estimated Calories Burned</p>
                  <p className="text-3xl font-black text-gray-900">{form.calories_burned} <span className="text-sm font-semibold text-gray-400">kcal</span></p>
                </div>
              ) : null}

              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="w-full h-14 rounded-full bg-gray-900 text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Log Exercise'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}