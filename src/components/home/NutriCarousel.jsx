import React, { useState } from 'react';

// Liquid glass card style
const glassStyle = {
  background: 'rgba(255,255,255,0.60)',
  backdropFilter: 'blur(24px) saturate(200%)',
  WebkitBackdropFilter: 'blur(24px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: '0 6px 28px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,1)',
};

function GlassMacroCard({ value, unit = 'g', label, progress }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className="flex-1 rounded-[22px] p-4 flex flex-col gap-3" style={glassStyle}>
      <p className="text-xs font-semibold text-foreground/50 leading-none">{label}</p>
      <p className="text-3xl font-extrabold text-foreground leading-none">{Math.max(0, Math.round(value))}<span className="text-sm font-semibold text-foreground/50 ml-0.5">{unit}</span></p>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct >= 90 ? '#F47C7C' : pct >= 60 ? '#F5C842' : '#6CC5A0' }} />
      </div>
    </div>
  );
}

function GlassCalorieCard({ caloriesLeft, caloriesTarget, caloriesConsumed }) {
  const pct = caloriesTarget > 0 ? Math.min(100, (caloriesConsumed / caloriesTarget) * 100) : 0;
  const color = pct >= 100 ? '#F47C7C' : pct >= 70 ? '#F5C842' : '#6CC5A0';
  return (
    <div className="rounded-[22px] p-5" style={glassStyle}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground/50">Calories left</p>
          <p className="text-5xl font-extrabold text-foreground leading-none mt-1">{Math.max(0, Math.round(caloriesLeft))}<span className="text-lg font-semibold text-foreground/40 ml-1">kcal</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/40">of {caloriesTarget}</p>
          <p className="text-2xl font-bold" style={{ color }}>{Math.round(pct)}%</p>
        </div>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function GlassHealthScore({ consumed, profile }) {
  const cal = consumed.calories || 0;
  const calTarget = profile.calorie_target || 2000;
  const prot = consumed.protein || 0;
  const protTarget = profile.protein_target || 150;
  const hasMeals = cal > 0;
  const calScore = hasMeals ? Math.min(100, Math.max(0, 100 - Math.abs(cal - calTarget) / calTarget * 100)) : 0;
  const protScore = hasMeals ? Math.min(100, prot / protTarget * 100) : 0;
  const healthScore = hasMeals ? Math.round(calScore * 0.6 + protScore * 0.4) : null;
  const scoreColor = healthScore === null ? '#aaa' : healthScore >= 75 ? '#6CC5A0' : healthScore >= 45 ? '#F5C842' : '#F47C7C';
  return (
    <div className="rounded-[18px] p-4" style={glassStyle}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-foreground">Health Score</span>
        <span className="text-base font-extrabold" style={{ color: scoreColor }}>
          {healthScore !== null ? `${healthScore}/100` : 'N/A'}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${healthScore || 0}%`, background: scoreColor }} />
      </div>
      <p className="text-[10px] text-foreground/50 mt-2">
        {healthScore !== null ? 'Based on calories & protein' : 'Log food to see your score'}
      </p>
    </div>
  );
}

export default function NutriCarousel({ profile = {}, consumed = {} }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const caloriesLeft = (profile.calorie_target || 2500) - (consumed.calories || 0);
  const proteinLeft = (profile.protein_target || 191) - (consumed.protein || 0);
  const carbsLeft = (profile.carbs_target || 438) - (consumed.carbs || 0);
  const fatLeft = (profile.fat_target || 93) - (consumed.fat || 0);
  const fiberLeft = (profile.fiber_target || 38) - (consumed.fiber || 0);
  const sugarLeft = (profile.sugar_target || 118) - (consumed.sugar || 0);
  const sodiumLeft = (profile.sodium_target || 2300) - (consumed.sodium || 0);

  const slides = [
    <div key="s1" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={Math.max(0, proteinLeft)} label="Protein left" progress={consumed.protein ? (consumed.protein / (profile.protein_target || 191)) * 100 : 0} />
        <GlassMacroCard value={Math.max(0, carbsLeft)} label="Carbs left" progress={consumed.carbs ? (consumed.carbs / (profile.carbs_target || 438)) * 100 : 0} />
        <GlassMacroCard value={Math.max(0, fatLeft)} label="Fat left" progress={consumed.fat ? (consumed.fat / (profile.fat_target || 93)) * 100 : 0} />
      </div>
      <GlassCalorieCard caloriesLeft={caloriesLeft} caloriesTarget={profile.calorie_target || 2500} caloriesConsumed={consumed.calories || 0} />
    </div>,
    <div key="s2" className="min-w-full px-5 space-y-3">
      <div className="flex gap-2">
        <GlassMacroCard value={Math.max(0, fiberLeft)} label="Fiber left" progress={consumed.fiber ? (consumed.fiber / (profile.fiber_target || 38)) * 100 : 0} />
        <GlassMacroCard value={Math.max(0, sugarLeft)} label="Sugar left" progress={consumed.sugar ? (consumed.sugar / (profile.sugar_target || 118)) * 100 : 0} />
        <GlassMacroCard value={Math.max(0, sodiumLeft)} unit="mg" label="Sodium left" progress={consumed.sodium ? (consumed.sodium / (profile.sodium_target || 2300)) * 100 : 0} />
      </div>
      <GlassHealthScore consumed={consumed} profile={profile} />
    </div>,
  ];

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const handleEnd = (ev) => {
              const diff = startX - ev.changedTouches[0].clientX;
              if (diff > 50 && currentSlide < slides.length - 1) setCurrentSlide(c => c + 1);
              if (diff < -50 && currentSlide > 0) setCurrentSlide(c => c - 1);
              document.removeEventListener('touchend', handleEnd);
            };
            document.addEventListener('touchend', handleEnd);
          }}
        >
          {slides}
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrentSlide(i)}
            className="rounded-full transition-all"
            style={{ width: i === currentSlide ? 16 : 6, height: 6, background: i === currentSlide ? '#1a1a1a' : 'rgba(0,0,0,0.15)' }}
          />
        ))}
      </div>
    </div>
  );
}