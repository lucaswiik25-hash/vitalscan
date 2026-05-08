import React, { useState } from 'react';
import CalorieCard from './CalorieCard';
import MacroCard from './MacroCard';
import { Heart, Droplets } from 'lucide-react';

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
    // Slide 1: Calories + main macros
    <div key="s1" className="min-w-full px-5 space-y-3">
      <CalorieCard
        caloriesLeft={caloriesLeft}
        caloriesTarget={profile.calorie_target || 2500}
        caloriesConsumed={consumed.calories || 0}
      />
      <div className="flex gap-3">
        <MacroCard value={Math.max(0, proteinLeft)} label="Protein left" emoji="🍖" progress={consumed.protein ? (consumed.protein / (profile.protein_target || 191)) * 100 : 0} />
        <MacroCard value={Math.max(0, carbsLeft)} label="Carbs left" emoji="🌾" progress={consumed.carbs ? (consumed.carbs / (profile.carbs_target || 438)) * 100 : 0} />
        <MacroCard value={Math.max(0, fatLeft)} label="Fat left" emoji="🫒" progress={consumed.fat ? (consumed.fat / (profile.fat_target || 93)) * 100 : 0} />
      </div>
    </div>,
    // Slide 2: Micro macros + Health Score
    <div key="s2" className="min-w-full px-5 space-y-3">
      <div className="flex gap-3">
        <MacroCard value={Math.max(0, fiberLeft)} label="Fiber left" emoji="🍆" progress={consumed.fiber ? (consumed.fiber / (profile.fiber_target || 38)) * 100 : 0} />
        <MacroCard value={Math.max(0, sugarLeft)} label="Sugar left" emoji="🍬" progress={consumed.sugar ? (consumed.sugar / (profile.sugar_target || 118)) * 100 : 0} />
        <MacroCard value={Math.max(0, sodiumLeft)} unit="mg" label="Sodium left" emoji="🍜" progress={consumed.sodium ? (consumed.sodium / (profile.sodium_target || 2300)) * 100 : 0} />
      </div>
      <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold text-foreground">Health Score</span>
          <span className="text-base font-bold text-muted-foreground">N/A</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted-foreground/20 rounded-full" style={{ width: '0%' }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Track a few foods to generate your health score for today. Your score reflects nutritional content and how processed your meals are.</p>
      </div>
    </div>,
    // Slide 3: Sodium + Connect Apple Health + Water
    <div key="s3" className="min-w-full px-5 space-y-3">
      <div className="flex gap-3">
        <MacroCard value={Math.max(0, sodiumLeft)} unit="mg" label="Sodium left" emoji="🍜" progress={consumed.sodium ? (consumed.sodium / (profile.sodium_target || 2300)) * 100 : 0} />
        <div className="bg-white border border-border rounded-[20px] p-4 flex flex-col items-center shadow-sm flex-1">
          <span className="text-3xl mb-1">❤️</span>
          <span className="text-sm font-semibold text-foreground text-center">Connect Apple Health</span>
          <span className="text-xs text-muted-foreground text-center mt-0.5">Track your steps</span>
          <button className="mt-2 bg-foreground text-white text-xs font-semibold px-4 py-1.5 rounded-full">Connect</button>
        </div>
      </div>
      <div className="bg-white border border-border rounded-[20px] p-4 flex items-center gap-3 shadow-sm">
        <span className="text-2xl">🥤</span>
        <div>
          <span className="text-sm text-muted-foreground">Water</span>
          <p className="text-lg font-bold text-foreground">0 ml</p>
        </div>
      </div>
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
              if (diff > 50 && currentSlide < 2) setCurrentSlide(c => c + 1);
              if (diff < -50 && currentSlide > 0) setCurrentSlide(c => c - 1);
              document.removeEventListener('touchend', handleEnd);
            };
            document.addEventListener('touchend', handleEnd);
          }}
        >
          {slides}
        </div>
      </div>
      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentSlide ? 'bg-foreground scale-125' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}