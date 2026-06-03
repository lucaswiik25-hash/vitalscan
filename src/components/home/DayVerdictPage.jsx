import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Droplets, Flame, Zap, Activity } from 'lucide-react';
import { format } from 'date-fns';

function calcScore(meals, profile, waterLogs) {
  if (meals.length === 0) return null;
  const cal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const prot = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const calTarget = profile.calorie_target || 2000;
  const protTarget = profile.protein_target || 150;
  const waterTarget = profile.water_target_ml || 2000;
  const water = waterLogs.reduce((s, w) => s + (w.amount_ml || 0), 0);
  const calScore = Math.min(100, Math.max(0, 100 - Math.abs(cal - calTarget) / calTarget * 100));
  const protScore = Math.min(100, prot / protTarget * 100);
  const waterScore = Math.min(100, water / waterTarget * 100);
  const mealScore = Math.min(100, meals.length * 20);
  return Math.round(calScore * 0.35 + protScore * 0.25 + waterScore * 0.25 + mealScore * 0.15);
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
});

export default function DayVerdictPage({ date, meals, waterLogs, profile, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProt = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0);
  const totalFiber = meals.reduce((s, m) => s + (m.fiber || 0), 0);
  const totalSugar = meals.reduce((s, m) => s + (m.sugar || 0), 0);
  const totalSodium = meals.reduce((s, m) => s + (m.sodium || 0), 0);
  const totalWater = waterLogs.filter(w => w.amount_ml > 0).reduce((s, w) => s + w.amount_ml, 0);
  const score = calcScore(meals, profile, waterLogs);

  const calTarget = profile.calorie_target || 2000;
  const protTarget = profile.protein_target || 150;
  const carbsTarget = profile.carbs_target || 250;
  const fatTarget = profile.fat_target || 65;
  const waterTarget = profile.water_target_ml || 2000;

  const scoreColor = score === null ? '#9ca3af' : score >= 75 ? '#6CC5A0' : score >= 45 ? '#F5C842' : '#F47C7C';
  const scoreLabel = score === null ? 'No data' : score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 45 ? 'Fair' : 'Needs Work';
  const formattedDate = format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d');
  const isAppearance = profile.diet_mode === 'appearance_mode';

  const MacroBar = ({ label, val, target, color }) => {
    const pct = target > 0 ? Math.min(100, (val / target) * 100) : 0;
    const over = val > target;
    return (
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">{label}</span>
          <span className="font-bold" style={{ color: over ? '#f97316' : '#374151' }}>{Math.round(val)}<span className="text-gray-400 font-normal">/{target}</span></span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: over ? '#f97316' : color }} />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, rgba(180,195,220,0.25) 0%, rgba(240,215,220,0.18) 40%, #ffffff 100%)', backgroundColor: '#ffffff' }}
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-lg mx-auto px-5 pt-12 pb-24">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-3 mb-6">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/80 border border-white/60 flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Daily Report</p>
            <h1 className="text-xl font-black text-gray-900">{formattedDate}</h1>
          </div>
        </motion.div>

        {/* Score hero */}
        <motion.div {...fadeUp(0.06)} className="bg-white rounded-[24px] p-6 mb-4" style={{ border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Day Score</p>
              <p className="text-6xl font-black leading-none" style={{ color: scoreColor }}>{score ?? '—'}</p>
              <p className="text-sm font-bold mt-1" style={{ color: scoreColor }}>{scoreLabel}</p>
            </div>
            <div className="relative" style={{ width: 88, height: 88 }}>
              <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={44} cy={44} r={36} fill="none" stroke="#f0f0f0" strokeWidth={8} />
                <circle cx={44} cy={44} r={36} fill="none" stroke={scoreColor} strokeWidth={8}
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - (score || 0) / 100)}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {meals.length === 0 ? (
          <motion.div {...fadeUp(0.1)} className="bg-white rounded-[24px] p-8 text-center" style={{ border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-gray-400 text-sm">No meals were logged on this day.</p>
          </motion.div>
        ) : (
          <>
            {/* Calories */}
            <motion.div {...fadeUp(0.1)} className="bg-white rounded-[24px] p-5 mb-3" style={{ border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-sm font-bold text-gray-800">Calories</p>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-black text-gray-900">{Math.round(totalCal)}</span>
                <span className="text-sm text-gray-400">/ {calTarget} kcal</span>
              </div>
              <MacroBar label="Calories" val={totalCal} target={calTarget} color="#f97316" />
              <p className="text-xs text-gray-400 mt-2">
                {totalCal < calTarget * 0.8 ? '⚠️ Under target — aim for consistent intake' :
                  totalCal > calTarget * 1.15 ? '⚠️ Above target for this day' :
                    '✅ On track with calorie goal'}
              </p>
            </motion.div>

            {/* Macros */}
            <motion.div {...fadeUp(0.16)} className="bg-white rounded-[24px] p-5 mb-3" style={{ border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-sm font-bold text-gray-800 mb-4">Macronutrients</p>
              <div className="space-y-3">
                <MacroBar label={`Protein (${Math.round(totalProt)}g)`} val={totalProt} target={protTarget} color="#3b82f6" />
                <MacroBar label={`Carbs (${Math.round(totalCarbs)}g)`} val={totalCarbs} target={carbsTarget} color="#f59e0b" />
                <MacroBar label={`Fat (${Math.round(totalFat)}g)`} val={totalFat} target={fatTarget} color="#ec4899" />
              </div>
            </motion.div>

            {/* Water */}
            <motion.div {...fadeUp(0.22)} className="bg-white rounded-[24px] p-5 mb-3" style={{ border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-gray-800">Hydration</p>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-black text-blue-500">{totalWater}</span>
                <span className="text-sm text-gray-400">/ {waterTarget} ml</span>
              </div>
              <div className="w-full h-2.5 bg-blue-50 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-400 transition-all duration-700"
                  style={{ width: `${Math.min(100, (totalWater / waterTarget) * 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {totalWater >= waterTarget ? '✅ Hydration goal met' :
                  totalWater >= waterTarget * 0.6 ? '⚡ Decent hydration — push for more' :
                    '⚠️ Low hydration — aim for at least 2L daily'}
              </p>
            </motion.div>

            {/* Micro highlights */}
            <motion.div {...fadeUp(0.28)} className="bg-white rounded-[24px] p-5 mb-3" style={{ border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-sm font-bold text-gray-800 mb-3">Micronutrient Highlights</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Fiber', val: `${Math.round(totalFiber)}g`, target: profile.fiber_target || 30, color: '#16a34a' },
                  { label: 'Sugar', val: `${Math.round(totalSugar)}g`, target: profile.sugar_target || 50, isRisk: true },
                  { label: 'Sodium', val: `${Math.round(totalSodium)}mg`, target: profile.sodium_target || 2300, isRisk: true },
                ].map(({ label, val, target, color, isRisk }) => {
                  const numVal = parseFloat(val);
                  const over = isRisk && numVal > target;
                  const c = over ? '#ef4444' : color || '#6b7280';
                  return (
                    <div key={label} className="rounded-[16px] p-3 text-center" style={{ background: over ? '#fef2f2' : '#f9fafb' }}>
                      <p className="text-xs font-black" style={{ color: c }}>{val}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                      {over && <p className="text-[9px] text-red-400 font-semibold mt-0.5">Over</p>}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Appearance mode potassium block */}
            {isAppearance && (
              <motion.div {...fadeUp(0.32)} className="rounded-[24px] p-5 mb-3" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)' }}>
                <p className="text-sm font-bold text-purple-800 mb-2">✨ Appearance Insights</p>
                <div className="space-y-2">
                  <p className="text-xs text-purple-700">
                    <strong>Sodium:</strong> {totalSodium > 2000 ? 'High sodium may cause next-day puffiness.' : 'Sodium looks controlled — good for facial definition.'}
                  </p>
                  <p className="text-xs text-purple-700">
                    <strong>Sugar:</strong> {totalSugar > 40 ? 'Elevated sugar can drive glycation and inflammation.' : 'Sugar intake is within a reasonable range.'}
                  </p>
                  <p className="text-xs text-purple-700">
                    <strong>Hydration:</strong> {totalWater >= waterTarget ? 'Good hydration supports skin elasticity.' : 'More water helps flush toxins and reduce puffiness.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Verdict */}
            <motion.div {...fadeUp(0.36)} className="rounded-[24px] p-5 mb-3" style={{ background: scoreColor + '18', border: `1.5px solid ${scoreColor}44` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: scoreColor }}>Overall Verdict</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {score === null ? 'No meals logged — start tracking to get your daily verdict.' :
                  score >= 80 ? `Great day! You hit your targets with balanced macros, solid protein, and good hydration. Keep this up.` :
                    score >= 65 ? `Decent day overall. ${totalProt < protTarget * 0.8 ? 'Protein was a bit low. ' : ''}${totalWater < waterTarget * 0.7 ? 'Hydration could be better. ' : ''}Small improvements will push your score up.` :
                      score >= 45 ? `Mixed day. ${Math.abs(totalCal - calTarget) > 400 ? 'Calories were off target. ' : ''}${totalWater < waterTarget * 0.5 ? 'Very low water intake. ' : ''}Focus on consistency tomorrow.` :
                        `Tough day — low score. Try to hit your calorie target, drink at least ${waterTarget}ml water, and log all meals for a clear picture.`
                }
              </p>
            </motion.div>

            {/* Meals list */}
            <motion.div {...fadeUp(0.42)} className="bg-white rounded-[24px] p-5" style={{ border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Meals Logged ({meals.length})</p>
              <div className="space-y-2">
                {meals.map((meal, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    {meal.image_url
                      ? <img src={meal.image_url} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                      : <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-base shrink-0">🍽️</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{meal.name}</p>
                      <p className="text-xs text-gray-400">{meal.calories} kcal · {meal.protein}g prot</p>
                    </div>
                    {meal.time && <p className="text-xs text-gray-400 shrink-0">{meal.time}</p>}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}