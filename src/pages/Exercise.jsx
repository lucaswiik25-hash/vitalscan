import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { listExerciseLogs, createExerciseLog, getProfileList } from '@/lib/db';

const QUICK_EXERCISES = [
  { name: 'Running', kcalRange: '600–900 Kcal Per Hour', met: 9.8, category: 'cardio' },
  { name: 'Weight Training', kcalRange: '180–600 Kcal Per Hour', met: 5.0, category: 'strength' },
  { name: 'Cycling', kcalRange: '400–800 Kcal Per Hour', met: 7.5, category: 'cardio' },
  { name: 'Swimming', kcalRange: '400–700 Kcal Per Hour', met: 8.0, category: 'cardio' },
  { name: 'HIIT', kcalRange: '500–900 Kcal Per Hour', met: 10.0, category: 'cardio' },
];

function calcCalories(met, weight, minutes) {
  return Math.round((met * weight * minutes) / 60);
}

export default function Exercise() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showLog, setShowLog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [duration, setDuration] = useState(30);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => getProfileList() });
  const profile = profiles[0] || {};
  const weight = profile.weight || 70;

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises', today],
    queryFn: () => listExerciseLogs({ date: today }),
  });

  const totalBurned = exercises.reduce((s, e) => s + (e.calories_burned || 0), 0);
  const goal = 600;
  const percent = Math.min(100, Math.round((totalBurned / goal) * 100));
  const remaining = Math.max(0, goal - totalBurned);

  const handleAdd = async (ex) => {
    const cal = calcCalories(ex.met, weight, duration);
    await createExerciseLog({
      name: ex.name,
      date: today,
      duration_minutes: duration,
      calories_burned: cal,
      category: ex.category,
      intensity: 'medium',
    });
    queryClient.invalidateQueries({ queryKey: ['exercises', today] });
    setShowLog(false);
    setSelectedExercise(null);
  };

  const openLog = (ex) => {
    setSelectedExercise(ex);
    setShowLog(true);
  };

  return (
    <div
      className="min-h-screen pb-32 flex flex-col font-[Inter,ui-sans-serif,system-ui,-apple-system,sans-serif]"
      style={{
        background: 'radial-gradient(circle at 10% 0%, rgba(255,228,155,.28), transparent 27rem), radial-gradient(circle at 92% 8%, rgba(182,164,255,.25), transparent 29rem), #f6f5f8',
      }}
    >
      {/* Hero card */}
      <div className="mx-4 mt-6 rounded-[30px] bg-white/80 p-6 shadow-[0_24px_70px_rgba(20,20,25,.08)] backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[28px] font-extrabold text-[#101114] leading-none">Today's Burn</h1>
          <span className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-[#e9e2ff] px-3.5 text-sm font-black text-[#322b58]">Daily Goal: {goal} kcal</span>
        </div>

        {/* Big percent */}
        <div className="flex items-center justify-center my-6 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-none" style={{ background: '#ffe49b', filter: 'blur(60px)', opacity: 0.5 }} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-none" style={{ background: '#b6a4ff', filter: 'blur(60px)', opacity: 0.5 }} />
          <span className="text-[88px] font-extrabold leading-none text-[#101114] relative z-10">{percent}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full bg-[#eceaf1] overflow-hidden mb-6">
          <div className="h-full rounded-full bg-[#b6a4ff] transition-all duration-700" style={{ width: `${percent}%` }} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Exercises', value: exercises.length, unit: '' },
            { label: 'Burned', value: totalBurned, unit: ' kcal' },
            { label: 'Remaining', value: remaining, unit: ' kcal' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="rounded-[20px] bg-[#f1f0f4] p-3 text-center">
              <p className="text-[11px] text-[#6d7079] mb-1">{label}</p>
              <p className="text-2xl font-extrabold text-[#101114] leading-none">{value}<span className="text-xs font-medium">{unit}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add section */}
      <div className="flex-1 px-4 pt-6">
        <p className="text-xs font-extrabold uppercase tracking-[.08em] text-[#6d7079] mb-4 ml-1">Quick Add</p>
        <div className="flex flex-col items-center gap-3">
          {QUICK_EXERCISES.map((ex, i) => {
            const opacity = 1 - i * 0.18;
            const widthPct = 100 - i * 8;
            const height = 72 - i * 8;
            return (
              <motion.button
                key={ex.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                onClick={() => openLog(ex)}
                className="flex items-center justify-between px-5 cursor-pointer"
                style={{
                  width: `${widthPct}%`,
                  height,
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: 50,
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 4px 16px rgba(20,20,25,.07)',
                  opacity,
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-extrabold text-[#101114]" style={{ fontSize: Math.max(14, 18 - i * 1.5) }}>{ex.name}</span>
                  <span className="text-[#6d7079] font-normal" style={{ fontSize: Math.max(10, 13 - i * 1) }}>Approx {ex.kcalRange}</span>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#121316] text-white font-black text-lg">+</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Log sheet */}
      {showLog && selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLog(false)} />
          <div className="relative rounded-t-[32px] w-full p-6 pb-12 bg-white/90 backdrop-blur-2xl shadow-[0_-8px_40px_rgba(20,20,25,.12)]">
            <div className="w-10 h-1 rounded-full bg-[#dfdce5] mx-auto mb-6" />
            <h2 className="text-2xl font-extrabold text-[#101114] mb-1">{selectedExercise.name}</h2>
            <p className="text-sm text-[#6d7079] mb-5">{selectedExercise.kcalRange}</p>
            <label className="text-xs font-extrabold text-[#6d7079] uppercase tracking-[.08em] mb-2 block">Duration: {duration} min</label>
            <input type="range" min="5" max="120" step="5" value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full mb-4" style={{ accentColor: '#121316' }} />
            <div className="rounded-[20px] bg-[#f1f0f4] p-4 text-center mb-6">
              <p className="text-xs text-[#6d7079] mb-1">Estimated Calories</p>
              <p className="text-4xl font-black text-[#101114]">{calcCalories(selectedExercise.met, weight, duration)} <span className="text-base font-medium">kcal</span></p>
            </div>
            <button onClick={() => handleAdd(selectedExercise)}
              className="w-full min-h-[54px] rounded-full bg-[#121316] text-white font-extrabold text-base shadow-[0_16px_36px_rgba(18,19,22,.18)]">
              Log Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}