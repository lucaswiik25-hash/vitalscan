import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Loader2, X, Check } from 'lucide-react';
import SupplementCard from '../components/supplements/SupplementCard';
import SupplementDetailPanel from '../components/supplements/SupplementDetailPanel';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const timeLabel = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', with_food: 'With Food' };

const sevColor = {
  high: { bg: '#fee2e2', text: '#dc2626' },
  medium: { bg: '#fef9c3', text: '#ca8a04' },
  low: { bg: '#dcfce7', text: '#16a34a' },
};

export default function SupplementTracker() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newTime, setNewTime] = useState('morning');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [selectedSup, setSelectedSup] = useState(null);

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
    setShowAiSheet(true);
    const mealSummary = meals.slice(0, 30).map(m =>
      `${m.name}: ${m.calories}cal, ${m.protein}g protein, ${m.fat}g fat, ${m.carbs}g carbs`
    ).join('\n');
    const isAppearance = profile.diet_mode === 'appearance_mode';
    const prompt = isAppearance
      ? `You are a supplement specialist focused on appearance optimization. Evaluate this user's supplement stack for appearance outcomes — skin clarity, hormonal balance, collagen synthesis, reduced puffiness. User: age ${profile.age}, sex ${profile.sex}. Current supplements: ${supplements.map(s => s.name).join(', ') || 'None'}. Recent diet: ${mealSummary || 'No meals logged'}. Identify the top 5 appearance gaps. For each explain the appearance impact.`
      : `You are a nutritionist. Based on this user's food intake and profile, analyze supplement deficiencies. User: age ${profile.age}, sex ${profile.sex}, goal: ${profile.goal}, diet: ${profile.diet_mode}. Recent meals: ${mealSummary || 'No meals logged'}. Current supplements: ${supplements.map(s => s.name).join(', ') || 'None'}. Identify the top 5 deficiencies, explain why and health risks.`;
    const { data: claudeRes } = await base44.functions.invoke('analyzeWithClaude', {
      prompt,
      response_json_schema: { type: 'object', properties: { deficiencies: { type: 'array', items: { type: 'object' } }, summary: { type: 'string' } } },
    });
    setAiResult(claudeRes?.result || claudeRes);
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Supplements</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={analyzeDeficiencies}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center transition-all active:scale-90"
          >
            {analyzing
              ? <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              : <Sparkles className="w-4 h-4 text-gray-700" />
            }
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center active:scale-90 transition-all"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Supplement list */}
      <div className="px-4 space-y-4">
        {supplements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-bold text-gray-400 mb-1">No supplements yet</p>
            <p className="text-sm text-gray-300">Tap + to add your first supplement</p>
          </div>
        ) : (
          supplements.map((sup, i) => (
            <SupplementCard
              key={sup.id}
              supplement={sup}
              index={i}
              onTap={() => setSelectedSup(sup)}
              onDelete={deleteSup}
            />
          ))
        )}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedSup && (
          <SupplementDetailPanel
            supplement={selectedSup}
            onClose={() => setSelectedSup(null)}
            onToggleTaken={(sup) => { toggleTaken(sup); setSelectedSup(null); }}
          />
        )}
      </AnimatePresence>

      {/* AI Analysis sheet */}
      <AnimatePresence>
        {showAiSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setShowAiSheet(false)} />
            <motion.div
              className="relative w-full max-w-lg bg-white rounded-t-[32px] px-5 pt-6 pb-10 max-h-[85vh] overflow-y-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-700" />
                  <h3 className="text-lg font-bold text-gray-900">AI Analysis</h3>
                </div>
                <button onClick={() => setShowAiSheet(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {analyzing && (
                <div className="flex flex-col items-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-400">Analyzing your supplement stack...</p>
                </div>
              )}

              {aiResult && !analyzing && (
                <div className="space-y-4">
                  {aiResult.summary && (
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Summary</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{aiResult.summary}</p>
                    </div>
                  )}
                  {(aiResult.deficiencies || []).map((d, i) => {
                    const sc = sevColor[d.severity] || sevColor.low;
                    return (
                      <div key={i} className="border border-gray-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900">{d.supplement}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.text }}>{d.severity} priority</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{d.reason}</p>
                        {d.health_risks?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Health risks</p>
                            {d.health_risks.map((r, j) => (
                              <p key={j} className="text-xs text-gray-400 flex gap-1.5 items-start">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: sc.text }} />
                                {r}
                              </p>
                            ))}
                          </div>
                        )}
                        {d.recommendations?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Recommendations</p>
                            {d.recommendations.map((r, j) => (
                              <p key={j} className="text-xs text-gray-400">• {r}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add supplement modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setShowAdd(false)} />
            <motion.div
              className="relative w-full max-w-lg bg-white rounded-t-[32px] px-5 pt-6 pb-10 space-y-4 max-h-[90vh] overflow-y-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900">Add Supplement</h3>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Quick Add</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Vitamin D3', dose: '2000 IU' }, { name: 'Vitamin C', dose: '500mg' },
                    { name: 'Zinc', dose: '25mg' }, { name: 'Magnesium Glycinate', dose: '400mg' },
                    { name: 'Omega-3 Fish Oil', dose: '1000mg' }, { name: 'Vitamin B12', dose: '1000mcg' },
                    { name: 'Iron', dose: '18mg' }, { name: 'Folate', dose: '400mcg' },
                    { name: 'Ashwagandha', dose: '600mg' }, { name: 'Creatine', dose: '5g' },
                    { name: 'Collagen Peptides', dose: '10g' }, { name: 'CoQ10', dose: '100mg' },
                    { name: "Lion's Mane", dose: '500mg' },
                  ].map(q => (
                    <button key={q.name}
                      onClick={() => { setNewName(q.name); setNewDose(q.dose); }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={{
                        background: newName === q.name ? '#1a1a1a' : '#f4f4f5',
                        color: newName === q.name ? 'white' : '#1a1a1a',
                        borderColor: newName === q.name ? '#1a1a1a' : 'transparent',
                      }}>
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Supplement name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                <input value={newDose} onChange={e => setNewDose(e.target.value)} placeholder="Dose (e.g. 500mg)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
              </div>

              <div className="flex gap-2">
                {Object.entries(timeLabel).map(([val, lbl]) => (
                  <button key={val} onClick={() => setNewTime(val)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: newTime === val ? '#1a1a1a' : '#f4f4f5', color: newTime === val ? 'white' : '#1a1a1a' }}>
                    {lbl}
                  </button>
                ))}
              </div>

              <button onClick={addSupplement} className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm">
                Add Supplement
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}