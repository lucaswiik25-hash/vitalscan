import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '☕', targetFraction: 0.25 },
  { key: 'lunch',     label: 'Lunch',     emoji: '🍜', targetFraction: 0.35 },
  { key: 'dinner',    label: 'Dinner',    emoji: '🥗', targetFraction: 0.30 },
  { key: 'snack',     label: 'Snack',     emoji: '🍎', targetFraction: 0.10 },
];

function MealDetailPanel({ meal, items, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`bottom-sheet-backdrop absolute inset-0 bg-black/40 backdrop-blur-sm ${visible ? 'is-visible' : ''}`}
        onClick={onClose}
      />
      <div
        className={`bottom-sheet-panel absolute left-0 right-0 bottom-0 bg-white flex flex-col overflow-hidden ${visible ? 'is-visible' : ''}`}
        style={{ top: 0, borderRadius: '24px 24px 0 0' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-start justify-between px-6 pt-3 pb-4 shrink-0 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meal.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{meal.label}</h2>
              <p className="text-sm text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">{meal.emoji}</p>
              <p className="text-gray-400 text-sm">Nothing logged for {meal.label.toLowerCase()} yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-4 rounded-[16px] bg-gray-50">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                      <span className="text-xl">{meal.emoji}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.time || ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-gray-900">{Math.round(item.calories || 0)}</p>
                    <p className="text-[10px] text-gray-400">kcal</p>
                  </div>
                </div>
              ))}
              {/* Totals */}
              <div className="mt-4 p-4 rounded-[16px] bg-gray-900 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-black">{items.reduce((s, m) => s + Math.round(m.calories || 0), 0)} kcal</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-white/60">
                  <span>P: {items.reduce((s, m) => s + Math.round(m.protein || 0), 0)}g</span>
                  <span>C: {items.reduce((s, m) => s + Math.round(m.carbs || 0), 0)}g</span>
                  <span>F: {items.reduce((s, m) => s + Math.round(m.fat || 0), 0)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MealSlotRow({ meal, items, target, onOpen, onAdd }) {
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
      className={`flex items-center px-4 py-4 gap-4 active:bg-gray-50 transition-colors cursor-pointer ${flash ? 'meal-slot-flash' : ''}`}
      onClick={onOpen}
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
  const [openMeal, setOpenMeal] = useState(null);
  const totalCalTarget = profile.calorie_target || 2000;

  return (
    <>
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
                  onOpen={() => setOpenMeal(meal)}
                  onAdd={(e) => { e.stopPropagation(); navigate('/food-scanner'); }}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {openMeal && (
        <MealDetailPanel
          meal={openMeal}
          items={todayMeals.filter(m => (m.meal_type || 'snack') === openMeal.key)}
          onClose={() => setOpenMeal(null)}
        />
      )}
    </>
  );
}