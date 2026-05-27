import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Dumbbell, Trash2, X, Loader2, Bike, PersonStanding, Waves, Zap, Activity, SkipForward } from 'lucide-react';

const PINK = '#FF375F';
const TRACK = '#1C0A0E';
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
        {/* Today's Burn Hero Card — Apple Watch style */}
        <motion.div {...fadeUp(0)} className="rounded-[28px] overflow-hidden -mx-1" style={{ background: '#000' }}>
          <div className="px-5 pt-5 pb-6">

            {/* Weekly day rings */}
            {(() => {
              const todayDate = new Date();
              const mondayIdx = getMondayIndex(todayDate);
              const weekDays = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(todayDate, mondayIdx - i);
                const dateStr = format(d, 'yyyy-MM-dd');
                const burned = exercises
                  .filter(e => e.date === dateStr)
                  .reduce((s, e) => s + (e.calories_burned || 0), 0);
                const dayPct = exerciseTarget > 0 ? Math.min(100, (burned / exerciseTarget) * 100) : 0;
                return { label: DAY_LABELS[i], pct: dayPct, isToday: dateStr === today };
              });
              const R2 = 16, S2 = 5, C2 = 2 * Math.PI * R2;
              return (
                <div className="flex justify-between mb-6">
                  {weekDays.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      {d.isToday ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: PINK }}>
                          <span className="text-black text-[10px] font-bold">{d.label}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium" style={{ color: '#8E8E93' }}>{d.label}</span>
                      )}
                      <svg width="38" height="38" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="20" cy="20" r={R2} fill="none" stroke={TRACK} strokeWidth={S2} strokeLinecap="round" />
                        {d.pct > 0 && (
                          <circle cx="20" cy="20" r={R2} fill="none" stroke={PINK} strokeWidth={S2}
                            strokeDasharray={`${(d.pct / 100) * C2} ${C2}`} strokeLinecap="round" />
                        )}
                      </svg>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Main activity ring */}
            {(() => {
              const R = 100, STROKE = 45, CX = 140, CY = 140;
              const CIRC = 2 * Math.PI * R;
              const dash = (Math.min(pct, 100) / 100) * CIRC;
              const angleDeg = (Math.min(pct, 100) / 100) * 360 - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const arrowX = CX + R * Math.cos(angleRad);
              const arrowY = CY + R * Math.sin(angleRad);
              return (
                <div className="relative flex justify-center mb-6">
                  <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke={TRACK} strokeWidth={STROKE} strokeLinecap="round" />
                    {pct > 0 && (
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke={PINK} strokeWidth={STROKE}
                        strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.7s ease' }} />
                    )}
                  </svg>
                  {pct > 2 && (
                    <div className="absolute flex items-center justify-center rounded-full"
                      style={{
                        width: 44, height: 44, background: PINK,
                        left: `calc(50% + ${arrowX - CX}px - 22px)`,
                        top: `calc(50% + ${arrowY - CY}px - 22px)`,
                        transform: `rotate(${angleDeg + 90}deg)`,
                        boxShadow: `0 0 12px ${PINK}88`,
                      }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stats + goal button */}
            <div className="flex justify-between items-end mb-5">
              <div>
                <p className="text-white text-2xl font-normal mb-1">Movement</p>
                <p className="text-4xl font-semibold tracking-tight" style={{ color: PINK }}>
                  {totalBurned}/{exerciseTarget} <span className="text-3xl font-medium">KCAL</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-700"
                style={{ background: 'linear-gradient(135deg,#2C2C2E 0%,#1C1C1E 100%)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" fill="none" stroke={PINK} strokeWidth="2" />
                  <path d="M8 12h8M12 8v8" stroke={PINK} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Hourly bar chart */}
            {(() => {
              const buckets = Array(24).fill(0);
              exercises.forEach(e => {
                if (e.created_date) {
                  const hr = new Date(e.created_date).getHours();
                  buckets[hr] += e.calories_burned || 0;
                }
              });
              const maxVal = Math.max(...buckets, 1);
              return (
                <div>
                  <span className="text-sm" style={{ color: '#8E8E93' }}>{Math.round(exerciseTarget / 4)} KCAL</span>
                  <div className="relative mt-1">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-full" style={{
                          height: 1,
                          backgroundImage: `linear-gradient(to right, ${PINK} 50%, transparent 50%)`,
                          backgroundSize: '4px 1px', backgroundRepeat: 'repeat-x',
                          opacity: i === 2 ? 1 : 0.3,
                        }} />
                      ))}
                    </div>
                    <div className="flex items-end justify-between relative" style={{ height: 80, zIndex: 1 }}>
                      {buckets.map((v, i) => (
                        <div key={i} className="flex-1 mx-px flex items-end" style={{ height: '100%' }}>
                          {v > 0 ? (
                            <div style={{
                              width: '100%', maxWidth: 4,
                              height: `${Math.max(4, (v / maxVal) * 100)}%`,
                              background: PINK, borderRadius: '1px 1px 0 0', margin: '0 auto',
                            }} />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm" style={{ color: '#8E8E93' }}>
                    <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span>
                  </div>
                </div>
              );
            })()}

            <p className="text-lg font-medium tracking-wide mt-4" style={{ color: PINK }}>
              TOTAL {totalBurned} KCAL
            </p>
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