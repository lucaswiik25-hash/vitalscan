import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
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

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};

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

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a nutritionist. Based on this user's recent food intake log and profile, analyze what supplements they may be deficient in.

User profile: age ${profile.age}, sex ${profile.sex}, goal: ${profile.goal}, diet: ${profile.diet_mode}
Recent meals (last 30):
${mealSummary || 'No meals logged yet'}

Current supplements they take: ${supplements.map(s => s.name).join(', ') || 'None'}

Identify the top 5 supplement deficiencies or gaps they likely have based on their diet pattern. For each, explain WHY they might be deficient and what health risks it poses. Be specific and medically accurate.`,
      response_json_schema: {
        type: 'object',
        properties: {
          deficiencies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                supplement: { type: 'string' },
                severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                reason: { type: 'string' },
                health_risk: { type: 'string' },
                recommendation: { type: 'string' },
              },
            },
          },
          summary: { type: 'string' },
        },
      },
    });
    setAiResult(result);
    setAnalyzing(false);
  };

  const timeGroups = ['morning', 'afternoon', 'evening', 'with_food'];
  const timeLabel = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', with_food: 'With Food' };

  const sevColor = { high: { bg: '#fee2e2', text: '#dc2626' }, medium: { bg: '#fef9c3', text: '#ca8a04' }, low: { bg: '#dcfce7', text: '#16a34a' } };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Supplements</h1>
        <button onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-5 mt-3 space-y-4">
        {/* Supplement list by time */}
        {supplements.length === 0 ? (
          <div className="bg-white border border-border rounded-[24px] p-8 text-center shadow-sm">
            <Pill className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No supplements added</p>
            <p className="text-sm text-muted-foreground mt-1">Tap + to add your first supplement</p>
          </div>
        ) : (
          timeGroups.map(tg => {
            const group = supplements.filter(s => s.time_of_day === tg);
            if (group.length === 0) return null;
            return (
              <div key={tg} className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
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
              </div>
            );
          })
        )}

        {/* AI Analysis */}
        <div className="bg-white border border-border rounded-[24px] p-5 shadow-sm">
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
            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">{aiResult.summary}</p>
              {(aiResult.deficiencies || []).map((d, i) => {
                const sc = sevColor[d.severity] || sevColor.low;
                return (
                  <div key={i} className="border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-foreground">{d.supplement}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{d.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold">Risk:</span> {d.health_risk}</p>
                    <p className="text-xs text-foreground mt-1 font-medium">{d.recommendation}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add supplement modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-[32px] px-5 pt-6 pb-10 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-foreground">Add Supplement</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Supplement or medication name"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground" />
            <input value={newDose} onChange={e => setNewDose(e.target.value)} placeholder="Dose (e.g. 500mg, 1 capsule)"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground" />
            <div className="flex gap-2">
              {Object.entries(timeLabel).map(([val, lbl]) => (
                <button key={val} onClick={() => setNewTime(val)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: newTime === val ? '#1a1a1a' : 'hsl(var(--secondary))', color: newTime === val ? 'white' : 'hsl(var(--foreground))' }}>
                  {lbl}
                </button>
              ))}
            </div>
            <button onClick={addSupplement}
              className="w-full h-12 rounded-2xl bg-foreground text-white font-semibold text-sm">
              Add Supplement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}