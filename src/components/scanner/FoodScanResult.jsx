import React, { useState, useRef } from 'react';
import { ArrowLeft, Loader2, Plus, X, Flame, Droplets, Wheat, Bean, Zap, Dna, Wind, Activity, Leaf, ShoppingCart, BarChart2, FlaskConical, Apple } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ─── Icon Module (replaces all emojis) ───────────────────────────────────────
function IconModule({ icon: Icon, bg, color, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon style={{ width: size * 0.45, height: size * 0.45, color, strokeWidth: 1.8 }} />
    </div>
  );
}

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
    <div className="shrink-0 rounded-xl px-3 py-1.5 flex items-center justify-center"
      style={{ background: bg }}>
      <span className="text-sm font-black text-white leading-none">{label}</span>
    </div>
  );
}

// ─── Liquid glass action FAB ──────────────────────────────────────────────────
function ActionFAB({ onLog, onLogAnalysisOnly, onScanAnother }) {
  const [open, setOpen] = useState(false);

  const glassStyle = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
  };

  const actions = [
    { label: 'Log as Meal', icon: Apple, bg: '#f0fdf4', color: '#16a34a', fn: onLog },
    { label: 'Analysis Only', icon: BarChart2, bg: '#eff6ff', color: '#3b82f6', fn: onLogAnalysisOnly },
    { label: 'Rescan', icon: FlaskConical, bg: '#faf5ff', color: '#9333ea', fn: onScanAnother },
  ];

  return (
    <div className="relative shrink-0 flex flex-col items-center" style={{ alignSelf: 'flex-end', marginBottom: 4 }}>
      {/* Action items — appear above the button */}
      {open && (
        <div className="absolute bottom-14 right-0 flex flex-col gap-2 items-end" style={{ zIndex: 50 }}>
          {actions.map(({ label, icon: Icon, bg, color, fn }) => (
            <button
              key={label}
              onClick={() => { setOpen(false); fn && fn(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl active:scale-95 transition-transform"
              style={{ ...glassStyle, whiteSpace: 'nowrap' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 14, height: 14, color, strokeWidth: 2 }} />
              </div>
              <span className="text-sm font-semibold text-gray-800">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all"
        style={glassStyle}
      >
        {open
          ? <X style={{ width: 18, height: 18, color: '#374151', strokeWidth: 2.5 }} />
          : <Plus style={{ width: 18, height: 18, color: '#374151', strokeWidth: 2.5 }} />
        }
      </button>
    </div>
  );
}

// ─── Macro ring ───────────────────────────────────────────────────────────────
function MacroRing({ icon: Icon, iconBg, iconColor, label, value, max, color }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const dash = pct * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: 76, height: 76 }}>
        <svg width={76} height={76}>
          <circle cx={38} cy={38} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
          <circle cx={38} cy={38} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 38 38)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <IconModule icon={Icon} bg={iconBg} color={iconColor} size={34} />
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
  const touchStartX = useRef(null);

  const verdictColor = { Clean: '#16a34a', 'Mostly Clean': '#22c55e', Mixed: '#ca8a04', 'Mostly Processed': '#ea580c', Avoid: '#dc2626' };

  const cal = Math.round(result.calories || 0);
  const prot = Math.round((result.protein || 0) * 10) / 10;
  const carbs = Math.round((result.carbs || 0) * 10) / 10;
  const fat = Math.round((result.fat || 0) * 10) / 10;
  const sugar = Math.round((result.sugar || 0) * 10) / 10;
  const fiber = Math.round((result.fiber || 0) * 10) / 10;
  const sodium = Math.round(result.sodium || 0);
  const parsedIngredients = parseIngredients(result);

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

  // ─── Slide 0: Calories ───────────────────────────────────────────────────────
  const slide0 = (
    <div className="pb-4 space-y-3 fade-in-up">
      <div className="bg-white rounded-[22px] p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Per Serving</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-gray-900">{cal.toLocaleString()}</span>
              <span className="text-base font-semibold text-gray-400 ml-1">kcal</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{result.serving_size || 'per serving'}</p>
          </div>
          <IconModule icon={Flame} bg="#fef3ed" color="#ea580c" size={56} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Sugar', val: `${sugar}g`, icon: Droplets, bg: '#fef2f2', color: '#ef4444' },
          { label: 'Sodium', val: `${sodium}mg`, icon: Zap, bg: '#f5f3ff', color: '#8b5cf6' },
          { label: 'Fiber', val: `${fiber}g`, icon: Leaf, bg: '#f0fdf4', color: '#16a34a' },
        ].map(({ label, val, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white rounded-[18px] p-3 flex flex-col gap-2" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <IconModule icon={Icon} bg={bg} color={color} size={36} />
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-base font-black" style={{ color }}>{val}</p>
            </div>
          </div>
        ))}
      </div>
      {result.diet_reason || result.appearance_reason ? (
        <div className="bg-white rounded-[18px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs text-gray-500 leading-relaxed">{result.diet_reason || result.appearance_reason}</p>
        </div>
      ) : null}
    </div>
  );

  // ─── Slide 1: Macros ─────────────────────────────────────────────────────────
  const slide1 = (
    <div className="pb-4 space-y-3 fade-in-up">
      <div className="bg-white rounded-[22px] p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Macronutrients</p>
        <div className="flex justify-around">
          <MacroRing icon={Bean} iconBg="#eff6ff" iconColor="#3b82f6" label="Protein" value={prot} max={Math.max(prot * 2, 50)} color="#3b82f6" />
          <MacroRing icon={Wheat} iconBg="#f0fdf4" iconColor="#22c55e" label="Carbs" value={carbs} max={Math.max(carbs * 2, 100)} color="#22c55e" />
          <MacroRing icon={Droplets} iconBg="#fffbeb" iconColor="#f59e0b" label="Fat" value={fat} max={Math.max(fat * 2, 40)} color="#f59e0b" />
        </div>
      </div>
      <div className="bg-white rounded-[22px] p-4 space-y-2" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {[['Calories', `${cal} kcal`], ['Protein', `${prot}g`], ['Carbs', `${carbs}g`], ['Fat', `${fat}g`], ['Sugar', `${sugar}g`], ['Fiber', `${fiber}g`], ['Sodium', `${sodium}mg`]].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-500">{l}</span>
            <span className="text-xs font-bold text-gray-800">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Slide 2: Body / Diet ────────────────────────────────────────────────────
  const slide2 = result.is_appearance_mode ? (
    <div className="pb-4 space-y-3 fade-in-up">
      {result.appearance_impact && (() => {
        const s = appearanceImpactStyle[result.appearance_impact] || appearanceImpactStyle.Neutral;
        return (
          <div className="rounded-[22px] p-4" style={{ background: s.bg, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: s.text }}>Appearance Impact</p>
              <span className="text-sm font-extrabold" style={{ color: s.text }}>{result.appearance_impact}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: s.text }}>{result.appearance_reason}</p>
          </div>
        );
      })()}
      <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
        <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
        {result.skin_impact && <Row label="Skin Impact" value={result.skin_impact} />}
        {result.collagen_effect && <Row label="Collagen" value={result.collagen_effect} note={result.collagen_reason} />}
        {result.hormone_effect && <Row label="Hormone" value={result.hormone_effect} note={result.hormone_reason} />}
      </div>
      {result.tomorrow_face && (
        <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-2">
            <IconModule icon={Activity} bg="#f5f3ff" color="#8b5cf6" size={36} />
            <p className="text-xs font-bold text-gray-700">Tomorrow's Face</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{result.tomorrow_face}</p>
        </div>
      )}
    </div>
  ) : (
    <div className="pb-4 space-y-3 fade-in-up">
      <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Body & Diet</p>
        <Row label="Diet Compatibility" value={result.diet_compatibility} note={result.diet_reason} />
        <Row label="Bloat Risk" value={result.bloat_risk} note={result.bloat_reason} />
        <Row label="Glycemic Impact" value={result.glycemic_impact} note={result.glycemic_reason} />
        <Row label="Gut Health" value={result.gut_health} note={result.gut_note} />
        <Row label="Inflammation" value={result.inflammation} />
        <Row label="Processing" value={result.processing_level} />
      </div>
      {result.allergens?.length > 0 && (
        <div className="bg-red-50 rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-2">
            <IconModule icon={Wind} bg="#fee2e2" color="#dc2626" size={32} />
            <p className="text-xs font-bold text-red-700">Allergens Detected</p>
          </div>
          <div className="flex flex-wrap gap-1">{result.allergens.map(a => <span key={a} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 capitalize">{a}</span>)}</div>
        </div>
      )}
    </div>
  );

  // ─── Slide 3: Appearance / Skin ──────────────────────────────────────────────
  const slide3 = result.is_appearance_mode ? (
    <div className="pb-4 space-y-3 fade-in-up">
      <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Macros Detail</p>
        {[['Calories', `${cal} kcal`], ['Protein', `${prot}g`], ['Carbs', `${carbs}g`], ['Fat', `${fat}g`], ['Sugar', `${sugar}g`], ['Sodium', `${sodium}mg`]].map(([l, v]) => (
          <div key={l} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-500">{l}</span>
            <span className="text-xs font-bold text-gray-800">{v}</span>
          </div>
        ))}
      </div>
      {result.processing_level && (
        <div className="flex items-center justify-between bg-white rounded-[18px] px-4 py-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <span className="text-xs text-gray-500">Processing Level</span><PillBadge value={result.processing_level} />
        </div>
      )}
    </div>
  ) : (
    <div className="pb-4 space-y-3 fade-in-up">
      {result.appearance_tip && (
        <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-2">
            <IconModule icon={Dna} bg="#fdf4ff" color="#c026d3" size={36} />
            <p className="text-xs font-bold text-gray-700">Appearance Tip</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{result.appearance_tip}</p>
        </div>
      )}
      {result.tomorrow_face && (
        <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-2">
            <IconModule icon={Activity} bg="#f5f3ff" color="#8b5cf6" size={36} />
            <p className="text-xs font-bold text-gray-700">Tomorrow's Face</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{result.tomorrow_face_note || result.tomorrow_face}</p>
        </div>
      )}
      {result.hormone_impact && (
        <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 mb-2">
            <IconModule icon={Zap} bg="#fffbeb" color="#f59e0b" size={36} />
            <p className="text-xs font-bold text-gray-700">Hormone Impact</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{result.hormone_note || result.hormone_impact}</p>
        </div>
      )}
    </div>
  );

  // ─── Slide 4: Ingredients ────────────────────────────────────────────────────
  const slide4 = (
    <div className="pb-4 fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ingredients</p>
        {!ingredientResult && (
          <button onClick={analyzeIngredients} disabled={loadingIngredients}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {loadingIngredients ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            {loadingIngredients ? 'Analyzing...' : 'Deep Analyze'}
          </button>
        )}
      </div>
      {parsedIngredients.length > 0 && !ingredientResult && (
        <div className="space-y-1.5 mb-3">
          {parsedIngredients.map((name, i) => (
            <div key={i} className="bg-white rounded-[14px] px-4 py-2.5" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
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
              style={{ background: (verdictColor[ingredientResult.overall_verdict] || '#888') + '22', color: verdictColor[ingredientResult.overall_verdict] || '#888' }}>
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
              ing.is_artificial_color && 'Artificial Color', ing.is_whole_food && 'Whole Food',
            ].filter(Boolean);
            return (
              <div key={i} className="bg-white rounded-[18px] p-3" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text }}>{ing.safety_rating}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{ing.body_effect}</p>
                {flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {flags.map(f => <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{f}</span>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const allSlides = [slide0, slide1, slide2, slide3, slide4];
  const slideLabels = result.is_appearance_mode
    ? ['Calories', 'Macros', 'Appearance', 'Detail', 'Ingredients']
    : ['Calories', 'Macros', 'Body', 'Appearance', 'Ingredients'];

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && slide < allSlides.length - 1) setSlide(s => s + 1);
    if (diff < -50 && slide > 0) setSlide(s => s - 1);
    touchStartX.current = null;
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── 1. Product image — white card, image covers full area ── */}
      <div className="shrink-0 mx-4 mt-12 mb-0 relative bg-white rounded-[20px] overflow-hidden"
        style={{ height: 170, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        {result.image_url ? (
          <img src={result.image_url} alt={result.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconModule icon={ShoppingCart} bg="#f3f4f6" color="#9ca3af" size={72} />
          </div>
        )}
        <button onClick={onBack}
          className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft style={{ width: 16, height: 16, color: 'white', strokeWidth: 2.5 }} />
        </button>
      </div>

      {/* ── 2. Name (full width) + verdict badge + action FAB inline ── */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <h1 className="text-[22px] font-black text-gray-900 leading-tight w-full" style={{ letterSpacing: '-0.02em' }}>
          {result.name?.length > 40 ? result.name.slice(0, 40).trim() + '…' : result.name}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <VerdictBadge result={result} />
          <ActionFAB onLog={onLog} onLogAnalysisOnly={onLogAnalysisOnly} onScanAnother={onScanAnother} />
        </div>
      </div>

      {/* ── 3. Dot page indicators — centered above content ── */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 pb-3">
        {allSlides.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className="rounded-full transition-all duration-200"
            style={{ width: i === slide ? 22 : 7, height: 7, background: i === slide ? '#1a1a1a' : '#d1d5db' }} />
        ))}
      </div>

      {/* ── 5. Swipeable content (no scroll on the container itself) ── */}
      <div className="flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}>
          {allSlides.map((s, i) => (
            <div key={i} className="min-w-full h-full overflow-y-auto px-4 pt-2 pb-4">{s}</div>
          ))}
        </div>
      </div>
    </div>
  );
}