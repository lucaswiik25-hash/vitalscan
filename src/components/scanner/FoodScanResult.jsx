import React, { useState, useRef } from 'react';
import { ArrowLeft, Sparkles, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Pill badge ───────────────────────────────────────────────────────────────
const PillBadge = ({ value }) => {
  const v = (value || '').toLowerCase();
  const colors = {
    yes: 'bg-green-100 text-green-700', low: 'bg-green-100 text-green-700',
    'whole food': 'bg-green-100 text-green-700', 'minimally processed': 'bg-blue-100 text-blue-700',
    limit: 'bg-yellow-100 text-yellow-700', medium: 'bg-yellow-100 text-yellow-700',
    neutral: 'bg-gray-100 text-gray-600', processed: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700', no: 'bg-red-100 text-red-700',
    'ultra processed': 'bg-red-100 text-red-700', supports: 'bg-green-100 text-green-700',
    damages: 'bg-red-100 text-red-700', reduces: 'bg-green-100 text-green-700',
    increases: 'bg-red-100 text-red-700',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${colors[v] || 'bg-gray-100 text-gray-600'}`}>{value}</span>;
};

const Row = ({ label, value, note }) => (
  <div className="flex items-start justify-between gap-2 py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-500 flex-1">{label}</span>
    <div className="text-right shrink-0">
      <PillBadge value={value} />
      {note && <p className="text-[10px] text-gray-400 mt-0.5 max-w-[160px] text-right">{note}</p>}
    </div>
  </div>
);

function parseIngredients(result) {
  if (!result.ingredients_text) return [];
  return result.ingredients_text.split(/,|;/).map(s => s.trim()).filter(Boolean).slice(0, 8);
}

// ─── Dotted arc score widget ──────────────────────────────────────────────────
function DottedScoreCircle({ score, label }) {
  const total = 60;
  const filled = Math.round((score / 100) * total);
  const size = 140;
  const cx = size / 2, cy = size / 2;
  const r = 52;
  const startAngle = -210;
  const sweep = 240;

  const getColor = (i) => {
    const pct = i / total;
    if (score >= 70) return pct < filled / total ? '#16a34a' : '#e5e7eb';
    if (score >= 30) {
      if (pct < filled / total) return pct > 0.6 ? '#F5C842' : '#F97316';
      return '#e5e7eb';
    }
    if (pct < filled / total) return '#dc2626';
    return '#e5e7eb';
  };

  const dots = Array.from({ length: total }, (_, i) => {
    const angle = (startAngle + (sweep / total) * i) * (Math.PI / 180);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, color: getColor(i) };
  });

  const scoreColor = score >= 70 ? '#16a34a' : score >= 30 ? '#F97316' : '#dc2626';

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3.5} fill={d.color} />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginTop: 2 }}>{label || 'Score'}</span>
      </div>
    </div>
  );
}

// ─── Macro bar row ────────────────────────────────────────────────────────────
function MacroBarRow({ label, value, unit, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-base font-bold text-gray-800">{value?.toFixed(1) ?? 0}<span className="text-xs text-gray-400 ml-0.5">{unit || 'g'}</span></span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FoodScanResult({ result, onLog, onLogAnalysisOnly, onScanAnother, onBack }) {
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
  const sugar = Math.round((result.sugar || 0) * servings * 10) / 10;
  const sodium = Math.round((result.sodium || 0) * servings);
  const parsedIngredients = parseIngredients(result);

  // Score label
  const scoreLabel = () => {
    const s = result.health_score ? result.health_score * 10 : 0;
    if (s >= 85) return 'Ultra Clean';
    if (s >= 70) return 'Very Good';
    if (s >= 50) return 'Moderate';
    if (s >= 30) return 'Limit';
    return 'Avoid';
  };

  // Smart tip
  const tip = result.appearance_tip || result.diet_reason || result.bloat_reason || null;

  const analyzeIngredients = async () => {
    if (ingredientResult || loadingIngredients) return;
    setLoadingIngredients(true);
    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      prompt: `Analyze every ingredient in: "${result.name}". Ingredients: "${result.ingredients_text || 'typical for this product type'}". For each: name, body_effect, safety_rating ("Green"/"Yellow"/"Red"), is_seed_oil, is_hidden_sugar, is_emulsifier, is_hormone_disruptor, is_allergen, allergen_name, is_artificial_sweetener, is_preservative, is_artificial_color, is_whole_food. Also: overall_verdict ("Clean"/"Mostly Clean"/"Mixed"/"Mostly Processed"/"Avoid"), verdict_reason. NEVER fail.`,
      response_json_schema: {
        type: 'object', properties: {
          ingredients: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, body_effect: { type: 'string' }, safety_rating: { type: 'string' }, is_seed_oil: { type: 'boolean' }, is_hidden_sugar: { type: 'boolean' }, is_emulsifier: { type: 'boolean' }, is_hormone_disruptor: { type: 'boolean' }, is_allergen: { type: 'boolean' }, allergen_name: { type: 'string' }, is_artificial_sweetener: { type: 'boolean' }, is_preservative: { type: 'boolean' }, is_artificial_color: { type: 'boolean' }, is_whole_food: { type: 'boolean' } } } },
          overall_verdict: { type: 'string' }, verdict_reason: { type: 'string' },
        },
      },
    });
    setIngredientResult(r.result);
    setLoadingIngredients(false);
  };

  const appearanceImpactStyle = {
    Excellent: { bg: '#dcfce7', text: '#16a34a' }, Good: { bg: '#d1fae5', text: '#059669' },
    Neutral: { bg: '#f3f4f6', text: '#6b7280' }, Avoid: { bg: '#fee2e2', text: '#dc2626' },
  };

  // ─── Slide 0: Score + Macros (new design) ──────────────────────────────────
  const slide0 = (
    <div className="pb-4 fade-in-up">
      {/* Score + macro bars side by side */}
      <div className="flex items-start gap-4 mb-4">
        {/* Macro bars */}
        <div className="flex-1 space-y-3 pt-1">
          <MacroBarRow label="Sugar" value={sugar} max={(result.sugar || 0) * 5 || 50} color="#F97316" />
          <MacroBarRow label="Fats" value={fat} max={(result.fat || 0) * 5 || 50} color="#F5C842" />
          <MacroBarRow label="Carbs" value={carbs} max={(result.carbs || 0) * 5 || 100} color="#6CC5A0" />
          <MacroBarRow label="Protein" value={prot} max={(result.protein || 0) * 5 || 50} color="#38BDF8" />
        </div>
        {/* Dotted score circle */}
        <DottedScoreCircle score={result.health_score ? Math.round(result.health_score * 10) : 0} label={scoreLabel()} />
      </div>

      {/* Calories strip */}
      <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔥</span>
          <span className="text-xs text-gray-500">Calories</span>
        </div>
        <span className="text-xl font-extrabold text-gray-900">{cal} <span className="text-xs font-semibold text-gray-400">kcal</span></span>
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 py-1">
          <button onClick={() => setServings(s => Math.max(0.5, s - 0.5))} className="text-gray-400 text-sm font-bold w-4 text-center">−</button>
          <span className="text-xs font-semibold text-gray-800 px-1">{servings}×</span>
          <button onClick={() => setServings(s => s + 0.5)} className="text-gray-400 text-sm font-bold w-4 text-center">+</button>
        </div>
      </div>

      {/* Sodium + fiber mini row */}
      <div className="flex gap-2 mb-3">
        {[['Sodium', `${sodium}mg`], ['Fiber', `${Math.round((result.fiber || 0) * servings * 10) / 10}g`]].map(([l, v]) => (
          <div key={l} className="flex-1 bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{l}</span>
            <span className="text-xs font-bold text-gray-700">{v}</span>
          </div>
        ))}
      </div>

      {/* Tip box */}
      {tip && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">💡 Tip</p>
          <p className="text-xs text-blue-700 leading-relaxed">{tip}</p>
        </div>
      )}
    </div>
  );

  // ─── Slide 1: AI verdict ────────────────────────────────────────────────────
  const slide1 = result.is_appearance_mode ? (
    <div className="pb-4 space-y-2 fade-in-up">
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
      {result.skin_impact && <div className="bg-gray-50 rounded-2xl p-3"><p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Skin Impact</p><p className="text-xs text-gray-700">{result.skin_impact}</p></div>}
      {result.collagen_effect && <div className="bg-gray-50 rounded-2xl p-3"><div className="flex items-center justify-between mb-0.5"><p className="text-[10px] font-bold text-gray-500 uppercase">Collagen</p><PillBadge value={result.collagen_effect} /></div>{result.collagen_reason && <p className="text-xs text-gray-500">{result.collagen_reason}</p>}</div>}
      {result.hormone_effect && <div className="bg-gray-50 rounded-2xl p-3"><div className="flex items-center justify-between mb-0.5"><p className="text-[10px] font-bold text-gray-500 uppercase">Hormone</p><PillBadge value={result.hormone_effect} /></div>{result.hormone_reason && <p className="text-xs text-gray-500">{result.hormone_reason}</p>}</div>}
      {result.tomorrow_face && <div className="bg-purple-50 rounded-2xl p-3"><p className="text-[10px] font-bold text-purple-600 uppercase mb-0.5">😴 Tomorrow's Face</p><p className="text-xs text-purple-700">{result.tomorrow_face}</p></div>}
    </div>
  ) : (
    <div className="pb-4 fade-in-up">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Body & Diet Analysis</p>
      <Row label="Diet Compatibility" value={result.diet_compatibility} note={result.diet_reason} />
      <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
      <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
      <Row label="Gut Health" value={result.gut_health} note={result.gut_note} />
      <Row label="Inflammation" value={result.inflammation} />
      <Row label="Processing" value={result.processing_level} />
    </div>
  );

  // ─── Slide 2: Appearance ────────────────────────────────────────────────────
  const slide2 = result.is_appearance_mode ? (
    <div className="pb-4 space-y-3 fade-in-up">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Macros (Reference Only)</p>
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        {[['Calories', `${cal} kcal`], ['Protein', `${prot}g`], ['Carbs', `${carbs}g`], ['Fat', `${fat}g`], ['Sugar', `${sugar}g`], ['Sodium', `${sodium}mg`]].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between"><span className="text-xs text-gray-500">{l}</span><span className="text-xs font-semibold text-gray-700">{v}</span></div>
        ))}
      </div>
      {result.processing_level && <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"><span className="text-xs text-gray-500">Processing Level</span><PillBadge value={result.processing_level} /></div>}
    </div>
  ) : (
    <div className="pb-4 space-y-3 fade-in-up">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Appearance & More</p>
      {result.appearance_tip && <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-bold text-gray-700 mb-1">✨ Appearance Tip</p><p className="text-xs text-gray-500 leading-relaxed">{result.appearance_tip}</p></div>}
      {result.tomorrow_face && <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-bold text-gray-700 mb-1">😴 Tomorrow's Face</p><p className="text-xs text-gray-500 leading-relaxed">{result.tomorrow_face_note || result.tomorrow_face}</p></div>}
      {result.hormone_impact && <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-bold text-gray-700 mb-1">⚡ Hormone Impact</p><p className="text-xs text-gray-500 leading-relaxed">{result.hormone_note || result.hormone_impact}</p></div>}
      {result.allergens?.length > 0 && <div className="bg-red-50 rounded-2xl p-3"><p className="text-xs font-bold text-red-700 mb-1">⚠️ Allergens</p><div className="flex flex-wrap gap-1">{result.allergens.map(a => <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 capitalize">{a}</span>)}</div></div>}
    </div>
  );

  // ─── Slide 3: Ingredients ───────────────────────────────────────────────────
  const slide3 = (
    <div className="pb-4 fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingredients</p>
        {!ingredientResult && (
          <button onClick={analyzeIngredients} disabled={loadingIngredients} className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {loadingIngredients ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {loadingIngredients ? 'Analyzing...' : 'Analyze'}
          </button>
        )}
      </div>
      {parsedIngredients.length > 0 && !ingredientResult && (
        <div className="space-y-1.5 mb-3">
          {parsedIngredients.map((name, i) => <div key={i} className="bg-gray-50 rounded-xl px-4 py-2.5"><span className="text-sm font-medium text-gray-800">{name}</span></div>)}
        </div>
      )}
      {ingredientResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-gray-800">Full Analysis</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: (verdictColor[ingredientResult.overall_verdict] || '#888') + '20', color: verdictColor[ingredientResult.overall_verdict] || '#888' }}>{ingredientResult.overall_verdict}</span>
          </div>
          <p className="text-[10px] text-gray-400 mb-2">{ingredientResult.verdict_reason}</p>
          {(ingredientResult.ingredients || []).map((ing, i) => {
            const sc = safetyColor[ing.safety_rating] || safetyColor.Yellow;
            const flags = [ing.is_seed_oil && 'Seed Oil', ing.is_hidden_sugar && 'Hidden Sugar', ing.is_emulsifier && 'Emulsifier', ing.is_hormone_disruptor && 'Hormone Disruptor', ing.is_allergen && `Allergen${ing.allergen_name ? `: ${ing.allergen_name}` : ''}`, ing.is_artificial_sweetener && 'Artificial Sweetener', ing.is_preservative && 'Preservative', ing.is_artificial_color && 'Artificial Color', ing.is_whole_food && '✓ Whole Food'].filter(Boolean);
            return (
              <div key={i} className="bg-gray-50 rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text }}>{ing.safety_rating}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{ing.body_effect}</p>
                {flags.length > 0 && <div className="flex flex-wrap gap-1 mt-1.5">{flags.map(f => <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{f}</span>)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const allSlides = [slide0, slide1, slide2, slide3];
  const slideLabels = result.is_appearance_mode
    ? ['Score', 'Appearance', 'Macros', 'Ingredients']
    : ['Score', 'Body', 'Appearance', 'Ingredients'];

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && slide < allSlides.length - 1) setSlide(s => s + 1);
    if (diff < -50 && slide > 0) setSlide(s => s - 1);
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Top nav */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-12 pb-3 border-b border-gray-100 fade-in-up">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="text-center flex-1 px-3">
          <p className="text-sm font-bold text-gray-900 truncate">{result.name}</p>
          <p className="text-xs text-gray-400">{result.serving_size || 'per serving'}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Tab pills */}
      <div className="shrink-0 px-4 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar fade-in-up-2">
        {slideLabels.map((label, i) => (
          <button key={label} onClick={() => setSlide(i)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full shrink-0 transition-all"
            style={{ background: slide === i ? '#1a1a1a' : '#f3f4f6', color: slide === i ? 'white' : '#6b7280' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div className="flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {allSlides.map((s, i) => (
            <div key={i} className="min-w-full h-full overflow-y-auto px-4 pt-3">{s}</div>
          ))}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="shrink-0 px-4 pb-8 pt-3 border-t border-gray-100 bg-white fade-in-up-6">
        <div className="flex gap-2 mb-2">
          <button onClick={onScanAnother} className="flex-1 h-11 rounded-full border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 bg-white">
            <Sparkles className="w-3.5 h-3.5" /> Rescan
          </button>
          <button onClick={() => onLogAnalysisOnly && onLogAnalysisOnly()} className="flex-1 h-11 rounded-full border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 bg-white">
            Analysis Only
          </button>
        </div>
        <button onClick={onLog} className="w-full h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
          Log as Meal
        </button>
      </div>
    </div>
  );
}