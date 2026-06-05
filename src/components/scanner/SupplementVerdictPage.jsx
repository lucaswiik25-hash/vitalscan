import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const ratingColor = (r) => {
  const v = (r || '').toLowerCase();
  if (v === 'beneficial' || v === 'safe' || v === 'high' || v === 'correctly dosed') return { bg: '#dcfce7', text: '#16a34a' };
  if (v === 'moderate' || v === 'medium' || v === 'caution' || v === 'underdosed') return { bg: '#fef9c3', text: '#ca8a04' };
  return { bg: '#fee2e2', text: '#dc2626' };
};

const verdictConfig = {
  yes: { emoji: '✅', color: '#16a34a', label: 'Recommended' },
  maybe: { emoji: '⚠️', color: '#ca8a04', label: 'Use with Caution' },
  no: { emoji: '🚫', color: '#dc2626', label: 'Avoid' },
  recommended: { emoji: '✅', color: '#16a34a', label: 'Recommended' },
  'use with caution': { emoji: '⚠️', color: '#ca8a04', label: 'Use with Caution' },
  avoid: { emoji: '🚫', color: '#dc2626', label: 'Avoid' },
};

function ScoreDial({ score, label }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#ca8a04' : '#dc2626';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: 76, height: 76 }}>
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={r} fill="none" stroke="#f0f0f0" strokeWidth="6" />
          <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '38px 38px' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{pct}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function IngredientRow({ ing }) {
  const [open, setOpen] = useState(false);
  const rc = ratingColor(ing.flag || ing.quality_rating || ing.safety_rating);
  return (
    <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 10, marginBottom: 10 }}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }} className="flex-1 truncate">{ing.name}</span>
          {(ing.flag || ing.quality_rating || ing.safety_rating) && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: rc.bg, color: rc.text, whiteSpace: 'nowrap' }}>
              {ing.flag || ing.quality_rating || ing.safety_rating}
            </span>
          )}
        </div>
        <div className="ml-2 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 6 }}>
          {ing.amount && <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>Amount: {ing.amount}</p>}
          {ing.body_benefit && <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>✅ {ing.body_benefit}</p>}
          {ing.body_risk && <p style={{ fontSize: 12, color: '#dc2626' }}>⚠️ {ing.body_risk}</p>}
          {ing.bioavailability && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Bioavailability: {ing.bioavailability}</p>}
        </div>
      )}
    </div>
  );
}

export default function SupplementVerdictPage({ result, onBack }) {
  const verdictKey = (result?.verdict || '').toLowerCase();
  const vc = verdictConfig[verdictKey] || verdictConfig['maybe'];
  const ingredients = result?.ingredients || [];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: '#F7F8FA' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center px-5 pt-12 pb-4 bg-white" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center mr-3">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111', lineHeight: 1.2 }} className="truncate">
            {result?.product_name || 'Supplement'}
          </p>
          {result?.brand && <p style={{ fontSize: 13, color: '#9CA3AF' }}>{result.brand}</p>}
        </div>
      </div>

      <div className="flex-1 px-5 py-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Verdict + Scores */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 22 }}>{vc.emoji}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: vc.color }}>{vc.label}</span>
              </div>
              {result?.verdict_reason && (
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{result.verdict_reason}</p>
              )}
            </div>
            <div className="flex gap-3">
              {result?.quality_score != null && <ScoreDial score={result.quality_score} label="Quality" />}
            </div>
          </div>
        </div>

        {/* Usage info */}
        {(result?.best_time_to_take || result?.food_note || result?.absorption_tip) && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 10 }}>Usage</p>
            {result.serving_size && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>💊 Serving: {result.serving_size}</p>}
            {result.best_time_to_take && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>⏰ {result.best_time_to_take}</p>}
            {result.food_note && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>🍽️ {result.food_note}</p>}
            {result.absorption_tip && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>💡 {result.absorption_tip}</p>}
            {result.cycle_recommendation && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>🔄 {result.cycle_recommendation}</p>}
            {result.stack_with && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 6 }}>➕ {result.stack_with}</p>}
            {result.results_timeline && <p style={{ fontSize: 13, color: '#6B7280' }}>⏳ {result.results_timeline}</p>}
            {result.interactions && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6 }}>⚠️ {result.interactions}</p>}
          </div>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 12 }}>
              Ingredients ({ingredients.length})
            </p>
            {ingredients.map((ing, idx) => (
              <IngredientRow key={idx} ing={ing} />
            ))}
          </div>
        )}

        {/* Other ingredients flags */}
        {result?.other_ingredients_flags?.length > 0 && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 10 }}>Other Ingredients</p>
            <div className="flex flex-wrap gap-2">
              {result.other_ingredients_flags.map((f, i) => (
                <span key={i} style={{ fontSize: 12, background: '#F7F8FA', color: '#6B7280', padding: '3px 10px', borderRadius: 99, border: '1px solid #e5e7eb' }}>{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}