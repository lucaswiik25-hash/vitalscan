import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '☕', targetFraction: 0.25 },
  { key: 'lunch',     label: 'Lunch',     emoji: '🍜', targetFraction: 0.35 },
  { key: 'dinner',    label: 'Dinner',    emoji: '🥗', targetFraction: 0.30 },
  { key: 'snack',     label: 'Snack',     emoji: '🍎', targetFraction: 0.10 },
];

function MealSlotRow({ meal, items, target, onAdd }) {
  const eaten = items.reduce((s, m) => s + Math.round(m.calories || 0), 0);
  const { display, animClass } = useAnimatedCounter(eaten);
  const [flash, setFlash] = useState(false);
  const prevEaten = React.useRef(eaten);

  useEffect(() => {
    if (eaten > prevEaten.current && prevEaten.current >= 0) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      prevEaten.current = eaten;
      return () => clearTimeout(t);
    }
    prevEaten.current = eaten;
  }, [eaten]);

  return (
    <div
      className={`flex items-center px-4 py-4 gap-4 transition-colors ${flash ? 'meal-slot-flash' : ''}`}
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-2xl"
        style={{ border: '3px solid #e5e7eb' }}>
        {meal.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-base font-bold text-gray-900">{meal.label}</span>
          <span className="text-base text-gray-500">→</span>
        </div>
        <p className="text-sm text-gray-400 overflow-hidden">
          <span className={`inline-block ${animClass}`}>{display}</span> / {target} kcal
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(e); }}
        className="press-scale w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center shrink-0"
      >
        <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function MealSlotsModule({ todayMeals = [], profile = {} }) {
  const navigate = useNavigate();
  const totalCalTarget = profile.calorie_target || 2000;

  return (
    <div className="mx-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-gray-900">Nutrition</h2>
        <button onClick={() => navigate('/scanner')} className="text-sm font-semibold text-green-600">More</button>
      </div>

      <div className="bg-white rounded-[20px] overflow-hidden glow-card">
        {MEALS.map((meal, idx) => {
          const items = todayMeals.filter(m => (m.meal_type || 'snack') === meal.key);
          const target = Math.round(totalCalTarget * meal.targetFraction);

          return (
            <React.Fragment key={meal.key}>
              {idx > 0 && <div className="h-px bg-gray-100 mx-4" />}
              <MealSlotRow
                meal={meal}
                items={items}
                target={target}
                onAdd={(e) => { e.stopPropagation(); navigate('/food-scanner'); }}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}