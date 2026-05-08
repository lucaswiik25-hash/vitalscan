import React, { useState } from 'react';
import { ArrowLeft, Sparkles, ThumbsUp, ThumbsDown, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const Pill = ({ value, colorMap }) => {
  const v = (value || '').toLowerCase();
  const colors = colorMap || {
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
  <div className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground flex-1">{label}</span>
    <div className="text-right shrink-0">
      <Pill value={value} />
      {note && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[160px] text-right">{note}</p>}
    </div>
  </div>
);

export default function FoodScanResult({ result, onLog, onScanAnother, onBack }) {
  const [slide, setSlide] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [ingredientResult, setIngredientResult] = useState(null);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

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

NEVER fail. If ingredients are unknown, make reasonable estimates for this product type.`,
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

  const slides = [
    // Slide 0 — Main macros
    <div key="s0" className="space-y-3">
      <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
        <p className="text-xs text-muted-foreground mb-1">Calories per serving {result.serving_size ? `(${result.serving_size})` : ''}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="text-4xl font-extrabold text-foreground">{result.calories}</span>
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { emoji: '🍖', label: 'Protein', value: `${result.protein}g` },
          { emoji: '🌾', label: 'Carbs', value: `${result.carbs}g` },
          { emoji: '🫒', label: 'Fat', value: `${result.fat}g` },
        ].map(m => (
          <div key={m.label} className="bg-white border border-border rounded-2xl p-3 shadow-sm text-center">
            <span className="text-sm">{m.emoji}</span>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className="text-base font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Sugar', value: `${result.sugar || 0}g` },
          { label: 'Fiber', value: `${result.fiber || 0}g` },
          { label: 'Sodium', value: `${result.sodium || 0}mg` },
          { label: 'Potassium', value: `${result.potassium || 0}mg` },
        ].map(m => (
          <div key={m.label} className="bg-white border border-border rounded-2xl p-2 shadow-sm text-center">
            <p className="text-[9px] text-muted-foreground">{m.label}</p>
            <p className="text-xs font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Saturated Fat', value: `${result.saturated_fat || 0}g` },
          { label: 'Cholesterol', value: `${result.cholesterol || 0}mg` },
        ].map(m => (
          <div key={m.label} className="bg-white border border-border rounded-2xl p-3 shadow-sm text-center">
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className="text-sm font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
      {result.allergens?.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-[20px] p-4">
          <p className="text-xs font-bold text-red-700 mb-1">⚠️ Allergens Detected</p>
          <div className="flex flex-wrap gap-1">
            {result.allergens.map(a => (
              <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 capitalize">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>,

    // Slide 1 — Deep analysis (Call 2)
    <div key="s1" className="space-y-3">
      {result.step >= 2 ? (
        <>
          {/* Health score + processing */}
          <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Health Score</span>
              <span className="text-2xl font-extrabold" style={{ color: result.health_score >= 7 ? '#16a34a' : result.health_score >= 4 ? '#ca8a04' : '#dc2626' }}>{result.health_score}/10</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${(result.health_score / 10) * 100}%`, background: result.health_score >= 7 ? '#16a34a' : result.health_score >= 4 ? '#ca8a04' : '#dc2626' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Processing Level</span>
              <Pill value={result.processing_level} />
            </div>
          </div>
          {/* Diet & digestion */}
          <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Diet & Digestion</p>
            <Row label="Diet Compatibility" value={result.diet_compatibility} note={result.diet_reason} />
            <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
            <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
            <Row label="Gut Health" value={result.gut_health} note={result.gut_note} />
          </div>
          {/* Skin & hormones */}
          <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Skin & Appearance</p>
            <Row label="Collagen Effect" value={result.collagen_effect} />
            <Row label="Inflammation" value={result.inflammation} />
            <Row label="Sebum Effect" value={result.sebum_effect} />
            <Row label="Tomorrow Face" value={result.tomorrow_face} note={result.tomorrow_face_note} />
            <Row label="Hormone Impact" value={result.hormone_impact} note={result.hormone_note} />
            {result.skin_summary && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground leading-relaxed">{result.skin_summary}</p>
              </div>
            )}
          </div>
          {result.appearance_tip && (
            <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground mb-0.5">Appearance Tip</p>
                <p className="text-xs text-muted-foreground">{result.appearance_tip}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-border rounded-[20px] p-8 text-center shadow-sm">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Deep analysis loading...</p>
        </div>
      )}
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative h-20 bg-gradient-to-b from-gray-800 to-gray-900">
        {result.image_url && <img src={result.image_url} className="w-full h-full object-cover opacity-30" alt="" />}
        <div className="absolute inset-0 flex items-center justify-between px-4 pt-8">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-semibold text-sm">{result.confidence === 'high' ? '✓ High Confidence' : result.confidence === 'medium' ? '~ Medium Confidence' : '? Low Confidence'}</span>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 pt-4 pb-28">
        <h1 className="text-xl font-bold text-foreground">{result.name}</h1>
        {result.brand && <p className="text-xs text-muted-foreground mt-0.5">{result.brand}</p>}

        {/* Slide tabs */}
        <div className="flex gap-2 mt-4 mb-3">
          {['Nutrition', 'Analysis'].map((tab, i) => (
            <button key={tab} onClick={() => setSlide(i)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ background: slide === i ? '#1a1a1a' : 'hsl(var(--secondary))', color: slide === i ? 'white' : 'hsl(var(--foreground))' }}>
              {tab}
            </button>
          ))}
        </div>

        {slides[slide]}

        {/* Ingredient analysis button */}
        <div className="mt-4">
          <button
            onClick={analyzeIngredients}
            disabled={loadingIngredients}
            className="w-full h-12 rounded-2xl border border-border bg-white shadow-sm flex items-center justify-center gap-2 text-sm font-semibold text-foreground"
          >
            {loadingIngredients
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing ingredients...</>
              : showIngredients && ingredientResult
                ? <>{showIngredients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Ingredient Analysis</>
                : <><Sparkles className="w-4 h-4" /> Full Ingredient Analysis</>
            }
          </button>

          {showIngredients && ingredientResult && (
            <div className="mt-3 bg-white border border-border rounded-[20px] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-foreground">Ingredient Breakdown</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: verdictColor[ingredientResult.overall_verdict] + '20', color: verdictColor[ingredientResult.overall_verdict] || '#888' }}>
                  {ingredientResult.overall_verdict}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{ingredientResult.verdict_reason}</p>
              <div className="space-y-3">
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
                    ing.is_whole_food && 'Whole Food',
                  ].filter(Boolean);
                  return (
                    <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">{ing.name}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text }}>{ing.safety_rating}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ing.body_effect}</p>
                      {flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {flags.map(f => (
                            <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="mt-4 bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Was this accurate?</span>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ThumbsDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4 pb-8 flex gap-3 max-w-lg mx-auto">
        <Button variant="outline" onClick={onScanAnother} className="flex-1 h-12 rounded-2xl font-semibold border-border">
          Scan Another
        </Button>
        <Button onClick={onLog} className="flex-1 h-12 rounded-2xl bg-foreground text-white font-semibold">
          Log Meal
        </Button>
      </div>
    </div>
  );
}