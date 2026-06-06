import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Dumbbell, Trash2, X, Loader2, Bike, PersonStanding, Waves, Zap, Activity, SkipForward } from 'lucide-react';

const ACCENT = '#1A1814';
const TRACK_COLOR = '#FFFFFF';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
function getMondayIndex(date) { const d = date.getDay(); return d === 0 ? 6 : d - 1; }

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

function calcCalories(met, weight, minutes) {
  return Math.round((met * weight * minutes) / 60);
}



export default function Exercise() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAdd, setShowAdd] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'cardio', duration_minutes: 30, intensity: 'medium', notes: '' });
  const [saving, setSaving] = useState(false);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => base44.entities.UserProfile.list() });
  const profile = profiles[0] || {};
  const weight = profile.weight || 70;

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', selectedDate],
    queryFn: () => base44.entities.Exercise.filter({ date: selectedDate }),
  });

  const totalBurned = exercises.reduce((s, e) => s + (e.calories_burned || 0), 0);
  const exerciseTarget = 500;
  const pct = totalBurned > 0 ? (totalBurned / exerciseTarget) * 100 : 0;
  const goalCrushed = pct >= 100;

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
    queryClient.invalidateQueries({ queryKey: ['exercises', selectedDate] });
    queryClient.invalidateQueries({ queryKey: ['allExercises'] });
    setShowAdd(false);
    setForm({ name: '', category: 'cardio', duration_minutes: 30, intensity: 'medium', notes: '' });
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Exercise.delete(id);
    queryClient.invalidateQueries({ queryKey: ['exercises', selectedDate] });
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
        <motion.div {...fadeUp(0)} className="rounded-[28px] overflow-hidden -mx-1 border border-border glow-card" style={{ background: '#F7F7F7' }}>
          <div className="px-5 pt-5 pb-8">

            {/* Weekly day strip — interactive */}
            {(() => {
              const todayDate = new Date();
              const mondayIdx = getMondayIndex(todayDate);
              const weekDays = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(todayDate, mondayIdx - i);
                const dateStr = format(d, 'yyyy-MM-dd');
                return { label: DAY_LABELS[i], dateStr, isToday: dateStr === today };
              });
              return (
                <div className="flex justify-between mb-4">
                  {weekDays.map((d, i) => {
                    const isSelected = d.dateStr === selectedDate;
                    return (
                      <button key={i} onClick={() => setSelectedDate(d.dateStr)}
                        className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={isSelected
                            ? { background: ACCENT }
                            : { border: '2.5px solid #D1D5DB', background: 'transparent' }}>
                          <span className="text-[11px] font-bold"
                            style={{ color: isSelected ? '#FFFFFF' : '#9CA3AF' }}>{d.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Main activity ring — 180px diameter */}
            {(() => {
              const SIZE = 180, R = 65, STROKE = 22, CX = 90, CY = 90;
              // Note: ring progress uses CSS transition for smooth day-switch animation
              const CIRC = 2 * Math.PI * R;
              const clampedPct = Math.min(pct, 100);
              const dash = (clampedPct / 100) * CIRC;
              const ringColor = ACCENT;
              return (
                <div className="relative flex justify-center mb-4">
                  <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track */}
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke={TRACK_COLOR} strokeWidth={STROKE} strokeLinecap="round" />
                    {/* Progress arc */}
                    {pct > 0 && (
                      <circle cx={CX} cy={CY} r={R} fill="none"
                        stroke={ringColor} strokeWidth={STROKE}
                        strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.7s ease' }} />
                    )}
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {goalCrushed ? (
                      <>
                        <span className="text-2xl font-black" style={{ color: ACCENT }}>100%</span>
                        <span className="text-[10px] font-semibold text-gray-400">Goal Crushed!</span>
                      </>
                    ) : pct === 0 ? (
                      <span className="text-sm font-semibold text-gray-400">No data</span>
                    ) : (
                      <>
                        <span className="text-2xl font-black" style={{ color: ACCENT }}>{Math.round(pct)}%</span>
                        <span className="text-[10px] font-semibold text-gray-400">of goal</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Stats */}
            <motion.div key={selectedDate} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="mb-1">
              <p className="text-base font-semibold mb-0.5" style={{ color: ACCENT }}>
                Movement {selectedDate !== today && <span className="text-sm font-normal text-gray-400">· {format(new Date(selectedDate), 'MMM d')}</span>}
              </p>
              <p className="text-3xl font-bold tracking-tight" style={{ color: ACCENT }}>
                {totalBurned}/{exerciseTarget} <span className="text-2xl font-medium">KCAL</span>
              </p>
            </motion.div>
            <div className="flex justify-between">
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>{totalBurned} kcal burned</span>
              <span style={{ fontSize: 13, color: '#9CA3AF' }}>{exerciseTarget} kcal goal</span>
            </div>
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
                  className="w-full rounded-[14px] p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform glow-card"
                  style={{
                    background: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(20px) saturate(200%) brightness(1.05)',
                    WebkitBackdropFilter: 'blur(20px) saturate(200%) brightness(1.05)',
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

        {/* Sessions */}
        {exercises.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">
              {selectedDate === today ? "Today's Sessions" : format(new Date(selectedDate), 'MMM d') + "'s Sessions"}
            </h2>
            <div className="space-y-2">
              {exercises.map(ex => (
                <div key={ex.id} className="bg-white rounded-[14px] p-4 flex items-center gap-3 glow-card">
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
          <div className="rounded-[14px] p-8 text-center glow-card">
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