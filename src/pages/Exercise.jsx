import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Flame, Dumbbell, Timer, Trash2, X, Loader2, Bike, PersonStanding, Waves, Zap, Activity, SkipForward } from 'lucide-react';

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

// Big circular progress ring — bleeds off top of screen
function BigProgressRing({ pct, totalBurned, exerciseTarget }) {
  // Ring is huge, top half bleeds off screen
  const size = 420;
  const r = 175;
  const strokeW = 36;
  const circ = 2 * Math.PI * r;
  const clampedPct = Math.min(100, pct);
  const dash = (clampedPct / 100) * circ;

  return (
    <div style={{ background: '#F5EAE5', marginTop: -60, paddingBottom: 0 }}>
      {/* Ring container — overflows top */}
      <div className="flex justify-center" style={{ marginBottom: -12 }}>
        <div className="relative" style={{ width: size, height: size * 0.72, overflow: 'hidden' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
            {/* Interior circle fill */}
            <circle cx={size / 2} cy={size / 2} r={r - strokeW / 2 - 2} fill="#F5EAE5" />
            {/* Track */}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke="#EDD8CF" strokeWidth={strokeW} />
            {/* Progress */}
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke="#ffffff" strokeWidth={strokeW}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          {/* Center percentage */}
          <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 60 }}>
            <span style={{
              fontSize: 72,
              fontWeight: 300,
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              {Math.round(clampedPct)}%
            </span>
          </div>
        </div>
      </div>

      {/* Calorie goal row — tight below ring */}
      <div className="flex items-center gap-2.5 px-6 pb-4">
        <Flame className="w-6 h-6 text-orange-500 shrink-0" />
        <div>
          <p className="text-lg font-bold text-gray-900 leading-tight">Calorie Goal: {exerciseTarget}kcal</p>
          <p className="text-sm text-gray-500">Remaining only {Math.max(0, exerciseTarget - totalBurned)} kcal</p>
        </div>
      </div>
    </div>
  );
}

export default function Exercise() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showAdd, setShowAdd] = useState(false);
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

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F5EAE5' }}>
      {/* Header — sits on warm background, no border */}
      <div className="px-5 pt-12 pb-2 flex items-center" style={{ position: 'relative', zIndex: 10 }}>
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center mr-3">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">Exercise</h1>
        <div className="w-10" />
      </div>

      {/* Big circular ring — bleeds off top */}
      <BigProgressRing pct={pct} totalBurned={totalBurned} exerciseTarget={exerciseTarget} />

      {/* 3 stat chips — no card background, float on warm bg */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, value: Math.max(0, exerciseTarget - totalBurned), label: 'remaining' },
            { icon: Dumbbell, value: exercises.length, label: 'sessions' },
            { icon: Timer, value: totalMinutes, label: 'minutes' },
          ].map(({ icon: Icon, value, label }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
              className="rounded-[20px] py-4 px-2 flex flex-col items-center gap-1 bg-white/50">
              <Icon className="w-4 h-4 text-gray-600" />
              <span className="text-2xl font-black text-gray-900 leading-none">{value}</span>
              <span className="text-[11px] text-gray-500">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Exercise section */}
      <div className="px-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="mb-3">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Add exercise</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tap to log instantly</p>
        </motion.div>
        <div className="space-y-2.5">
          {QUICK_EXERCISES.map((ex, i) => {
            const Icon = ex.icon;
            const calPerHour = Math.round(calcCalories(ex.met, weight, 60));
            return (
              <motion.button key={ex.name}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.55 + i * 0.04 }}
                onClick={() => handleQuickSelect(ex)}
                className="w-full rounded-[18px] p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform bg-white"
                style={{ border: '1.5px solid #E8D5CC' }}>
                <div className="w-10 h-10 rounded-[12px] bg-gray-50 flex items-center justify-center shrink-0"
                  style={{ border: '1px solid #e5e7eb' }}>
                  <Icon className="w-5 h-5 text-gray-700" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{ex.name}</p>
                  <p className="text-xs text-gray-400">approx {calPerHour} kcal/hr</p>
                </div>
                <Plus className="w-4 h-4 text-gray-400 shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Today's Sessions */}
      {exercises.length > 0 && (
        <div className="px-5 mt-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Today's Sessions</h2>
          <div className="space-y-2">
            {exercises.map(ex => (
              <div key={ex.id} className="rounded-[18px] p-4 flex items-center gap-3 bg-white" style={{ border: '1.5px solid #E8D5CC' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{ex.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ex.duration_minutes} min · {ex.calories_burned} kcal</p>
                </div>
                <button onClick={() => handleDelete(ex.id)} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {exercises.length === 0 && (
        <div className="px-5 mt-4">
          <div className="rounded-[18px] p-8 text-center bg-white" style={{ border: '1.5px solid #E8D5CC' }}>
            <Dumbbell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No exercises logged today</p>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
            onClick={() => setShowAdd(false)} />
          <motion.div className="relative w-full max-w-lg bg-white rounded-t-[28px] px-5 pt-5 pb-10 shadow-2xl"
            initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Exercise</h2>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
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
                  className="w-full accent-gray-900" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>5 min</span><span>180 min</span></div>
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
              {form.calories_burned ? (
                <div className="rounded-2xl p-3 text-center bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold">Estimated Calories Burned</p>
                  <p className="text-2xl font-black text-gray-900">{form.calories_burned} <span className="text-sm font-semibold text-gray-400">kcal</span></p>
                </div>
              ) : null}
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="w-full h-12 rounded-full bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
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