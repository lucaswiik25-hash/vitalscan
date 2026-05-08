import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Share2, MoreHorizontal, Bookmark, Pencil, Sparkles, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
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

// Parse ingredients from result for display
function parseIngredients(result) {
  if (!result.ingredients_text) return [];
  const raw = result.ingredients_text.split(/,|;/).map(s => s.trim()).filter(Boolean).slice(0, 8);
  return raw.map(name => ({ name, cal: null, qty: null }));
}

export default function FoodScanResult({ result, onLog, onScanAnother, onBack }) {
  const [slide, setSlide] = useState(0);
  const [servings, setServings] = useState(1);
  const [showIngredients, setShowIngredients] = useState(false);
  const [ingredientResult, setIngredientResult] = useState(null);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Draggable sheet
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const dragStartTop = useRef(null);
  const [sheetTop, setSheetTop] = useState(50); // percent

  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartTop.current = sheetTop;
  };
  const onTouchMove = (e) => {
    if (dragStartY.current === null) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    const screenH = window.innerHeight;
    const deltaPct = (dy / screenH) * 100;
    const newTop = Math.max(5, Math.min(65, dragStartTop.current + deltaPct));
    setSheetTop(newTop);
  };
  const onTouchEnd = () => {
    // Snap to nearest: if above 30% snap up, else snap to 50%
    if (sheetTop < 30) setSheetTop(5);
    else setSheetTop(50);
    dragStartY.current = null;
  };

  // Mouse drag for desktop
  const onMouseDown = (e) => {
    dragStartY.current = e.clientY;
    dragStartTop.current = sheetTop;
    const onMouseMove = (ev) => {
      const dy = ev.clientY - dragStartY.current;
      const screenH = window.innerHeight;
      const deltaPct = (dy / screenH) * 100;
      const newTop = Math.max(5, Math.min(65, dragStartTop.current + deltaPct));
      setSheetTop(newTop);
    };
    const onMouseUp = () => {
      if (sheetTop < 30) setSheetTop(5);
      else setSheetTop(50);
      dragStartY.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const analyzeIngredients = async () => {
    if (ingredientResult) { setShowIngredients(s => !s); return; }
    setLoadingIngredients(true);
    setShowIngredients(true);
    const res = await base44.integrations.Core.InvokeLLM({
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
    setIngredientResult(res);
    setLoadingIngredients(false);
  };

  const safetyColor = { Green: { bg: '#dcfce7', text: '#16a34a' }, Yellow: { bg: '#fef9c3', text: '#ca8a04' }, Red: { bg: '#fee2e2', text: '#dc2626' } };
  const verdictColor = { Clean: '#16a34a', 'Mostly Clean': '#22c55e', Mixed: '#ca8a04', 'Mostly Processed': '#ea580c', Avoid: '#dc2626' };

  const cal = Math.round((result.calories || 0) * servings);
  const prot = Math.round((result.protein || 0) * servings * 10) / 10;
  const carbs = Math.round((result.carbs || 0) * servings * 10) / 10;
  const fat = Math.round((result.fat || 0) * servings * 10) / 10;

  const parsedIngredients = parseIngredients(result);

  const macroSlides = [
    // Slide 0: main macros
    <div key="s0" className="space-y-3">
      {/* Calories */}
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
      {/* Macro cards */}
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
    </div>,
    // Slide 1: secondary + analysis
    <div key="s1" className="space-y-3">
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
      {result.step >= 2 && (
        <div className="space-y-2">
          <Row label="Diet Compatibility" value={result.diet_compatibility} note={result.diet_reason} />
          <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
          <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
          <Row label="Gut Health" value={result.gut_health} note={result.gut_note} />
          <Row label="Inflammation" value={result.inflammation} />
          <Row label="Processing" value={result.processing_level} />
        </div>
      )}
    </div>,
  ];

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Fullscreen background photo */}
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

      {/* Draggable sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 bg-white overflow-y-auto"
        style={{
          top: `${sheetTop}%`,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transition: dragStartY.current ? 'none' : 'top 0.3s cubic-bezier(0.4,0,0.2,1)',
          paddingBottom: 100,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-2">
          {/* Header row: bookmark + time */}
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
            <span className="text-sm text-gray-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Food name + servings */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex-1 pr-4">{result.name}</h1>
            <div className="flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-2 shrink-0">
              <span className="text-base font-semibold text-gray-800">{servings}</span>
              <button onClick={() => setServings(s => Math.max(0.5, s - 0.5))} className="text-gray-400 text-xs">−</button>
              <button onClick={() => setServings(s => s + 0.5)} className="text-gray-400 text-xs">+</button>
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* Slide content */}
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {macroSlides.map((s, i) => (
                <div key={i} className="min-w-full">{s}</div>
              ))}
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center gap-1.5 mt-3 mb-5">
            {macroSlides.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`rounded-full transition-all ${i === slide ? 'w-4 h-2 bg-gray-800' : 'w-2 h-2 bg-gray-300'}`}
              />
            ))}
          </div>

          {/* Allergens */}
          {result.allergens?.length > 0 && (
            <div className="bg-red-50 rounded-2xl p-3 mb-4">
              <p className="text-xs font-bold text-red-700 mb-1">⚠️ Allergens</p>
              <div className="flex flex-wrap gap-1">
                {result.allergens.map(a => (
                  <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 capitalize">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Ingredients</h2>
              <button
                onClick={analyzeIngredients}
                disabled={loadingIngredients}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500"
              >
                {loadingIngredients
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Plus className="w-3.5 h-3.5" />
                }
                {loadingIngredients ? 'Analyzing...' : showIngredients && ingredientResult ? 'Hide' : 'Add More'}
              </button>
            </div>

            {/* Simple parsed ingredient rows */}
            {parsedIngredients.length > 0 && (
              <div className="space-y-2 mb-3">
                {parsedIngredients.map((ing, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{ing.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Full ingredient analysis */}
            {showIngredients && ingredientResult && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
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

          {/* Appearance analysis (if available) */}
          {result.step >= 2 && result.appearance_tip && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-gray-700 mb-1">✨ Appearance Tip</p>
              <p className="text-xs text-gray-500">{result.appearance_tip}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-3 bg-white border-t border-gray-100 flex gap-3" style={{ maxWidth: 480, margin: '0 auto' }}>
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
  );
}