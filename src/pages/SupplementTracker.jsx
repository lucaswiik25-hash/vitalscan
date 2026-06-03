import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../hooks/useUserProfile';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, Check, Trash2, Sparkles, Loader2, Pill, X } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function SupplementTracker() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newTime, setNewTime] = useState('morning');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => base44.entities.Supplement.list(),
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => base44.entities.Meal.filter({ logged: true }),
  });

  const { profile } = useUserProfile();

  const addSupplement = async () => {
    if (!newName.trim()) return;
    await base44.entities.Supplement.create({
      name: newName.trim(),
      dose: newDose,
      time_of_day: newTime,
      taken_today: false,
    });
    queryClient.invalidateQueries({ queryKey: ['supplements'] });
    setNewName(''); setNewDose(''); setNewTime('morning');
    setShowAdd(false);
  };

  const toggleTaken = async (sup) => {
    await base44.entities.Supplement.update(sup.id, {
      taken_today: !sup.taken_today,
      last_taken_date: !sup.taken_today ? TODAY : sup.last_taken_date,
    });
    queryClient.invalidateQueries({ queryKey: ['supplements'] });
  };

  const deleteSup = async (id) => {
    await base44.entities.Supplement.delete(id);
    queryClient.invalidateQueries({ queryKey: ['supplements'] });
  };

  const analyzeDeficiencies = async () => {
    setAnalyzing(true);
    setAiResult(null);
    const mealSummary = meals.slice(0, 30).map(m =>
      `${m.name}: ${m.calories}cal, ${m.protein}g protein, ${m.fat}g fat, ${m.carbs}g carbs, ${m.fiber || 0}g fiber`
    ).join('\n');

    const isAppearance = profile.diet_mode === 'appearance_mode';

    const appearanceSupplementPrompt = `You are a supplement specialist focused on appearance optimization. Evaluate this user's current supplement stack specifically for appearance outcomes — facial clarity, reduced puffiness, hormonal balance, skin health, and collagen synthesis.

APPEARANCE SUPPLEMENT PRIORITIES (must-haves):
1. Zinc — reduces acne, supports testosterone, regulates sebum production
2. Vitamin D3 with K2 — hormonal balance and skin clarity
3. Omega-3 fish oil — reduces facial inflammation, supports skin barrier
4. Magnesium glycinate — reduces cortisol (shows on face), supports sleep quality
5. Collagen peptides — directly supports skin structure and elasticity
6. Vitamin C — cofactor for collagen synthesis
7. Beta carotene or Vitamin A — skin cell turnover
8. B complex — skin cell renewal and stress response
9. Biotin — hair and nail health if relevant

FLAGS TO LOOK FOR IN CURRENT STACK:
- Supplements with artificial colors, titanium dioxide, or unnecessary fillers — flag as contradicting the clean appearance goal
- Magnesium oxide — flag as poorly absorbed (only 4%), recommend switching to glycinate
- Folic acid — flag as synthetic, recommend methylfolate instead
- Vitamin D2 — flag as inferior, recommend D3
- Any supplement high in fillers or artificial additives

User: age ${profile.age}, sex ${profile.sex}.
Current supplements: ${supplements.map(s => s.name).join(', ') || 'None'}.
Recent diet summary: ${mealSummary || 'No meals logged yet'}.

Identify the top 5 appearance gaps or stack issues. For each explain the appearance impact and what to do.`;

    const standardSupplementPrompt = `You are a nutritionist. Based on this user's recent food intake log and profile, analyze what supplements they may be deficient in.

User profile: age ${profile.age}, sex ${profile.sex}, goal: ${profile.goal}, diet: ${profile.diet_mode}. Tailor all recommendations specifically to the ${profile.diet_mode} diet.
Recent meals (last 30):
${mealSummary || 'No meals logged yet'}

Current supplements they take: ${supplements.map(s => s.name).join(', ') || 'None'}

Identify the top 5 supplement deficiencies or gaps they likely have based on their diet pattern. For each, explain WHY they might be deficient and what health risks it poses. Be specific and medically accurate.`;

    const { data: claudeRes } = await base44.functions.invoke('analyzeWithClaude', {
      prompt: isAppearance ? appearanceSupplementPrompt : standardSupplementPrompt,
      response_json_schema: { type: 'object', properties: { deficiencies: { type: 'array', items: { type: 'object' } }, summary: { type: 'string' } } },
    });
    setAiResult(claudeRes.result);
    setAnalyzing(false);
  };

  const timeGroups = ['morning', 'afternoon', 'evening', 'with_food'];
  const timeLabel = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', with_food: 'With Food' };
  const sevColor = { high: { bg: '#fee2e2', text: '#dc2626' }, medium: { bg: '#fef9c3', text: '#ca8a04' }, low: { bg: '#dcfce7', text: '#16a34a' } };

  return (
    <div className="min-h-screen pb-24">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0 }} className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Supplements</h1>
        <button onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </motion.div>

      <div className="px-5 mt-3 space-y-4">
        {supplements.length === 0 ? (
          <div className="bg-white border border-border rounded-[24px] p-8 text-center shadow-sm">
            <Pill className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No supplements added</p>
            <p className="text-sm text-muted-foreground mt-1">Tap + to add your first supplement</p>
          </div>
        ) : (
          timeGroups.map((tg, gi) => {
            const group = supplements.filter(s => s.time_of_day === tg);
            if (group.length === 0) return null;
            return (
              <motion.div key={tg} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 + gi * 0.1 }} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{timeLabel[tg]}</p>
                <div className="space-y-2">
                  {group.map(sup => (
                    <div key={sup.id} className="flex items-center gap-3">
                      <button onClick={() => toggleTaken(sup)}
                        className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                        style={{ borderColor: sup.taken_today ? '#6CC5A0' : 'hsl(var(--border))', background: sup.taken_today ? '#6CC5A0' : 'transparent' }}>
                        {sup.taken_today && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${sup.taken_today ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{sup.name}</p>
                        {sup.dose && <p className="text-xs text-muted-foreground">{sup.dose}</p>}
                      </div>
                      <button onClick={() => deleteSup(sup.id)} className="w-7 h-7 flex items-center justify-center text-muted-foreground/40 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Analysis title */}
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pt-1">Analysis</p>

        {/* AI Analysis */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-foreground" />
            <h3 className="text-sm font-bold text-foreground">AI Deficiency Analysis</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Analyzes your food logs to find what supplements you may be missing.</p>
          <button onClick={analyzeDeficiencies} disabled={analyzing}
            className="w-full h-12 rounded-2xl bg-foreground text-white text-sm font-semibold flex items-center justify-center gap-2">
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze My Diet</>}
          </button>

          {aiResult && (
            <div className="mt-4 space-y-4">
              {/* Summary */}
              <div className="bg-secondary/40 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-foreground mb-0.5">Summary</p>
                <p className="text-xs text-muted-foreground">{aiResult.summary}</p>
              </div>

              {(aiResult.deficiencies || []).map((d, i) => {
                const sc = sevColor[d.severity] || sevColor.low;
                return (
                  <div key={i} className="border border-border rounded-2xl p-4 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{d.supplement}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.text }}>{d.severity} priority</span>
                    </div>

                    {/* Why deficient */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-0.5">Why you may be deficient</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{d.reason}</p>
                    </div>

                    {/* Health risks */}
                    {(d.health_risks || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Health risks</p>
                        <ul className="space-y-0.5">
                          {d.health_risks.map((r, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.text }} />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {(d.recommendations || []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Recommendations</p>
                        <ul className="space-y-0.5">
                          {d.recommendations.map((r, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="mt-1">•</span>
                              {r}
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
        </motion.div>
      </div>

      {/* Add supplement modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} onClick={() => setShowAdd(false)} />
          <motion.div className="relative w-full max-w-lg bg-white rounded-t-[32px] flex flex-col" style={{ maxHeight: '90vh' }} initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            {/* Fixed header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-3 shrink-0">
              <h3 className="text-lg font-bold text-foreground">Add Supplement</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 space-y-4">
              {/* Quick add */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Add</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Vitamin D3', dose: '2000 IU' },
                    { name: 'Vitamin C', dose: '500mg' },
                    { name: 'Zinc', dose: '25mg' },
                    { name: 'Magnesium Glycinate', dose: '400mg' },
                    { name: 'Omega-3 Fish Oil', dose: '1000mg' },
                    { name: 'Vitamin B12', dose: '1000mcg' },
                    { name: 'Iron', dose: '18mg' },
                    { name: 'Folate', dose: '400mcg' },
                    { name: 'Vitamin K2', dose: '100mcg' },
                    { name: 'Ashwagandha', dose: '600mg' },
                    { name: 'Creatine', dose: '5g' },
                    { name: 'Collagen Peptides', dose: '10g' },
                    { name: 'Probiotics', dose: '10B CFU' },
                    { name: 'CoQ10', dose: '100mg' },
                    { name: "Lion's Mane", dose: '500mg' },
                  ].map((q, qi) => (
                    <button key={q.name}
                      onClick={() => { setNewName(q.name); setNewDose(q.dose); }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={{
                        background: newName === q.name ? '#1a1a1a' : 'hsl(var(--secondary))',
                        color: newName === q.name ? 'white' : 'hsl(var(--foreground))',
                        borderColor: newName === q.name ? '#1a1a1a' : 'hsl(var(--border))',
                      }}>
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Or enter custom</p>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Supplement or medication name"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground" />
                <input value={newDose} onChange={e => setNewDose(e.target.value)} placeholder="Dose (e.g. 500mg, 1 capsule)"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              <div className="flex gap-2">
                {Object.entries(timeLabel).map(([val, lbl]) => (
                  <button key={val} onClick={() => setNewTime(val)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: newTime === val ? '#1a1a1a' : 'hsl(var(--secondary))', color: newTime === val ? 'white' : 'hsl(var(--foreground))' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed footer button */}
            <div className="px-5 pt-3 pb-10 shrink-0">
              <button onClick={addSupplement}
                className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-sm active:scale-95 transition-transform">
                Add Supplement
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}