import React, { useState, useRef } from 'react';
import { ArrowLeft, Sparkles, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseIngredients(result) {
  if (!result.ingredients_text) return [];
  return result.ingredients_text.split(/,|;/).map(s => s.trim()).filter(Boolean).slice(0, 8);
}

const PillBadge = ({ value }) => {
  const v = (value || '').toLowerCase();
  const colors = {
    yes: 'bg-green-100 text-green-700', low: 'bg-green-100 text-green-700',
    'whole food': 'bg-green-100 text-green-700', 'minimally processed': 'bg-blue-100 text-blue-700',
    limit: 'bg-yellow-100 text-yellow-700', medium: 'bg-yellow-100 text-yellow-700',
    neutral: 'bg-gray-100 text-gray-600', processed: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700', no: 'bg-red-100 text-red-700',
    'ultra processed': 'bg-red-100 text-red-700',
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

// ─── Verdict badge ─────────────────────────────────────────────────────────────
function VerdictBadge({ result }) {
  const raw = (result.diet_compatibility || result.appearance_impact || result.verdict || '').toLowerCase();
  let label, bg;
  if (['yes', 'excellent', 'good', 'clean', 'recommended'].some(k => raw.includes(k))) {
    label = 'YES'; bg = '#22c55e';
  } else if (['limit', 'moderate', 'mixed', 'neutral', 'maybe', 'caution'].some(k => raw.includes(k))) {
    label = 'VALID'; bg = '#f97316';
  } else {
    label = 'NO'; bg = '#ef4444';
  }
  return (
    <div className="shrink-0 rounded-2xl px-5 py-3 flex items-center justify-center"
      style={{ background: bg, minWidth: 72, alignSelf: 'flex-end', marginBottom: 4 }}>
      <span className="text-2xl font-black text-white leading-none">{label}</span>
    </div>
  );
}

// ─── Macro ring ───────────────────────────────────────────────────────────────
function MacroRing({ label, emoji, value, max, color }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const dash = pct * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: 80, height: 80 }}>
        <svg width={80} height={80}>
          <circle cx={40} cy={40} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7} />
          <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: 22 }}>{emoji}</span>
        </div>
      </div>
      <p className="text-xs font-bold text-gray-800">{label}</p>
      <p className="text-[11px] text-gray-400">{value}/<span style={{ color }}>{max}g</span></p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FoodScanResult({ result, onLog, onLogAnalysisOnly, onScanAnother, onBack }) {
  const [slide, setSlide] = useState(0);
  const [ingredientResult, setIngredientResult] = useState(null);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const touchStartX = useRef(null);

  const verdictColor = { Clean: '#16a34a', 'Mostly Clean': '#22c55e', Mixed: '#ca8a04', 'Mostly Processed': '#ea580c', Avoid: '#dc2626' };

  const cal = Math.round(result.calories || 0);
  const prot = Math.round((result.protein || 0) * 10) / 10;
  const carbs = Math.round((result.carbs || 0) * 10) / 10;
  const fat = Math.round((result.fat || 0) * 10) / 10;
  const sugar = Math.round((result.sugar || 0) * 10) / 10;
  const sodium = Math.round(result.sodium || 0);
  const parsedIngredients = parseIngredients(result);

  const descText = result.diet_reason || result.appearance_reason || result.bloat_reason || result.appearance_tip || '';

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
    setIngredientResult(r?.result || r);
    setLoadingIngredients(false);
  };

  const appearanceImpactStyle = {
    Excellent: { bg: '#dcfce7', text: '#16a34a' }, Good: { bg: '#d1fae5', text: '#059669' },
    Neutral: { bg: '#f3f4f6', text: '#6b7280' }, Avoid: { bg: '#fee2e2', text: '#dc2626' },
  };

  // ─── Slide 0: Macros (main page matching design) ────────────────────────────
  const slide0 = (
    <div className="pb-6 fade-in-up space-y-4">
      {/* Calorie hero card */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Per Serving</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900">{cal.toLocaleString()}</span>
              <span className="text-base font-semibold text-gray-400 ml-1">kcal</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{result.serving_size || 'per serving'}</p>
          </div>
          <span style={{ fontSize: 48 }}>🔥</span>
        </div>
      </div>

      {/* Macro rings */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
        <div className="flex justify-around">
          <MacroRing label="Protein" emoji="🫘" value={prot} max={Math.max(prot * 2, 50)} color="#3b82f6" />
          <MacroRing label="Carbs" emoji="🌾" value={carbs} max={Math.max(carbs * 2, 100)} color="#22c55e" />
          <MacroRing label="Fat" emoji="💧" value={fat} max={Math.max(fat * 2, 40)} color="#f59e0b" />
        </div>
      </div>

      {/* More macros */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Sugar', `${sugar}g`, '#ef4444'], ['Sodium', `${sodium}mg`, '#8b5cf6'], ['Fiber', `${Math.round((result.fiber || 0) * 10) / 10}g`, '#10b981']].map(([l, v, c]) => (
            <div key={l}>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{l}</p>
              <p className="text-lg font-black mt-0.5" style={{ color: c }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Description / diet reason */}
      {descText ? (
        <p className="text-sm text-gray-400 leading-relaxed px-1">
          {descExpanded ? descText : descText.slice(0, 130)}
          {!descExpanded && descText.length > 130 && (
            <> <button onClick={() => setDescExpanded(true)} className="font-bold text-gray-700">Read More</button></>
          )}
        </p>
      ) : null}
    </div>
  );

  // ─── Slide 1: Body / Appearance ──────────────────────────────────────────────
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
    <div className="pb-4 fade-in-up space-y-1">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Body & Diet</p>
      <Row label="Diet Compatibility" value={result.diet_compatibility} note={result.diet_reason} />
      <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
      <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
      <Row label="Gut Health" value={result.gut_health} note={result.gut_note} />
      <Row label="Inflammation" value={result.inflammation} />
      <Row label="Processing" value={result.processing_level} />
      {result.allergens?.length > 0 && <div className="bg-red-50 rounded-2xl p-3 mt-2"><p className="text-xs font-bold text-red-700 mb-1">⚠️ Allergens</p><div className="flex flex-wrap gap-1">{result.allergens.map(a => <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 capitalize">{a}</span>)}</div></div>}
    </div>
  );

  // ─── Slide 2: Appearance tips / Macros detail ────────────────────────────────
  const slide2 = result.is_appearance_mode ? (
    <div className="pb-4 space-y-3 fade-in-up">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Macros</p>
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        {[['Calories', `${cal} kcal`], ['Protein', `${prot}g`], ['Carbs', `${carbs}g`], ['Fat', `${fat}g`], ['Sugar', `${sugar}g`], ['Sodium', `${sodium}mg`]].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between"><span className="text-xs text-gray-500">{l}</span><span className="text-xs font-semibold text-gray-700">{v}</span></div>
        ))}
      </div>
      {result.processing_level && <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3"><span className="text-xs text-gray-500">Processing Level</span><PillBadge value={result.processing_level} /></div>}
    </div>
  ) : (
    <div className="pb-4 space-y-3 fade-in-up">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Appearance & Skin</p>
      {result.appearance_tip && <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-bold text-gray-700 mb-1">✨ Tip</p><p className="text-xs text-gray-500 leading-relaxed">{result.appearance_tip}</p></div>}
      {result.tomorrow_face && <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-bold text-gray-700 mb-1">😴 Tomorrow's Face</p><p className="text-xs text-gray-500 leading-relaxed">{result.tomorrow_face_note || result.tomorrow_face}</p></div>}
      {result.hormone_impact && <div className="bg-gray-50 rounded-2xl p-4"><p className="text-xs font-bold text-gray-700 mb-1">⚡ Hormone</p><p className="text-xs text-gray-500 leading-relaxed">{result.hormone_note || result.hormone_impact}</p></div>}
    </div>
  );

  // ─── Slide 3: Ingredients ────────────────────────────────────────────────────
  const slide3 = (
    <div className="pb-4 fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingredients</p>
        {!ingredientResult && (
          <button onClick={analyzeIngredients} disabled={loadingIngredients}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            {loadingIngredients ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {loadingIngredients ? 'Analyzing...' : 'Analyze'}
          </button>
        )}
      </div>
      {parsedIngredients.length > 0 && !ingredientResult && (
        <div className="space-y-1.5 mb-3">
          {parsedIngredients.map((name, i) => (
            <div key={i} className="bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-gray-800">{name}</span>
            </div>
          ))}
        </div>
      )}
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
            const safetyColor = { Green: { bg: '#dcfce7', text: '#16a34a' }, Yellow: { bg: '#fef9c3', text: '#ca8a04' }, Red: { bg: '#fee2e2', text: '#dc2626' } };
            const sc = safetyColor[ing.safety_rating] || safetyColor.Yellow;
            const flags = [
              ing.is_seed_oil && 'Seed Oil', ing.is_hidden_sugar && 'Hidden Sugar',
              ing.is_emulsifier && 'Emulsifier', ing.is_hormone_disruptor && 'Hormone Disruptor',
              ing.is_allergen && `Allergen${ing.allergen_name ? `: ${ing.allergen_name}` : ''}`,
              ing.is_artificial_sweetener && 'Artificial Sweetener', ing.is_preservative && 'Preservative',
              ing.is_artificial_color && 'Artificial Color', ing.is_whole_food && '✓ Whole Food',
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
                    {flags.map(f => <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{f}</span>)}
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
    ? ['Macros', 'Appearance', 'Detail', 'Ingredients']
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
    <div className="fixed inset-0 bg-white flex flex-col overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── 1. Product image — full width, no border-radius ── */}
      <div className="shrink-0 relative bg-gray-50" style={{ height: 210 }}>
        {result.image_url ? (
          <img src={result.image_url} alt={result.name}
            className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🍽️</div>
        )}
        <button onClick={onBack}
          className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* ── 2. Name + verdict badge (aligned like design: name left, badge bottom-right) ── */}
      <div className="shrink-0 px-5 pt-4 pb-1">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[28px] font-black text-gray-900 leading-tight flex-1" style={{ letterSpacing: '-0.02em' }}>
            {result.name}
          </h1>
          <VerdictBadge result={result} />
        </div>
      </div>

      {/* ── 3. Dot page indicators ── */}
      <div className="shrink-0 flex items-center gap-1.5 px-5 pb-2 pt-1">
        {allSlides.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === slide ? 22 : 7,
              height: 7,
              background: i === slide ? '#1a1a1a' : '#d1d5db',
            }} />
        ))}
      </div>

      {/* ── 4. Tab pills ── */}
      <div className="shrink-0 px-5 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {slideLabels.map((label, i) => (
          <button key={label} onClick={() => setSlide(i)}
            className="text-xs font-semibold px-4 py-1.5 rounded-full shrink-0 transition-all"
            style={{ background: slide === i ? '#1a1a1a' : '#f3f4f6', color: slide === i ? 'white' : '#6b7280' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── 5. Swipeable content ── */}
      <div className="flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}>
          {allSlides.map((s, i) => (
            <div key={i} className="min-w-full h-full overflow-y-auto px-5 pt-3">{s}</div>
          ))}
        </div>
      </div>

      {/* ── 6. Bottom buttons ── */}
      <div className="shrink-0 px-5 pb-8 pt-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 mb-2">
          <button onClick={onScanAnother}
            className="flex-1 h-11 rounded-full border border-gray-200 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600">
            <Sparkles className="w-3.5 h-3.5" /> Rescan
          </button>
          <button onClick={() => onLogAnalysisOnly && onLogAnalysisOnly()}
            className="flex-1 h-11 rounded-full border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
            Analysis Only
          </button>
        </div>
        <button onClick={onLog}
          className="w-full h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
          Log as Meal
        </button>
      </div>
    </div>
  );
}