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
    <div className="min-h-screen pb-32 flex flex-col">
      {/* Top White Card — fills top corners flush */}
      <div
        className="w-full flex flex-col pt-14 px-6 pb-8 relative shrink-0"
        style={{
          background: '#fff',
          borderRadius: '0 0 48px 48px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 12.5L14 4L24 12.5V24H17.5V18H10.5V24H4V12.5Z" stroke="#111" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
            </svg>
          </button>
          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-base font-bold text-black">AI</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-black opacity-10 mb-6" />

        {/* Todays Burn row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-bold text-black tracking-tight">Todays Burn</span>
          <button className="bg-black rounded-full px-5 h-7 flex items-center justify-center">
            <span className="text-sm font-bold text-white">Log</span>
          </button>
        </div>

        {/* 70% big text — centered */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-14 pointer-events-none" style={{ background: '#ea234b', filter: 'blur(60px)' }} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full opacity-15 pointer-events-none" style={{ background: '#0095ff', filter: 'blur(60px)' }} />
          <div className="relative text-center">
            <span className="text-[88px] font-bold leading-none tracking-tight text-black" style={{ color: '#c1d5e1', position: 'absolute', top: 0, left: 4, zIndex: 0 }}>
              {percent}%
            </span>
            <span className="text-[88px] font-bold leading-none tracking-tight text-black relative z-10">
              {percent}%
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-end justify-between pt-2">
          <div className="flex flex-col items-center">
            <span className="text-base font-medium text-black tracking-tight">Exercises</span>
            <span className="text-3xl font-light text-black">{exercises.length}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-medium text-black tracking-tight">Burned</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light text-black">{totalBurned}</span>
              <span className="text-sm font-medium text-black">Kcal</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-medium text-black tracking-tight">Remaining</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light text-black">{remaining}</span>
              <span className="text-sm font-medium text-black">Kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add section */}
      <div className="flex-1 px-4 pt-5">
        <h3 className="text-xl font-bold text-black mb-4 ml-2">Quick Add</h3>

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
                  background: 'linear-gradient(90deg, #fff 20%, #d5d2d2 100%)',
                  borderRadius: 50,
                  border: '3px solid #fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  opacity,
                }}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-black" style={{ fontSize: Math.max(14, 18 - i * 1.5) }}>
                    {ex.name}
                  </span>
                  <span className="text-black font-light" style={{ fontSize: Math.max(10, 13 - i * 1), opacity: 0.45 }}>
                    Approx {ex.kcalRange}
                  </span>
                </div>
                <span className="text-black font-medium" style={{ fontSize: 28 - i * 2 }}>+</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Log sheet */}
      {showLog && selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLog(false)} />
          <div className="relative bg-white rounded-t-[32px] w-full p-6 pb-12">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedExercise.name}</h2>
            <p className="text-sm text-gray-400 mb-5">{selectedExercise.kcalRange}</p>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Duration: {duration} min
            </label>
            <input type="range" min="5" max="120" step="5" value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full accent-gray-900 mb-4" />
            <div className="rounded-2xl bg-gray-50 p-4 text-center mb-6">
              <p className="text-xs text-gray-400 mb-1">Estimated Calories</p>
              <p className="text-3xl font-black text-gray-900">{calcCalories(selectedExercise.met, weight, duration)} kcal</p>
            </div>
            <button
              onClick={() => handleAdd(selectedExercise)}
              className="w-full h-14 rounded-full bg-gray-900 text-white font-semibold text-base"
            >
              Log Exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}