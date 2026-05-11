import React, { useState } from 'react';
import CalorieCard from './CalorieCard';
import MacroCard from './MacroCard';

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
    // Slide 1: Macros on top, Calorie card below
    <div key="s1" className="min-w-full px-5 space-y-3">
      <div className="flex gap-3">
        <MacroCard value={Math.max(0, proteinLeft)} label="Protein left" emoji="" progress={consumed.protein ? (consumed.protein / (profile.protein_target || 191)) * 100 : 0} />
        <MacroCard value={Math.max(0, carbsLeft)} label="Carbs left" emoji="" progress={consumed.carbs ? (consumed.carbs / (profile.carbs_target || 438)) * 100 : 0} />
        <MacroCard value={Math.max(0, fatLeft)} label="Fat left" emoji="" progress={consumed.fat ? (consumed.fat / (profile.fat_target || 93)) * 100 : 0} />
      </div>
      <CalorieCard
        caloriesLeft={caloriesLeft}
        caloriesTarget={profile.calorie_target || 2500}
        caloriesConsumed={consumed.calories || 0}
      />
    </div>,
    // Slide 2: Micro macros + Health Score
    <div key="s2" className="min-w-full px-5 space-y-3">
      <div className="flex gap-3">
        <MacroCard value={Math.max(0, fiberLeft)} label="Fiber left" emoji="🍆" progress={consumed.fiber ? (consumed.fiber / (profile.fiber_target || 38)) * 100 : 0} />
        <MacroCard value={Math.max(0, sugarLeft)} label="Sugar left" emoji="🍬" progress={consumed.sugar ? (consumed.sugar / (profile.sugar_target || 118)) * 100 : 0} />
        <MacroCard value={Math.max(0, sodiumLeft)} unit="mg" label="Sodium left" emoji="🍜" progress={consumed.sodium ? (consumed.sodium / (profile.sodium_target || 2300)) * 100 : 0} />
      </div>
      {(() => {
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
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-foreground">Health Score</span>
              <span className="text-base font-bold" style={{ color: scoreColor }}>
                {healthScore !== null ? `${healthScore}/100` : 'N/A'}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${healthScore || 0}%`, background: scoreColor }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {healthScore !== null ? `Based on today's calories and protein intake.` : 'Track a few foods to generate your health score for today.'}
            </p>
          </div>
        );
      })()}
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
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-foreground scale-125' : 'bg-muted-foreground/30'}`}
          />
        ))}
      </div>
    </div>
  );
}