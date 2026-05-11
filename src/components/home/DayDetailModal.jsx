import React from 'react';
import { X, Droplets } from 'lucide-react';
import { format } from 'date-fns';

function calcHealthScore(meals, profile, waterLogs) {
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

export default function DayDetailModal({ date, meals, waterLogs, profile, onClose }) {
  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProt = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat || 0), 0);
  const totalWater = waterLogs.reduce((s, w) => s + (w.amount_ml || 0), 0);
  const score = calcHealthScore(meals, profile, waterLogs);
  const scoreColor = score === null ? '#aaa' : score >= 75 ? '#6CC5A0' : score >= 45 ? '#F5C842' : '#F47C7C';

  const formattedDate = format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] px-5 pt-6 pb-10 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">History</p>
            <h2 className="text-lg font-bold text-foreground">{formattedDate}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2 mb-4 shrink-0">
          {[
            { label: 'Calories', value: totalCal, unit: 'kcal' },
            { label: 'Protein', value: `${totalProt}g`, unit: '' },
            { label: 'Water', value: `${totalWater}ml`, unit: '' },
            { label: 'Score', value: score !== null ? score : '—', unit: '', color: scoreColor },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="bg-secondary rounded-2xl p-3 text-center">
              <p className="text-sm font-extrabold" style={{ color: color || 'hsl(var(--foreground))' }}>{value}{unit}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Macro bar */}
        {meals.length > 0 && (
          <div className="bg-secondary/50 rounded-2xl p-3 mb-4 shrink-0">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Carbs {totalCarbs}g</span>
              <span>Fat {totalFat}g</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
              {totalProt + totalCarbs + totalFat > 0 && <>
                <div style={{ width: `${totalProt / (totalProt + totalCarbs + totalFat) * 100}%`, background: '#6CC5A0' }} className="h-full" />
                <div style={{ width: `${totalCarbs / (totalProt + totalCarbs + totalFat) * 100}%`, background: '#F5C842' }} className="h-full" />
                <div style={{ width: `${totalFat / (totalProt + totalCarbs + totalFat) * 100}%`, background: '#F47C7C' }} className="h-full" />
              </>}
            </div>
          </div>
        )}

        {/* Meals list */}
        <div className="overflow-y-auto flex-1">
          {meals.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm">No meals logged on this day.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Meals ({meals.length})</p>
              {meals.map((meal, i) => (
                <div key={i} className="flex items-center gap-3 bg-secondary/40 rounded-2xl p-3">
                  {meal.image_url
                    ? <img src={meal.image_url} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-base shrink-0">🍽️</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">{meal.calories} kcal · {meal.protein}g protein</p>
                  </div>
                  {meal.time && <p className="text-xs text-muted-foreground shrink-0">{meal.time}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}