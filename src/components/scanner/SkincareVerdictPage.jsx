import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const safetyColor = (r) => {
  const v = (r || '').toLowerCase();
  if (v === 'safe') return { bg: '#dcfce7', text: '#16a34a' };
  if (v === 'caution') return { bg: '#fef9c3', text: '#ca8a04' };
  return { bg: '#fee2e2', text: '#dc2626' };
};

const verdictConfig = {
  recommended: { emoji: '✅', color: '#16a34a', label: 'Recommended' },
  'use with caution': { emoji: '⚠️', color: '#ca8a04', label: 'Use with Caution' },
  avoid: { emoji: '🚫', color: '#dc2626', label: 'Avoid' },
};

function ScoreDial({ score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#ca8a04' : '#dc2626';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f0f0f0" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>{pct}</span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>/ 100</span>
      </div>
    </div>
  );
}

function IngredientRow({ ing }) {
  const [open, setOpen] = useState(false);
  const sc = safetyColor(ing.safety_rating);
  return (
    <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 12, marginBottom: 12 }}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1 }} className="truncate">
            {ing.name || ing.inci_name}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>
            {ing.safety_rating || 'Safe'}
          </span>
        </div>
        <div className="ml-2 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ing.skin_effect && <p style={{ fontSize: 12, color: '#6B7280' }}>{ing.skin_effect}</p>}
          <div className="flex flex-wrap gap-2 mt-1">
            {ing.is_irritant && <span style={{ fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '1px 7px', borderRadius: 99 }}>Irritant</span>}
            {ing.is_allergen && <span style={{ fontSize: 11, background: '#fef9c3', color: '#ca8a04', padding: '1px 7px', borderRadius: 99 }}>Allergen</span>}
            {ing.is_comedogenic && <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '1px 7px', borderRadius: 99 }}>Comedogenic {ing.comedogenic_rating}/5</span>}
            {ing.is_hormone_disruptor && <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '1px 7px', borderRadius: 99 }}>Hormone Disruptor</span>}
            {ing.is_active_beneficial && <span style={{ fontSize: 11, background: '#dcfce7', color: '#16a34a', padding: '1px 7px', borderRadius: 99 }}>Beneficial Active</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkincareVerdictPage({ result, onBack }) {
  const vc = verdictConfig[(result?.verdict || '').toLowerCase()] || verdictConfig['use with caution'];
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
            {result?.product_name || 'Skincare Product'}
          </p>
          {result?.brand && <p style={{ fontSize: 13, color: '#9CA3AF' }}>{result.brand}</p>}
        </div>
      </div>

      <div className="flex-1 px-5 py-5" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 22 }}>{vc.emoji}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: vc.color }}>{vc.label}</span>
              </div>
              {result?.verdict_reason && (
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, maxWidth: 220 }}>{result.verdict_reason}</p>
              )}
            </div>
            {result?.safety_score != null && <ScoreDial score={result.safety_score} />}
          </div>
          {result?._loadingDetails && (
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Loading full analysis...</span>
            </div>
          )}
        </div>

        {!result?._loadingDetails && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 12 }}>Key Details</p>
            <div className="grid grid-cols-2 gap-3">
              {result?.skin_type_suitability && (
                <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>SKIN TYPE</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{result.skin_type_suitability}</p>
                </div>
              )}
              {result?.eye_area_safe != null && (
                <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>EYE AREA</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: result.eye_area_safe ? '#16a34a' : '#dc2626' }}>
                    {result.eye_area_safe ? 'Safe' : 'Avoid'}
                  </p>
                </div>
              )}
              {result?.pregnancy_safe != null && (
                <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>PREGNANCY</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: result.pregnancy_safe ? '#16a34a' : '#dc2626' }}>
                    {result.pregnancy_safe ? 'Safe' : 'Not recommended'}
                  </p>
                </div>
              )}
              {result?.frequency && (
                <div style={{ background: '#F7F8FA', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>FREQUENCY</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{result.frequency}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!result?._loadingDetails && (result?.top_beneficial?.length > 0 || result?.top_concerning?.length > 0) && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 12 }}>Highlights</p>
            {result?.top_beneficial?.length > 0 && (
              <div className="mb-3">
                <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>✅ Beneficial</p>
                <div className="flex flex-wrap gap-2">
                  {result.top_beneficial.map((i, idx) => (
                    <span key={idx} style={{ fontSize: 12, background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 99 }}>{i}</span>
                  ))}
                </div>
              </div>
            )}
            {result?.top_concerning?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 6 }}>⚠️ Concerning</p>
                <div className="flex flex-wrap gap-2">
                  {result.top_concerning.map((i, idx) => (
                    <span key={idx} style={{ fontSize: 12, background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 99 }}>{i}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!result?._loadingDetails && (result?.routine_step || result?.application_method) && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 12 }}>How to Use</p>
            {result.routine_step && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>⏰ {result.routine_step}</p>}
            {result.application_method && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>🤲 {result.application_method}</p>}
            {result.apply_after && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>📋 {result.apply_after}</p>}
            {result.do_not_combine && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 8 }}>🚫 {result.do_not_combine}</p>}
            {result.results_timeline && <p style={{ fontSize: 13, color: '#6B7280' }}>⏳ {result.results_timeline}</p>}
          </div>
        )}

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

        {result?.long_term_summary && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8 }}>Long-Term Use</p>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{result.long_term_summary}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}