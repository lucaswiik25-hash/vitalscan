import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const MEAL_COUNTS = [2, 3, 4, 5, 6];
const STORAGE_KEY = 'scanly_meal_plan';
const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function MealPlanner() {
  const [mealCount, setMealCount] = useState(3);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};

  // Load saved plan on mount, clear if from a different day
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.date === TODAY) {
        setPlan(saved.plan);
        setMealCount(saved.mealCount || 3);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  const generatePlan = async () => {
    setLoading(true);

    const mealNames = {
      2: ['Breakfast', 'Dinner'],
      3: ['Breakfast', 'Lunch', 'Dinner'],
      4: ['Breakfast', 'Lunch', 'Afternoon Snack', 'Dinner'],
      5: ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner'],
      6: ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack'],
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional nutritionist. Create a complete one-day meal plan for this user.

DIET MODE: ${profile.diet_mode || 'standard'}. Build the ENTIRE day's meals strictly around the rules and principles of this diet. Every meal must comply with ${profile.diet_mode || 'standard'} diet rules.${profile.diet_mode === 'appearance_mode' ? ' Focus on anti-inflammatory, collagen-supporting, low-bloat meals that balance sodium and potassium.' : ''}

User profile:
- Name: ${profile.name}
- Age: ${profile.age}, Sex: ${profile.sex}
- Weight: ${profile.weight}kg, Height: ${profile.height}cm
- Diet: ${profile.diet_mode || 'standard'}
- Goal: ${profile.goal}
- Activity: ${profile.activity_level}
- Daily calorie target: ${profile.calorie_target} kcal
- Protein target: ${profile.protein_target}g
- Carbs target: ${profile.carbs_target}g
- Fat target: ${profile.fat_target}g
- Allergens to avoid: ${(profile.allergens || []).join(', ') || 'none'}
- Number of meals: ${mealCount} meals named: ${mealNames[mealCount].join(', ')}

Generate ${mealCount} meals. Strictly respect the diet type (${profile.diet_mode}). Make meals realistic, delicious, and achievable at home.
For each meal provide: name, description (1-2 sentences), ingredients (list), calories, protein, carbs, fat, prep_time${profile.diet_mode === 'appearance_mode' ? ', bloat_risk ("Low"/"Medium"/"High")' : ''}.`,
      response_json_schema: {
        type: 'object',
        properties: {
          meals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                meal_type: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                ingredients: { type: 'array', items: { type: 'string' } },
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fat: { type: 'number' },
                prep_time: { type: 'string' },
              },
            },
          },
          total_calories: { type: 'number' },
          total_protein: { type: 'number' },
          notes: { type: 'string' },
        },
      },
    });

    setPlan(result);
    setExpanded({});
    // Persist to localStorage for the day
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: TODAY, plan: result, mealCount }));
    setLoading(false);
  };

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Meal Planner</h1>
        <p className="text-sm text-muted-foreground mt-0.5">AI-generated meals for your diet & goals</p>
      </div>

      <div className="px-5 space-y-4">
        {/* Meal count selector */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">How many meals per day?</p>
          <div className="flex gap-2">
            {MEAL_COUNTS.map(n => (
              <button key={n} onClick={() => setMealCount(n)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: mealCount === n ? '#1a1a1a' : 'hsl(var(--secondary))', color: mealCount === n ? 'white' : 'hsl(var(--foreground))' }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Diet info */}
        {profile.diet_mode && profile.diet_mode !== 'none' && (
          <div className="bg-secondary/50 border border-border rounded-[20px] px-4 py-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Diet mode active:</span>
            <span className="text-xs font-bold text-foreground capitalize">{profile.diet_mode?.replace(/_/g, ' ')}</span>
          </div>
        )}

        {/* Generate button */}
        <button onClick={generatePlan} disabled={loading}
          className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating your plan...</>
            : plan
              ? <><RefreshCw className="w-5 h-5" /> Regenerate Plan</>
              : <><Sparkles className="w-5 h-5" /> Generate Today's Meals</>
          }
        </button>

        {/* Plan */}
        {plan && (
          <>
            <div className="flex gap-3">
              <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
                <p className="text-2xl font-extrabold text-foreground">{plan.total_calories}</p>
                <p className="text-xs text-muted-foreground">Total kcal</p>
              </div>
              <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
                <p className="text-2xl font-extrabold text-foreground">{plan.total_protein}g</p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
                <p className="text-xs text-muted-foreground">Generated for</p>
                <p className="text-xs font-bold text-foreground mt-0.5">Today</p>
              </div>
            </div>

            {plan.notes && (
              <div className="bg-secondary/40 border border-border rounded-[20px] px-4 py-3">
                <p className="text-xs text-muted-foreground">{plan.notes}</p>
              </div>
            )}

            <div className="space-y-3">
              {(plan.meals || []).map((meal, i) => (
                <div key={i} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
                  <button onClick={() => toggleExpand(i)} className="w-full text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{meal.meal_type}</p>
                        <h3 className="text-base font-bold text-foreground mt-0.5">{meal.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{meal.calories} kcal · {meal.prep_time}</p>
                      </div>
                      {expanded[i] ? <ChevronUp className="w-4 h-4 text-muted-foreground mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" />}
                    </div>
                  </button>
                  {expanded[i] && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <p className="text-sm text-muted-foreground">{meal.description}</p>
                      <div className="flex gap-3">
                        {[['Protein', `${meal.protein}g`], ['Carbs', `${meal.carbs}g`], ['Fat', `${meal.fat}g`]].map(([l, v]) => (
                          <div key={l} className="flex-1 bg-secondary rounded-xl p-2 text-center">
                            <p className="text-sm font-bold text-foreground">{v}</p>
                            <p className="text-xs text-muted-foreground">{l}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Ingredients</p>
                        <ul className="space-y-0.5">
                          {(meal.ingredients || []).map((ing, j) => (
                            <li key={j} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}