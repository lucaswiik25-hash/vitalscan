import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Loader2 } from 'lucide-react';

const TABS = ['Details', 'Ingredients'];

function safetyColor(rating) {
  const r = (rating || '').toLowerCase();
  if (r === 'safe') return { bg: '#e8f5e9', text: '#2e7d32', dot: '#4caf50' };
  if (r === 'caution') return { bg: '#fff3e0', text: '#e65100', dot: '#ff9800' };
  return { bg: '#fdecea', text: '#c62828', dot: '#f44336' };
}

function IngredientModal({ ingredient, onClose }) {
  const sc = safetyColor(ingredient.safety_rating);
  const badgeType = (ingredient.safety_rating || '').toLowerCase() === 'safe' ? 'beneficial'
    : (ingredient.safety_rating || '').toLowerCase() === 'caution' ? 'caution' : 'avoid';
  const badgeStyle = {
    beneficial: { bg: '#e8f5e9', text: '#2e7d32' },
    caution: { bg: '#fff3e0', text: '#e65100' },
    avoid: { bg: '#fdecea', text: '#c62828' },
  }[badgeType];

  const flags = [
    ingredient.is_irritant && 'Irritant',
    ingredient.is_allergen && 'Allergen',
    ingredient.is_comedogenic && `Comedogenic (${ingredient.comedogenic_rating ?? ''})`,
    ingredient.is_hormone_disruptor && 'Hormone Disruptor',
    ingredient.has_fragrance && 'Fragrance',
    ingredient.is_active_beneficial && 'Active Beneficial',
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg mx-auto bg-white overflow-y-auto"
        style={{ borderRadius: '32px 32px 0 0', maxHeight: '70vh', padding: 24 }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-[22px] font-semibold text-gray-900 leading-tight flex-1 pr-3"
            style={{ fontFamily: 'var(--font-serif)' }}>
            {ingredient.name}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#f5f5f5' }}>
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {/* Badge */}
        <span className="inline-block px-3 py-1 rounded-xl text-[11px] font-semibold mb-3"
          style={{ background: badgeStyle.bg, color: badgeStyle.text }}>
          {ingredient.safety_rating || 'Unknown'}
        </span>
        {/* Flags */}
        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {flags.map(f => (
              <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{f}</span>
            ))}
          </div>
        )}
        {/* Skin effect */}
        {ingredient.skin_effect && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{ingredient.skin_effect}</p>
        )}
        {/* Function section */}
        {ingredient.inci_name && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">INCI Name</p>
            <p className="text-sm text-gray-700">{ingredient.inci_name}</p>
          </div>
        )}
        {/* Body benefit */}
        {ingredient.body_benefit && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Skin Benefits</p>
            <p className="text-sm text-gray-700 leading-relaxed">{ingredient.body_benefit}</p>
          </div>
        )}
        {/* Body risk */}
        {ingredient.body_risk && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Cautions</p>
            <p className="text-sm leading-relaxed" style={{ color: '#c62828' }}>{ingredient.body_risk}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SkincareVerdictPage({ result, onBack }) {
  const [activeTab, setActiveTab] = useState('Ingredients');
  const isLoadingDetails = result._loadingDetails === true;
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const scoreNum = result.safety_score || 0;
  const scoreColor = scoreNum >= 70 ? '#2e7d32' : scoreNum >= 40 ? '#e65100' : '#c62828';

  const safeCount = (result.ingredients || []).filter(i => (i.safety_rating || '').toLowerCase() === 'safe').length;
  const cautionCount = (result.ingredients || []).filter(i => (i.safety_rating || '').toLowerCase() === 'caution').length;
  const avoidCount = (result.ingredients || []).filter(i => (i.safety_rating || '').toLowerCase() === 'avoid').length;

  const beneficialIngredients = (result.ingredients || []).filter(i =>
    (i.safety_rating || '').toLowerCase() === 'safe' && (i.is_active_beneficial || i.body_benefit)
  ).slice(0, 5);

  const bgGrad = 'linear-gradient(135deg, #e8ddd0 0%, #d4c4b0 50%, #c9b8a0 100%)';

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Blurred gradient background with image overlay */}
      <div className="absolute inset-0" style={{ background: bgGrad }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.6) 100%)',
      }} />

      {/* Product image in upper portion */}
      {result.image_url && (
        <div className="absolute top-0 left-0 right-0" style={{ height: '38%' }}>
          <img src={result.image_url} alt={result.product_name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(232,221,208,0.9) 100%)'
          }} />
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute z-20 flex items-center justify-center"
        style={{
          top: 52, left: 20, width: 36, height: 36, borderRadius: 18,
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <ChevronLeft className="w-5 h-5" style={{ color: '#333' }} />
      </button>

      {/* White bottom card */}
      <div
        className="absolute left-0 right-0 bottom-0 flex flex-col overflow-hidden"
        style={{
          top: result.image_url ? '34%' : '15%',
          borderRadius: '32px 32px 0 0',
          background: '#ffffff',
        }}
      >
        <div className="overflow-y-auto flex-1 pb-8">
          {/* Product header */}
          <div className="px-6 pt-7 pb-2 text-center">
            {result.brand && (
              <p className="text-lg font-normal mb-1 font-serif" style={{
                color: '#7b9bd1',
                fontFamily: 'var(--font-serif)',
                letterSpacing: 0.5
              }}>
                {result.brand}
              </p>
            )}
            <h1 className="text-2xl font-medium text-gray-900 leading-snug mb-3"
              style={{ fontFamily: 'var(--font-serif)' }}>
              {result.product_name}
            </h1>
            {result.verdict_reason && (
              <p className="text-[13px] text-gray-500 leading-relaxed px-4 mb-2">{result.verdict_reason}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex border-b border-gray-100 mb-5">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 pb-3 text-[13px] relative transition-colors"
                  style={{
                    color: activeTab === tab ? '#1a1a1a' : '#bbbbbb',
                    fontWeight: activeTab === tab ? '500' : '400',
                  }}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Details tab */}
            {activeTab === 'Details' && (
              <div className="space-y-0">
                {isLoadingDetails && (
                  <div className="flex items-center gap-2 py-3 mb-2 px-3 rounded-xl" style={{ background: '#f5f5f5' }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Analysing safety details...</span>
                  </div>
                )}
                {/* Score */}
                <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Safety Score</span>
                  {isLoadingDetails && !scoreNum
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300" />
                    : <span className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreNum}/100</span>
                  }
                </div>
                {/* Stats row */}
                <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Ingredients</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#e8f5e9', color: '#2e7d32' }}>{safeCount} safe</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fff3e0', color: '#e65100' }}>{cautionCount} caution</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fdecea', color: '#c62828' }}>{avoidCount} avoid</span>
                  </div>
                </div>
                {result.skin_type_suitability && (
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Skin Type</span>
                    <span className="text-sm font-medium text-gray-800">{result.skin_type_suitability}</span>
                  </div>
                )}
                {result.eye_area_safe !== undefined && (
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Eye Area Safe</span>
                    <span className="text-sm font-medium" style={{ color: result.eye_area_safe ? '#2e7d32' : '#c62828' }}>
                      {result.eye_area_safe ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {result.pregnancy_safe !== undefined && (
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Pregnancy Safe</span>
                    <span className="text-sm font-medium" style={{ color: result.pregnancy_safe ? '#2e7d32' : '#e65100' }}>
                      {result.pregnancy_safe ? 'Yes' : 'Check label'}
                    </span>
                  </div>
                )}
                {result.long_term_summary && (
                  <div className="py-4 border-b border-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Long-Term Effects</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.long_term_summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Ingredients tab */}
            {activeTab === 'Ingredients' && (
              <div>
                {/* Key / beneficial ingredients */}
                {beneficialIngredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-1"
                      style={{ fontFamily: 'var(--font-serif)' }}>Key ingredients</h3>
                    <p className="text-xs text-gray-400 mb-4">Tap on ingredient to see details</p>
                    <div className="flex flex-wrap gap-2">
                      {beneficialIngredients.map((ing, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedIngredient(ing)}
                          className="text-[13px] font-medium px-4 py-2 rounded-full active:scale-95 transition-transform"
                          style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}
                        >
                          {ing.name}
                        </button>
                      ))}
                      {/* Also show top_beneficial as tags if available */}
                      {(result.top_beneficial || []).filter(b => !beneficialIngredients.find(i => i.name === b)).map((b, i) => (
                        <span key={`b-${i}`}
                          className="text-[13px] font-medium px-4 py-2 rounded-full"
                          style={{ background: '#f1f8e9', color: '#558b2f', border: '1px solid #dcedc8' }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* All ingredients list */}
                <h3 className="text-xl font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'var(--font-serif)' }}>All ingredients</h3>
                <div className="space-y-2.5">
                  {(result.ingredients || []).map((ing, i) => {
                    const sc = safetyColor(ing.safety_rating);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedIngredient(ing)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left active:scale-[0.98] transition-transform"
                        style={{ background: '#f8f8f8' }}
                      >
                        <span className="text-sm font-medium text-gray-800">{ing.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                          <span className="text-xs font-medium" style={{ color: sc.text }}>
                            {ing.safety_rating || 'Unknown'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {(result.ingredients || []).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No ingredient data available.</p>
                  )}
                </div>

                {/* Top concerns section */}
                {result.top_concerning?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-base font-semibold text-gray-800 mb-3">⚠️ Top Concerns</h3>
                    <div className="space-y-2">
                      {result.top_concerning.map((c, i) => (
                        <p key={i} className="text-sm text-gray-600 leading-relaxed">• {c}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ingredient detail modal */}
      <AnimatePresence>
        {selectedIngredient && (
          <IngredientModal ingredient={selectedIngredient} onClose={() => setSelectedIngredient(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}