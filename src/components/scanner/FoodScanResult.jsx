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

// ─── C-shaped rainbow dot arc ─────────────────────────────────────────────────
function DottedArcScore({ score, label }) {
  const total = 70;
  const size = 190;
  const cx = size / 2;
  const cy = size / 2;
  const r = 82;
  // C-shape: arc from bottom-left sweeping up and around to top-right, opening to the right
  // Start at ~210° (bottom-left), sweep 240° counterclockwise to ~-30° (top-right)
  const startDeg = 210;
  const sweepDeg = 240;

  // Interpolate color along the arc: green → yellow-green → orange → yellow
  const lerpColor = (t) => {
    const stops = [
      { t: 0,    r: 34,  g: 197, b: 94  }, // green
      { t: 0.33, r: 132, g: 204, b: 22  }, // lime
      { t: 0.6,  r: 249, g: 115, b: 22  }, // orange
      { t: 1,    r: 234, g: 179, b: 8   }, // yellow
    ];
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1].t) i++;
    const a = stops[i], b = stops[i + 1];
    const f = (t - a.t) / (b.t - a.t);
    const ri = Math.round(a.r + (b.r - a.r) * f);
    const gi = Math.round(a.g + (b.g - a.g) * f);
    const bi = Math.round(a.b + (b.b - a.b) * f);
    return `rgb(${ri},${gi},${bi})`;
  };

  const dots = Array.from({ length: total }, (_, i) => {
    const t = i / (total - 1);
    // Go counterclockwise: start at startDeg, decrease angle
    const deg = startDeg - sweepDeg * t;
    const rad = deg * (Math.PI / 180);
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    return { x, y, color: lerpColor(t) };
  });

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={4.5} fill={d.color} />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 72, fontWeight: 900, color: '#111', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginTop: 4, letterSpacing: '0.02em' }}>{label || 'Score'}</span>
      </div>
    </div>
  );
}

// ─── Macro bar row (left column style) ───────────────────────────────────────
function MacroBarRow({ label, value, unit, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const display = value != null ? (Number.isInteger(value) ? value : value.toFixed(1)) : 0;
  return (
    <div>
      <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      <div className="text-[26px] font-black text-gray-900 leading-tight">
        {display}<span className="text-sm font-semibold text-gray-400 ml-0.5">{unit || 'g'}</span>
      </div>
      <div className="mt-1 rounded-full overflow-hidden" style={{ width: '55%', height: 4, background: '#e5e7eb' }}>
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
  const [descExpanded, setDescExpanded] = useState(false);
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

  const descText = tip || result.diet_reason || result.bloat_reason || result.appearance_tip || '';

  // ─── Slide 0: Redesigned Score tab ─────────────────────────────────────────
  const slide0 = (
    <div className="pb-4 fade-in-up flex flex-col gap-5">
      {/* Hero: macros left + dot arc right */}
      <div className="flex items-center gap-0">
        {/* Left: macro column */}
        <div className="flex flex-col gap-4" style={{ flex: '0 0 42%' }}>
          <MacroBarRow label="Sugar" value={sugar} max={(result.sugar || 1) * 5} color="#ef4444" />
          <MacroBarRow label="Fats" value={fat} max={(result.fat || 1) * 5} color="#eab308" />
          <MacroBarRow label="Carbs" value={carbs} max={(result.carbs || 1) * 5} color="#22c55e" />
          <MacroBarRow label="Protein" value={prot} max={(result.protein || 1) * 5} color="#38bdf8" />
        </div>
        {/* Right: C-shape arc */}
        <div style={{ flex: '0 0 58%', display: 'flex', justifyContent: 'center' }}>
          <DottedArcScore score={result.health_score ? Math.round(result.health_score * 10) : 0} label={scoreLabel()} />
        </div>
      </div>

      {/* Description */}
      {descText ? (
        <div>
          <p className="text-sm text-gray-400 leading-relaxed">
            {descExpanded ? descText : descText.slice(0, 120)}
            {!descExpanded && descText.length > 120 && (
              <> <button onClick={() => setDescExpanded(true)} className="font-bold text-gray-700">Read More</button></>
            )}
          </p>
        </div>
      ) : null}
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

  // Verdict for the badge
  const verdictBadge = result.diet_compatibility || result.appearance_impact || result.verdict || null;
  const verdictBadgeColor = (() => {
    const v = (verdictBadge || '').toLowerCase();
    if (['yes', 'excellent', 'good', 'clean'].some(k => v.includes(k))) return { bg: '#dcfce7', text: '#16a34a', label: 'YES' };
    if (['limit', 'moderate', 'mixed', 'neutral'].some(k => v.includes(k))) return { bg: '#fef9c3', text: '#ca8a04', label: 'VALID' };
    return { bg: '#fee2e2', text: '#dc2626', label: 'NO' };
  })();

  return (
    <div className="fixed inset-0 bg-white flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Product image — rectangular hero */}
      <div className="shrink-0 relative" style={{ height: 220 }}>
        {result.image_url ? (
          <img src={result.image_url} alt={result.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl" style={{ background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' }}>
            🍽️
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)' }} />
        {/* Back button */}
        <button onClick={onBack} className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Header: name + verdict badge */}
      <div className="shrink-0 bg-white px-4 pt-4 pb-2 fade-in-up">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xl font-extrabold text-gray-900 leading-tight">{result.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{result.serving_size || 'per serving'}</p>
          </div>
          {verdictBadge && (
            <div className="shrink-0 rounded-2xl px-4 py-2 text-center" style={{ background: verdictBadgeColor.bg }}>
              <p className="text-lg font-black" style={{ color: verdictBadgeColor.text }}>{verdictBadgeColor.label}</p>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: verdictBadgeColor.text }}>verdict</p>
            </div>
          )}
        </div>
      </div>

      {/* Dot page indicator */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 py-2">
        {allSlides.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className="rounded-full transition-all"
            style={{ width: i === slide ? 18 : 6, height: 6, background: i === slide ? '#1a1a1a' : '#d1d5db' }} />
        ))}
      </div>

      {/* Tab pills */}
      <div className="shrink-0 px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar fade-in-up-2">
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