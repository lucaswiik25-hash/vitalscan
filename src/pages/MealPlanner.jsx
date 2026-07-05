import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { animCard, usePageVisible, pageRevealStyle } from '@/lib/animHelpers';
import { getProfileList } from '@/lib/db';
import { invokeLLM } from '@/lib/ai';

const MEAL_COUNTS = [2, 3, 4, 5, 6];
const STORAGE_KEY = 'scanly_meal_plan';
const TODAY = format(new Date(), 'yyyy-MM-dd');

const DIET_LABELS = {
  none: 'No restrictions', standard: 'Standard', calorie_deficit: 'Calorie Deficit',
  high_protein: 'High Protein', keto: 'Ketogenic', carnivore: 'Carnivore',
  vegan: 'Vegan', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian',
  gluten_free: 'Gluten Free', dairy_free: 'Dairy Free', paleo: 'Paleo',
  mediterranean: 'Mediterranean', intermittent_fasting: 'Intermittent Fasting',
  low_sodium: 'Low Sodium', low_sugar: 'Low Sugar', appearance_mode: '✦ Appearance Mode',
};

export default function MealPlanner() {
  const [mealCount, setMealCount] = useState(3);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getProfileList(),
  });
  const profile = profiles[0] || {};
  const pageVisible = usePageVisible();

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

    const isAppearance = profile.diet_mode === 'appearance_mode';

    const appearanceMealPrompt = `You are a nutritionist and appearance optimization specialist. Create a one-day meal plan ENTIRELY optimized for facial clarity, reduced puffiness, sharp definition, and skin health.

APPEARANCE MODE RULES:
- NEVER plan meals around hitting macro targets. Plan entirely around appearance outcomes.
- Every meal must be anti-inflammatory, low sodium, and collagen-supporting.
- Prioritise: eggs, salmon, fatty fish, avocado, blueberries, leafy greens, cucumber, sweet potato, olive oil, pumpkin seeds, broccoli, bone broth, kiwi, walnuts, dark chocolate 85%+, green tea, carrots, garlic.
- AVOID COMPLETELY: seed oils (sunflower/canola/soybean/vegetable), refined sugar, white bread, pasta, processed meats, soda, energy drinks, packaged sauces with hidden sodium/sugar.
- Sodium is the #1 driver of next-day puffiness — keep each meal under 400mg sodium.
- Morning: anti-inflammatory, hormone-supporting, low sodium.
- Midday: collagen-supporting, low glycemic, skin nourishing.
- Snacks: antioxidant rich, low sugar.
- Evening: low sodium, anti-bloat.

User: ${profile.name}, age ${profile.age}, sex ${profile.sex}, weight ${profile.weight}kg.
Allergens to avoid: ${(profile.allergens || []).join(', ') || 'none'}.
Number of meals: ${mealCount} meals named: ${mealNames[mealCount].join(', ')}.

For each meal provide: name, description (appearance benefit focused, 1-2 sentences), appearance_benefit (e.g. "reduces facial inflammation, supports skin elasticity"), ingredients (list), bloat_risk ("Low"/"Medium"/"High"), sodium_estimate (mg number), calories, protein, carbs, fat, prep_time.`;

    const standardMealPrompt = `You are a professional nutritionist. Create a complete one-day meal plan for this user.

DIET MODE: ${profile.diet_mode || 'standard'}. Build the ENTIRE day's meals strictly around the rules and principles of this diet. Every meal must comply with ${profile.diet_mode || 'standard'} diet rules.

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

Generate ${mealCount} meals. Make meals realistic, delicious, and achievable at home.
For each meal provide: name, description (1-2 sentences), ingredients (list), calories, protein, carbs, fat, prep_time.`;

    const result = await invokeLLM({
      prompt: isAppearance ? appearanceMealPrompt : standardMealPrompt,
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
                appearance_benefit: { type: 'string' },
                ingredients: { type: 'array', items: { type: 'string' } },
                bloat_risk: { type: 'string' },
                sodium_estimate: { type: 'number' },
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

    setPlan({ ...result, is_appearance_mode: isAppearance });
    setExpanded({});
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: TODAY, plan: { ...result, is_appearance_mode: isAppearance }, mealCount }));
    } catch (_) {}
    setLoading(false);
  };

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  const pageStyle = {
    background: 'radial-gradient(circle at 10% 0%, rgba(255,228,155,.28), transparent 27rem), radial-gradient(circle at 92% 8%, rgba(182,164,255,.25), transparent 29rem), #f6f5f8',
  };
  const cardCls = "rounded-[30px] bg-white/80 p-6 shadow-[0_24px_70px_rgba(20,20,25,.08)] backdrop-blur-2xl";

  return (
    <div className="min-h-screen pb-10 font-[Inter,ui-sans-serif,system-ui,-apple-system,sans-serif]" style={pageStyle}>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-[28px] font-extrabold text-[#101114]">Meal Planner</h1>
        <p className="text-sm text-[#6d7079] mt-1">{profile.diet_mode === 'appearance_mode' ? 'Appearance-optimised meals for today' : 'AI-generated meals for your diet & goals'}</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Meal count selector */}
        <div className={cardCls}>
          <p className="text-xs font-extrabold uppercase tracking-[.08em] text-[#6d7079] mb-3">Meals per day</p>
          <div className="flex gap-2">
            {MEAL_COUNTS.map(n => (
              <button key={n} onClick={() => setMealCount(n)}
                className="flex-1 py-3 rounded-full text-sm font-extrabold transition-all"
                style={{ background: mealCount === n ? '#121316' : '#f1f0f4', color: mealCount === n ? 'white' : '#101114' }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Diet info */}
        {profile.diet_mode && profile.diet_mode !== 'none' && (
          <div className="rounded-[20px] bg-[#e9e2ff] px-4 py-3 flex items-center gap-2">
            <span className="text-xs text-[#6d7079]">Diet mode active:</span>
            <span className="text-xs font-extrabold text-[#322b58] capitalize">{DIET_LABELS[profile.diet_mode] || profile.diet_mode?.replace(/_/g, ' ')}</span>
          </div>
        )}

        {/* Generate button */}
        <button onClick={generatePlan} disabled={loading}
          className="w-full min-h-[54px] rounded-full bg-[#121316] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_16px_36px_rgba(18,19,22,.18)] disabled:opacity-50">
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
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[20px] bg-white/80 backdrop-blur-2xl p-4 text-center shadow-[0_14px_38px_rgba(16,17,20,.05)]">
                <p className="text-2xl font-extrabold text-[#101114]">{plan.total_calories}</p>
                <p className="text-xs text-[#6d7079]">Total kcal</p>
              </div>
              <div className="rounded-[20px] bg-white/80 backdrop-blur-2xl p-4 text-center shadow-[0_14px_38px_rgba(16,17,20,.05)]">
                <p className="text-2xl font-extrabold text-[#101114]">{plan.total_protein}g</p>
                <p className="text-xs text-[#6d7079]">Protein</p>
              </div>
              <div className="rounded-[20px] bg-white/80 backdrop-blur-2xl p-4 text-center shadow-[0_14px_38px_rgba(16,17,20,.05)]">
                <p className="text-xs text-[#6d7079]">Generated for</p>
                <p className="text-xs font-extrabold text-[#101114] mt-0.5">Today</p>
              </div>
            </div>

            {plan.notes && (
              <div className="rounded-[20px] bg-[#f1f0f4] px-4 py-3">
                <p className="text-xs text-[#6d7079]">{plan.notes}</p>
              </div>
            )}

            <div className="space-y-3">
              {(plan.meals || []).map((meal, i) => (
                <div key={i} className={cardCls}>
                  <button onClick={() => toggleExpand(i)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6d7079]">{meal.meal_type}</p>
                        <h3 className="text-lg font-extrabold text-[#101114] mt-0.5">{meal.name}</h3>
                        {plan.is_appearance_mode
                          ? <p className="text-xs text-[#6d7079] mt-0.5">{meal.prep_time} · Bloat: {meal.bloat_risk} · ~{meal.sodium_estimate}mg Na</p>
                          : <p className="text-xs text-[#6d7079] mt-0.5">{meal.calories} kcal · {meal.prep_time}</p>
                        }
                      </div>
                      {expanded[i] ? <ChevronUp className="w-4 h-4 text-[#6d7079] mt-1 shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6d7079] mt-1 shrink-0" />}
                    </div>
                  </button>
                  {expanded[i] && (
                    <div className="mt-4 pt-4 border-t border-[#e7e5eb] space-y-3">
                      <p className="text-sm text-[#6d7079] leading-relaxed">{meal.description}</p>
                      {plan.is_appearance_mode && meal.appearance_benefit && (
                        <div className="rounded-[16px] bg-[#e9e2ff] px-3 py-2">
                          <p className="text-[10px] font-extrabold text-[#322b58] uppercase mb-0.5">Appearance Benefit</p>
                          <p className="text-xs text-[#322b58]">{meal.appearance_benefit}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {(plan.is_appearance_mode
                          ? [['Calories', `${meal.calories}`], ['Sodium', `${meal.sodium_estimate}mg`], ['Bloat', meal.bloat_risk]]
                          : [['Protein', `${meal.protein}g`], ['Carbs', `${meal.carbs}g`], ['Fat', `${meal.fat}g`]]
                        ).map(([l, v]) => (
                          <div key={l} className="flex-1 bg-[#f1f0f4] rounded-[14px] p-2 text-center">
                            <p className="text-sm font-extrabold text-[#101114]">{v}</p>
                            <p className="text-xs text-[#6d7079]">{l}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-[#101114] mb-1.5">Ingredients</p>
                        <ul className="space-y-0.5">
                          {(meal.ingredients || []).map((ing, j) => (
                            <li key={j} className="text-xs text-[#6d7079] flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[#b6a4ff] shrink-0" />
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