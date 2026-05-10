import React, { useState, useRef } from 'react';
import { ArrowLeft, Share2, MoreHorizontal, Bookmark, Pencil, Sparkles, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const Pill = ({ value }) => {
  const v = (value || '').toLowerCase();
  const colors = {
    yes: 'bg-green-100 text-green-700',
    low: 'bg-green-100 text-green-700',
    positive: 'bg-green-100 text-green-700',
    'whole food': 'bg-green-100 text-green-700',
    'minimally processed': 'bg-blue-100 text-blue-700',
    limit: 'bg-yellow-100 text-yellow-700',
    medium: 'bg-yellow-100 text-yellow-700',
    neutral: 'bg-gray-100 text-gray-600',
    processed: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700',
    no: 'bg-red-100 text-red-700',
    negative: 'bg-red-100 text-red-700',
    'ultra processed': 'bg-red-100 text-red-700',
    increases: 'bg-red-100 text-red-700',
    reduces: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${colors[v] || 'bg-gray-100 text-gray-600'}`}>
      {value}
    </span>
  );
};

const Row = ({ label, value, note }) => (
  <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 flex-1">{label}</span>
    <div className="text-right shrink-0">
      <Pill value={value} />
      {note && <p className="text-[10px] text-gray-400 mt-0.5 max-w-[160px] text-right">{note}</p>}
    </div>
  </div>
);

function parseIngredients(result) {
  if (!result.ingredients_text) return [];
  return result.ingredients_text.split(/,|;/).map(s => s.trim()).filter(Boolean).slice(0, 8);
}

export default function FoodScanResult({ result, onLog, onScanAnother, onBack }) {
  const [slide, setSlide] = useState(0);
  const [servings, setServings] = useState(1);
  const [ingredientResult, setIngredientResult] = useState(null);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const touchStartX = useRef(null);

  const safetyColor = { Green: { bg: '#dcfce7', text: '#16a34a' }, Yellow: { bg: '#fef9c3', text: '#ca8a04' }, Red: { bg: '#fee2e2', text: '#dc2626' } };
  const verdictColor = { Clean: '#16a34a', 'Mostly Clean': '#22c55e', Mixed: '#ca8a04', 'Mostly Processed': '#ea580c', Avoid: '#dc2626' };

  const cal = Math.round((result.calories || 0) * servings);
  const prot = Math.round((result.protein || 0) * servings * 10) / 10;
  const carbs = Math.round((result.carbs || 0) * servings * 10) / 10;
  const fat = Math.round((result.fat || 0) * servings * 10) / 10;
  const parsedIngredients = parseIngredients(result);

  const analyzeIngredients = async () => {
    if (ingredientResult || loadingIngredients) return;
    setLoadingIngredients(true);
    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      prompt: `You are a food scientist and toxicologist. Analyze every single ingredient in this product.

Product: "${result.name}"
Ingredients text: "${result.ingredients_text || 'Not available — analyze based on typical ingredients for this product type'}"

For EVERY ingredient, return:
- name: ingredient name
- body_effect: one sentence on what it does inside the body
- safety_rating: "Green" (safe), "Yellow" (caution), or "Red" (avoid)
- is_seed_oil: true/false
- is_hidden_sugar: true/false
- is_emulsifier: true/false
- is_hormone_disruptor: true/false
- is_allergen: true/false, allergen_name if yes
- is_artificial_sweetener: true/false
- is_preservative: true/false
- is_artificial_color: true/false
- is_whole_food: true/false

Also return:
- overall_verdict: "Clean", "Mostly Clean", "Mixed", "Mostly Processed", or "Avoid"
- verdict_reason: two sentences

NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                body_effect: { type: 'string' },
                safety_rating: { type: 'string' },
                is_seed_oil: { type: 'boolean' },
                is_hidden_sugar: { type: 'boolean' },
                is_emulsifier: { type: 'boolean' },
                is_hormone_disruptor: { type: 'boolean' },
                is_allergen: { type: 'boolean' },
                allergen_name: { type: 'string' },
                is_artificial_sweetener: { type: 'boolean' },
                is_preservative: { type: 'boolean' },
                is_artificial_color: { type: 'boolean' },
                is_whole_food: { type: 'boolean' },
              },
            },
          },
          overall_verdict: { type: 'string' },
          verdict_reason: { type: 'string' },
        },
      },
    });
    setIngredientResult(r.result);
    setLoadingIngredients(false);
  };

  // --- 4 Slides ---

  // Slide 0: Macros
  const slide0 = (
    <div className="space-y-3 h-full overflow-y-auto pb-4">
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">Calories</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-4xl font-extrabold text-gray-900">{cal}</span>
          {result.health_score && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-800 text-white">
              {result.health_score}/10
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { emoji: '🍖', label: 'Protein', value: `${prot}g` },
          { emoji: '🌾', label: 'Carbs', value: `${carbs}g` },
          { emoji: '🫒', label: 'Fats', value: `${fat}g` },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-2xl p-3">
            <span className="text-base">{m.emoji}</span>
            <p className="text-[10px] text-gray-400 mt-0.5">{m.label}</p>
            <p className="text-base font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Sugar', value: `${Math.round((result.sugar || 0) * servings * 10) / 10}g` },
          { label: 'Fiber', value: `${Math.round((result.fiber || 0) * servings * 10) / 10}g` },
          { label: 'Sodium', value: `${Math.round((result.sodium || 0) * servings)}mg` },
          { label: 'Potassium', value: `${Math.round((result.potassium || 0) * servings)}mg` },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-xl p-2 text-center">
            <p className="text-[9px] text-gray-400">{m.label}</p>
            <p className="text-xs font-bold text-gray-800">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Appearance Mode impact colors
  const appearanceImpactStyle = {
    Excellent: { bg: '#dcfce7', text: '#16a34a' },
    Good: { bg: '#d1fae5', text: '#059669' },
    Neutral: { bg: '#f3f4f6', text: '#6b7280' },
    Avoid: { bg: '#fee2e2', text: '#dc2626' },
  };

  // Slide 1: AI Verdict Part 1
  const slide1 = result.is_appearance_mode ? (
    <div className="h-full overflow-y-auto pb-4 space-y-2">
      {/* Appearance Impact — hero */}
      {result.appearance_impact && (() => {
        const s = appearanceImpactStyle[result.appearance_impact] || appearanceImpactStyle.Neutral;
        return (
          <div className="rounded-2xl p-4" style={{ background: s.bg }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: s.text }}>Appearance Impact</p>
              <span className="text-sm font-extrabold" style={{ color: s.text }}>{result.appearance_impact}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: s.text }}>{result.appearance_reason}</p>
          </div>
        );
      })()}
      <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
      <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
      {result.skin_impact && (
        <div className="bg-gray-50 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Skin Impact</p>
          <p className="text-xs text-gray-700">{result.skin_impact}</p>
        </div>
      )}
      {result.collagen_effect && (
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Collagen Effect</p>
            <Pill value={result.collagen_effect} />
          </div>
          {result.collagen_reason && <p className="text-xs text-gray-500">{result.collagen_reason}</p>}
        </div>
      )}
      {result.hormone_effect && (
        <div className="bg-gray-50 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Hormone Effect</p>
            <Pill value={result.hormone_effect} />
          </div>
          {result.hormone_reason && <p className="text-xs text-gray-500">{result.hormone_reason}</p>}
        </div>
      )}
      {result.tomorrow_face && (
        <div className="bg-purple-50 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-purple-600 uppercase mb-0.5">😴 Tomorrow's Face</p>
          <p className="text-xs text-purple-700">{result.tomorrow_face}</p>
        </div>
      )}
    </div>
  ) : (
    <div className="h-full overflow-y-auto pb-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Body & Diet Analysis</p>
      {result.step >= 2 ? (
        <div className="space-y-1">
          <Row label="Diet Compatibility" value={result.diet_compatibility} note={result.diet_reason} />
          <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
          <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
          <Row label="Gut Health" value={result.gut_health} note={result.gut_note} />
          <Row label="Inflammation" value={result.inflammation} />
          <Row label="Processing" value={result.processing_level} />
        </div>
      ) : (
        <p className="text-sm text-gray-400">Analysis not available.</p>
      )}
    </div>
  );

  // Slide 2: AI Verdict Part 2 — appearance & hormones
  const slide2 = result.is_appearance_mode ? (
    // Appearance mode: show macros as reference (secondary focus)
    <div className="h-full overflow-y-auto pb-4 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Macros (Reference Only)</p>
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        {[
          ['Calories', `${cal} kcal`],
          ['Protein', `${prot}g`],
          ['Carbs', `${carbs}g`],
          ['Fat', `${fat}g`],
          ['Sugar', `${Math.round((result.sugar || 0) * servings * 10) / 10}g`],
          ['Sodium', `${Math.round((result.sodium || 0) * servings)}mg`],
        ].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{l}</span>
            <span className="text-xs font-semibold text-gray-700">{v}</span>
          </div>
        ))}
      </div>
      {result.processing_level && (
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
          <span className="text-xs text-gray-500">Processing Level</span>
          <Pill value={result.processing_level} />
        </div>
      )}
    </div>
  ) : (
    <div className="h-full overflow-y-auto pb-4 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Appearance & More</p>
      {result.appearance_tip && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-700 mb-1">✨ Appearance Tip</p>
          <p className="text-xs text-gray-500 leading-relaxed">{result.appearance_tip}</p>
        </div>
      )}
      {result.tomorrow_face && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-700 mb-1">😴 Tomorrow's Face</p>
          <p className="text-xs text-gray-500 leading-relaxed">{result.tomorrow_face_note || result.tomorrow_face}</p>
        </div>
      )}
      {result.hormone_impact && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-700 mb-1">⚡ Hormone Impact</p>
          <p className="text-xs text-gray-500 leading-relaxed">{result.hormone_note || result.hormone_impact}</p>
        </div>
      )}
      {result.allergens?.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-3">
          <p className="text-xs font-bold text-red-700 mb-1">⚠️ Allergens</p>
          <div className="flex flex-wrap gap-1">
            {result.allergens.map(a => (
              <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 capitalize">{a}</span>
            ))}
          </div>
        </div>
      )}
      {!result.appearance_tip && !result.tomorrow_face && !result.hormone_impact && !result.allergens?.length && (
        <p className="text-sm text-gray-400">No additional analysis available.</p>
      )}
    </div>
  );

  // Slide 3: Ingredients
  const slide3 = (
    <div className="h-full overflow-y-auto pb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingredients</p>
        {!ingredientResult && (
          <button
            onClick={analyzeIngredients}
            disabled={loadingIngredients}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full"
          >
            {loadingIngredients ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {loadingIngredients ? 'Analyzing...' : 'Analyze'}
          </button>
        )}
      </div>

      {/* Simple parsed ingredients */}
      {parsedIngredients.length > 0 && !ingredientResult && (
        <div className="space-y-1.5 mb-3">
          {parsedIngredients.map((name, i) => (
            <div key={i} className="bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-gray-800">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Full ingredient analysis */}
      {ingredientResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-gray-800">Full Analysis</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: (verdictColor[ingredientResult.overall_verdict] || '#888') + '20', color: verdictColor[ingredientResult.overall_verdict] || '#888' }}>
              {ingredientResult.overall_verdict}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mb-2">{ingredientResult.verdict_reason}</p>
          {(ingredientResult.ingredients || []).map((ing, i) => {
            const sc = safetyColor[ing.safety_rating] || safetyColor.Yellow;
            const flags = [
              ing.is_seed_oil && 'Seed Oil',
              ing.is_hidden_sugar && 'Hidden Sugar',
              ing.is_emulsifier && 'Emulsifier',
              ing.is_hormone_disruptor && 'Hormone Disruptor',
              ing.is_allergen && `Allergen${ing.allergen_name ? `: ${ing.allergen_name}` : ''}`,
              ing.is_artificial_sweetener && 'Artificial Sweetener',
              ing.is_preservative && 'Preservative',
              ing.is_artificial_color && 'Artificial Color',
              ing.is_whole_food && '✓ Whole Food',
            ].filter(Boolean);
            return (
              <div key={i} className="bg-gray-50 rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text }}>{ing.safety_rating}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{ing.body_effect}</p>
                {flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {flags.map(f => (
                      <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const allSlides = [slide0, slide1, slide2, slide3];
  const slideLabels = result.is_appearance_mode
    ? ['Overview', 'Appearance', 'Macros', 'Ingredients']
    : ['Macros', 'Body', 'Appearance', 'Ingredients'];

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && slide < allSlides.length - 1) setSlide(s => s + 1);
    if (diff < -50 && slide > 0) setSlide(s => s - 1);
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Fullscreen background photo — top 35% */}
      <div className="absolute inset-0 bg-gray-900">
        {result.image_url
          ? <img src={result.image_url} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900" />
        }
        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-semibold text-base">Nutrition</span>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed verdict sheet — locked at 35% from top, fills 65% */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-white flex flex-col"
        style={{ top: '35%', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        {/* Drag pill (decorative) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header: bookmark + time + name + servings */}
        <div className="px-5 pb-2 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <Bookmark className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span className="text-xs text-gray-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 flex-1 pr-4 leading-tight">{result.name}</h1>
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-2xl px-3 py-1.5 shrink-0">
              <button onClick={() => setServings(s => Math.max(0.5, s - 0.5))} className="text-gray-400 text-sm font-bold">−</button>
              <span className="text-sm font-semibold text-gray-800 px-1">{servings}</span>
              <button onClick={() => setServings(s => s + 0.5)} className="text-gray-400 text-sm font-bold">+</button>
              <Pencil className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Slide tab labels */}
        <div className="px-5 shrink-0 flex gap-2 mb-2 overflow-x-auto no-scrollbar">
          {slideLabels.map((label, i) => (
            <button
              key={label}
              onClick={() => setSlide(i)}
              className="text-xs font-semibold px-3 py-1 rounded-full shrink-0 transition-all"
              style={{
                background: slide === i ? '#1a1a1a' : '#f3f4f6',
                color: slide === i ? 'white' : '#6b7280',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Swipeable slide content — takes remaining space above buttons */}
        <div
          className="flex-1 overflow-hidden px-5"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-300"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {allSlides.map((s, i) => (
              <div key={i} className="min-w-full h-full overflow-y-auto">
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Fixed bottom buttons */}
        <div className="shrink-0 px-5 pb-8 pt-3 border-t border-gray-100 flex gap-3 bg-white">
          <button
            onClick={onScanAnother}
            className="flex-1 h-12 rounded-full border border-gray-300 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 bg-white"
          >
            <Sparkles className="w-4 h-4" />
            Fix Issue
          </button>
          <button
            onClick={onLog}
            className="flex-1 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}