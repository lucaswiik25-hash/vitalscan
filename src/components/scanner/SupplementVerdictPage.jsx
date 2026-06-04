import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

const TABS = ['Details', 'Ingredients'];

const flagColor = (flag) => {
  const f = (flag || '').toLowerCase();
  if (f === 'correctly dosed' || f === 'none') return { bg: '#e8f5e9', text: '#2e7d32', dot: '#4caf50' };
  if (f === 'underdosed') return { bg: '#fff3e0', text: '#e65100', dot: '#ff9800' };
  if (f === 'overdose risk') return { bg: '#fdecea', text: '#c62828', dot: '#f44336' };
  if (f === 'poor form') return { bg: '#fce4ec', text: '#880e4f', dot: '#e91e63' };
  if (f === 'filler') return { bg: '#f5f5f5', text: '#757575', dot: '#9e9e9e' };
  return { bg: '#f5f5f5', text: '#757575', dot: '#9e9e9e' };
};

function IngredientModal({ ingredient, onClose }) {
  const fc = flagColor(ingredient.flag);

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
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[22px] font-semibold text-gray-900 leading-tight flex-1 pr-3"
            style={{ fontFamily: 'var(--font-serif)' }}>
            {ingredient.name}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#f5f5f5' }}>
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {/* Flag badge */}
        <span className="inline-block px-3 py-1 rounded-xl text-[11px] font-semibold mb-3"
          style={{ background: fc.bg, color: fc.text }}>
          {ingredient.flag || 'Unknown'}
        </span>
        {/* Amount & form */}
        {ingredient.amount && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Amount per serving</p>
            <p className="text-sm font-semibold text-gray-800">{ingredient.amount}
              {ingredient.dri_percent ? <span className="text-xs font-normal text-gray-400 ml-2">{ingredient.dri_percent}% DRI</span> : null}
            </p>
          </div>
        )}
        {ingredient.form_quality && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Form</p>
            <p className="text-sm text-gray-700">{ingredient.form_quality}</p>
          </div>
        )}
        {ingredient.bioavailability && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Bioavailability</p>
            <p className="text-sm font-semibold"
              style={{ color: ingredient.bioavailability === 'High' ? '#2e7d32' : ingredient.bioavailability === 'Medium' ? '#e65100' : '#c62828' }}>
              {ingredient.bioavailability}
            </p>
          </div>
        )}
        {ingredient.body_benefit && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Benefits</p>
            <p className="text-sm text-gray-700 leading-relaxed">{ingredient.body_benefit}</p>
          </div>
        )}
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

export default function SupplementVerdictPage({ result, onBack }) {
  const [activeTab, setActiveTab] = useState('Ingredients');
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, []);

  const scoreNum = result.quality_score || 0;
  const scoreColor = scoreNum >= 70 ? '#2e7d32' : scoreNum >= 40 ? '#e65100' : '#c62828';

  const correctCount = (result.ingredients || []).filter(i => (i.flag || '').toLowerCase() === 'correctly dosed').length;
  const underdosedCount = (result.ingredients || []).filter(i => (i.flag || '').toLowerCase() === 'underdosed').length;
  const poorCount = (result.ingredients || []).filter(i => ['poor form', 'filler', 'overdose risk'].includes((i.flag || '').toLowerCase())).length;

  // Key ingredients = correctly dosed ones
  const keyIngredients = (result.ingredients || []).filter(i =>
    (i.flag || '').toLowerCase() === 'correctly dosed' && i.body_benefit
  ).slice(0, 5);

  const bgGrad = 'linear-gradient(135deg, #dde8d8 0%, #c8d8c2 50%, #bccfb5 100%)';

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ maxWidth: 480, margin: '0 auto', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)', transition: 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1)' }}>
      {/* Gradient background */}
      <div className="absolute inset-0" style={{ background: bgGrad }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.6) 100%)',
      }} />

      {/* Product image */}
      {result.image_url && (
        <div className="absolute top-0 left-0 right-0" style={{ height: '38%' }}>
          <img src={result.image_url} alt={result.product_name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(221,232,216,0.9) 100%)'
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
              <p className="text-lg font-normal mb-1"
                style={{ color: '#7b9bd1', fontFamily: 'var(--font-serif)', letterSpacing: 0.5 }}>
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
                      layoutId="tab-indicator-supp"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Details tab */}
            {activeTab === 'Details' && (
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Quality Score</span>
                  <span className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreNum}/100</span>
                </div>
                <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Dosage breakdown</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#e8f5e9', color: '#2e7d32' }}>{correctCount} ✓</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fff3e0', color: '#e65100' }}>{underdosedCount} ↓</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fdecea', color: '#c62828' }}>{poorCount} ✗</span>
                  </div>
                </div>
                {result.serving_size && (
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Serving Size</span>
                    <span className="text-sm font-medium text-gray-800">{result.serving_size}</span>
                  </div>
                )}
                {result.estimated_duration && (
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Supply Duration</span>
                    <span className="text-sm font-medium text-gray-800">{result.estimated_duration}</span>
                  </div>
                )}
                {result.best_time_to_take && (
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Best Time</span>
                    <span className="text-sm font-medium text-gray-800 text-right max-w-[55%]">{result.best_time_to_take}</span>
                  </div>
                )}
                {result.food_note && (
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-50">
                    <span className="text-sm text-gray-500">With Food</span>
                    <span className="text-sm font-medium text-gray-800 text-right max-w-[55%]">{result.food_note}</span>
                  </div>
                )}
                {result.absorption_tip && (
                  <div className="py-4 border-b border-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Absorption Tip</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.absorption_tip}</p>
                  </div>
                )}
                {result.interactions && (
                  <div className="py-4 rounded-xl mt-2" style={{ background: '#fff3e0' }}>
                    <p className="text-sm text-orange-800 leading-relaxed px-1">⚠️ {result.interactions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Ingredients tab */}
            {activeTab === 'Ingredients' && (
              <div>
                {keyIngredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-1"
                      style={{ fontFamily: 'var(--font-serif)' }}>Key ingredients</h3>
                    <p className="text-xs text-gray-400 mb-4">Tap on ingredient to see details</p>
                    <div className="flex flex-wrap gap-2">
                      {keyIngredients.map((ing, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedIngredient(ing)}
                          className="text-[13px] font-medium px-4 py-2 rounded-full active:scale-95 transition-transform"
                          style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}
                        >
                          {ing.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-medium text-gray-900 mb-4"
                  style={{ fontFamily: 'var(--font-serif)' }}>All ingredients</h3>
                <div className="space-y-2.5">
                  {(result.ingredients || []).map((ing, i) => {
                    const fc = flagColor(ing.flag);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedIngredient(ing)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left active:scale-[0.98] transition-transform"
                        style={{ background: '#f8f8f8' }}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800 block truncate">{ing.name}</span>
                          {ing.amount && <span className="text-xs text-gray-400">{ing.amount}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: fc.dot }} />
                          <span className="text-xs font-medium" style={{ color: fc.text }}>
                            {ing.flag || '—'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {(result.ingredients || []).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No ingredient data available.</p>
                  )}
                </div>
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