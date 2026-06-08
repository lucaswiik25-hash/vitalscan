import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';
import { Sparkles, Loader2, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

const SEV_STYLES = {
  critical: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  high: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  medium: { bg: '#fef9c3', text: '#ca8a04', border: '#fde68a' },
  low: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
};

export default function HealthRisk() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};

  const { data: meals = [] } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => base44.entities.Meal.filter({ logged: true }),
  });

  const { data: waterLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => base44.entities.WaterLog.list(),
  });

  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['allExercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleepLogs'],
    queryFn: () => base44.entities.SleepLog.list(),
  });

  const analyze = async () => {
    setLoading(true);
    setResult(null);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = format(cutoff, 'yyyy-MM-dd');

    const recentMeals = meals.filter(m => m.date >= cutoffStr);
    const recentWater = waterLogs.filter(w => w.date >= cutoffStr);
    const recentExercise = exerciseLogs.filter(e => e.date >= cutoffStr);
    const recentSleep = sleepLogs.filter(s => s.date >= cutoffStr);

    const daySet = new Set(recentMeals.map(m => m.date));
    const numDays = Math.max(1, daySet.size);
    const tot = recentMeals.reduce((a, m) => ({
      calories: a.calories + (m.calories || 0), protein: a.protein + (m.protein || 0),
      carbs: a.carbs + (m.carbs || 0), fat: a.fat + (m.fat || 0),
      fiber: a.fiber + (m.fiber || 0), sugar: a.sugar + (m.sugar || 0), sodium: a.sodium + (m.sodium || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });

    const avgCal = Math.round(tot.calories / numDays);
    const avgProtein = Math.round(tot.protein / numDays);
    const avgCarbs = Math.round(tot.carbs / numDays);
    const avgFat = Math.round(tot.fat / numDays);
    const avgFiber = Math.round(tot.fiber / numDays);
    const avgSugar = Math.round(tot.sugar / numDays);
    const avgSodium = Math.round(tot.sodium / numDays);

    const waterDaySet = new Set(recentWater.filter(w => w.amount_ml > 0).map(w => w.date));
    const numWaterDays = Math.max(1, waterDaySet.size);
    const avgWaterMl = Math.round(recentWater.filter(w => w.amount_ml > 0).reduce((s, w) => s + w.amount_ml, 0) / numWaterDays);
    const waterGoal = profile.water_target_ml || 2000;
    const waterGoalHitDays = [...waterDaySet].filter(d => recentWater.filter(w => w.date === d && w.amount_ml > 0).reduce((s, w) => s + w.amount_ml, 0) >= waterGoal).length;
    const waterGoalHitRate = waterDaySet.size > 0 ? Math.round((waterGoalHitDays / waterDaySet.size) * 100) : 0;

    const exerciseDaySet = new Set(recentExercise.map(e => e.date));
    const exerciseSessionsPerWeek = Math.round((exerciseDaySet.size / days) * 7 * 10) / 10;
    const avgCalBurnedPerDay = Math.round(recentExercise.reduce((s, e) => s + (e.calories_burned || 0), 0) / days);

    const avgSleepMin = recentSleep.length > 0 ? Math.round(recentSleep.reduce((s, l) => s + (l.duration_minutes || 0), 0) / recentSleep.length) : 0;
    const avgSleepScore = recentSleep.length > 0 ? Math.round(recentSleep.reduce((s, l) => s + (l.sleep_score || 0), 0) / recentSleep.length) : 0;

    const mealSummary = recentMeals.map(m =>
      `${m.date} - ${m.name}: ${m.calories}cal, ${m.protein}g protein, ${m.fat}g fat, ${m.carbs}g carbs, ${m.sugar || 0}g sugar, ${m.sodium || 0}mg sodium`
    ).join('\n');

    const isAppearance = profile.diet_mode === 'appearance_mode';

    const dataBlock = `USER DATA (past ${days} days — base your entire analysis on these specific numbers):
- Calories avg/day: ${avgCal} kcal (target: ${profile.calorie_target || 'unknown'} kcal)
- Protein avg: ${avgProtein}g/day | Carbs avg: ${avgCarbs}g/day | Fat avg: ${avgFat}g/day
- Fiber avg: ${avgFiber}g/day | Sugar avg: ${avgSugar}g/day | Sodium avg: ${avgSodium}mg/day
- Water avg: ${avgWaterMl}ml/day (goal: ${waterGoal}ml, goal hit ${waterGoalHitRate}% of days)
- Sleep avg: ${avgSleepMin > 0 ? (avgSleepMin / 60).toFixed(1) + 'h' : 'not logged'} (sleep score: ${avgSleepScore > 0 ? avgSleepScore + '/100' : 'n/a'})
- Exercise: ${exerciseSessionsPerWeek} sessions/week, avg ${avgCalBurnedPerDay} kcal burned/day
- Activity level: ${profile.activity_level || 'unknown'} | Meals logged: ${recentMeals.length} over ${numDays} days`;

    const appearancePrompt = `You are a dermatologist and appearance optimization expert. Analyze this user's data over the past ${days} days ENTIRELY through the lens of facial appearance, skin clarity, and puffiness.

Base your entire analysis on the specific numbers provided below. Do not make assumptions. Do not use generic advice. Every recommendation must directly reference the actual data provided.

User: age ${profile.age}, sex ${profile.sex}, weight ${profile.weight}kg.
${dataBlock}

Full meal log: ${mealSummary || 'No meals logged yet'}

Return a APPEARANCE analysis. Every finding must cite a specific number from USER DATA above:
- overall_score: 1-100
- overall_verdict: "excellent", "good", "concerning", or "dangerous"
- summary: appearance score summary citing actual sodium (${avgSodium}mg), sugar (${avgSugar}g), hydration (${avgWaterMl}ml) numbers
- risks: each with title, severity, description citing actual data numbers, consequences (face/skin effects), actions (steps with specific targets)
- positive_habits: what the user did well based on their actual numbers
- top_recommendation: one specific change targeting the worst number in their data
- sodium_assessment: how ${avgSodium}mg average daily sodium is affecting their face
- inflammation_assessment: how ${avgSugar}g sugar and ${avgFat}g fat daily is affecting skin inflammation
- 30_day_plan: 4-point plan targeting specific weaknesses found in their data`;

    const standardPrompt = `You are a clinical nutritionist and health risk assessor. Analyze this user's health data over the past ${days} days.

Base your entire analysis on the specific numbers provided below. Do not make assumptions. Do not use generic advice. Every recommendation must directly reference the actual data provided.

User profile: age ${profile.age}, sex ${profile.sex}, weight ${profile.weight}kg, height ${profile.height}cm, goal: ${profile.goal}, diet: ${profile.diet_mode}
${dataBlock}

Full meal log: ${mealSummary || 'No meals logged yet'}

Identify ALL health risks based on the actual numbers above. For each risk:
- title, severity (critical/high/medium/low)
- description (1-2 sentences citing the specific number e.g. "Your ${avgSodium}mg daily sodium...")
- consequences as a bullet list (3-4 points)
- action as a bullet list (2-3 steps with specific numeric targets)`;

    const appearanceSchema = {
      type: 'object',
      properties: {
        overall_score: { type: 'number' },
        overall_verdict: { type: 'string', enum: ['excellent', 'good', 'concerning', 'dangerous'] },
        summary: { type: 'string' },
        sodium_assessment: { type: 'string' },
        inflammation_assessment: { type: 'string' },
        risks: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }, description: { type: 'string' }, consequences: { type: 'array', items: { type: 'string' } }, actions: { type: 'array', items: { type: 'string' } } } } },
        positive_habits: { type: 'array', items: { type: 'string' } },
        top_recommendation: { type: 'string' },
        thirty_day_plan: { type: 'array', items: { type: 'string' } },
      },
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: isAppearance ? appearancePrompt : standardPrompt,
      response_json_schema: isAppearance ? appearanceSchema : {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          overall_verdict: { type: 'string', enum: ['excellent', 'good', 'concerning', 'dangerous'] },
          summary: { type: 'string' },
          risks: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }, description: { type: 'string' }, consequences: { type: 'array', items: { type: 'string' } }, actions: { type: 'array', items: { type: 'string' } } } } },
          positive_habits: { type: 'array', items: { type: 'string' } },
          top_recommendation: { type: 'string' },
        },
      },
    });

    setResult({ ...res, is_appearance_mode: isAppearance });
    setLoading(false);
  };

  const verdictConfig = {
    excellent: { icon: ShieldCheck, color: '#16a34a', bg: '#dcfce7', label: 'Excellent' },
    good: { icon: ShieldCheck, color: '#ca8a04', bg: '#fef9c3', label: 'Good' },
    concerning: { icon: AlertTriangle, color: '#d97706', bg: '#fef3c7', label: 'Concerning' },
    dangerous: { icon: ShieldAlert, color: '#dc2626', bg: '#fee2e2', label: 'Dangerous' },
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">{profile.diet_mode === 'appearance_mode' ? 'Appearance Score' : 'Health Risk Analysis'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{profile.diet_mode === 'appearance_mode' ? 'How your diet is affecting your face & skin' : 'AI-powered diet risk assessment'}</p>
      </div>

      <div className="px-5 space-y-4">
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-3">Analysis Period</p>
          <div className="flex gap-2">
            {[3, 7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: days === d ? '#1a1a1a' : 'hsl(var(--secondary))', color: days === d ? 'white' : 'hsl(var(--foreground))' }}>
                {d}d
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Analyzing {meals.filter(m => { const c = new Date(); c.setDate(c.getDate() - days); return new Date(m.date) >= c; }).length} meals from the past {days} days
          </p>
        </div>

        <button onClick={analyze} disabled={loading}
          className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> {profile.diet_mode === 'appearance_mode' ? 'Analysing appearance...' : 'Analyzing your health...'}</>
            : <><ShieldAlert className="w-5 h-5" /> {profile.diet_mode === 'appearance_mode' ? 'Analyse Appearance Score' : 'Analyze Health Risks'}</>
          }
        </button>

        {result && (() => {
          const vc = verdictConfig[result.overall_verdict] || verdictConfig.good;
          const VIcon = vc.icon;
          return (
            <>
              {/* Overall score */}
              <div className="bg-white border border-border rounded-[24px] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{result.is_appearance_mode ? 'Appearance Score' : 'Overall Health Score'}</p>
                    <p className="text-4xl font-extrabold text-foreground mt-0.5">
                      {result.overall_score}<span className="text-lg text-muted-foreground">/100</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl" style={{ background: vc.bg }}>
                    <VIcon className="w-6 h-6" style={{ color: vc.color }} />
                    <span className="text-xs font-bold" style={{ color: vc.color }}>{vc.label}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${result.overall_score}%`, background: result.overall_score >= 70 ? '#6CC5A0' : result.overall_score >= 40 ? '#F5C842' : '#F47C7C' }} />
                </div>
                <p className="text-sm text-muted-foreground mt-3">{result.summary}</p>
                {/* Appearance Mode extra cards */}
                {result.is_appearance_mode && (
                  <div className="mt-4 space-y-2">
                    {result.sodium_assessment && (
                      <div className="bg-blue-50 rounded-2xl px-4 py-3">
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">Sodium → Tomorrow's Face</p>
                        <p className="text-xs text-blue-700">{result.sodium_assessment}</p>
                      </div>
                    )}
                    {result.inflammation_assessment && (
                      <div className="bg-orange-50 rounded-2xl px-4 py-3">
                        <p className="text-[10px] font-bold text-orange-600 uppercase mb-0.5">Skin Inflammation Today</p>
                        <p className="text-xs text-orange-700">{result.inflammation_assessment}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Risks */}
              {(result.risks || []).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground px-1">Identified Risks</h3>
                  {result.risks.map((risk, i) => {
                    const sc = SEV_STYLES[risk.severity] || SEV_STYLES.low;
                    return (
                      <div key={i} className="bg-white border rounded-[24px] p-5 shadow-sm space-y-3" style={{ borderColor: sc.border }}>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground">{risk.title}</h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.text }}>{risk.severity}</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>

                        {/* Consequences */}
                        {(risk.consequences || []).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1">Potential consequences</p>
                            <ul className="space-y-0.5">
                              {risk.consequences.map((c, j) => (
                                <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.text }} />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actions */}
                        {(risk.actions || []).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1">What to do</p>
                            <ul className="space-y-0.5">
                              {risk.actions.map((a, j) => (
                                <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <span className="mt-0.5">→</span>
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Positives */}
              {(result.positive_habits || []).length > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-[24px] p-5">
                  <h3 className="text-sm font-bold text-green-800 mb-2">Positive Habits</h3>
                  <ul className="space-y-1">
                    {result.positive_habits.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-green-700">
                        <span className="mt-0.5">✓</span>{h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.top_recommendation && (
                <div className="bg-foreground rounded-[24px] p-5">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">{result.is_appearance_mode ? 'Change This Tomorrow' : 'Top Recommendation'}</p>
                  <p className="text-sm text-white font-medium">{result.top_recommendation}</p>
                </div>
              )}
              {result.is_appearance_mode && result.thirty_day_plan?.length > 0 && (
                <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">30-Day Improvement Plan</p>
                  <div className="space-y-2">
                    {result.thirty_day_plan.map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-foreground text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}