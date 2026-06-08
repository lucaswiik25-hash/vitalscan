import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SKIN_TYPES = [
  { id: 'oily', label: 'Oily', emoji: '💦', desc: 'Shiny, enlarged pores' },
  { id: 'dry', label: 'Dry', emoji: '🏜️', desc: 'Tight, flaky feeling' },
  { id: 'combination', label: 'Combination', emoji: '⚖️', desc: 'Oily T-zone, dry cheeks' },
  { id: 'sensitive', label: 'Sensitive', emoji: '🌸', desc: 'Easily irritated' },
  { id: 'normal', label: 'Normal', emoji: '✨', desc: 'Balanced & clear' },
];

const SKIN_CONCERNS = [
  { id: 'acne', label: 'Acne', emoji: '⚡' },
  { id: 'redness', label: 'Redness', emoji: '🔴' },
  { id: 'aging', label: 'Aging', emoji: '⏰' },
  { id: 'hyperpigmentation', label: 'Dark spots', emoji: '🌑' },
  { id: 'dullness', label: 'Dullness', emoji: '🌫️' },
  { id: 'none', label: 'None', emoji: '✅' },
];

export default function SkincareMiniOnboarding({ onComplete, onSkip }) {
  const [step, setStep] = useState(1);
  const [skinType, setSkinType] = useState(null);
  const [concerns, setConcerns] = useState([]);

  const toggleConcern = (id) => {
    if (id === 'none') {
      setConcerns(['none']);
      return;
    }
    setConcerns(prev => {
      const without = prev.filter(c => c !== 'none');
      return without.includes(id) ? without.filter(c => c !== id) : [...without, id];
    });
  };

  const handleDone = () => {
    onComplete({ skin_type: skinType, skin_concerns: concerns.filter(c => c !== 'none') });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onSkip} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white rounded-t-[32px] pb-10 px-6 pt-6"
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Skip */}
        <button
          onClick={onSkip}
          className="absolute top-5 right-5 text-xs font-semibold text-gray-400 px-3 py-1 rounded-full border border-gray-200"
        >
          Skip
        </button>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-6 pr-12">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Step 1 of 2</p>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">What's your skin type?</h2>
                <p className="text-sm text-gray-400 mt-1">This helps us give you accurate skincare verdicts. Takes 10 seconds.</p>
              </div>
              <div className="space-y-2 mb-6">
                {SKIN_TYPES.map(({ id, label, emoji, desc }) => (
                  <button
                    key={id}
                    onClick={() => setSkinType(id)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all text-left"
                    style={{
                      borderColor: skinType === id ? '#111827' : 'transparent',
                      background: skinType === id ? '#111827' : '#F9FAFB',
                    }}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: skinType === id ? 'white' : '#111827' }}>{label}</p>
                      <p className="text-xs" style={{ color: skinType === id ? 'rgba(255,255,255,0.6)' : '#9CA3AF' }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!skinType}
                className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold text-base disabled:opacity-40 transition-opacity"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-6 pr-12">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Step 2 of 2</p>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Any skin concerns?</h2>
                <p className="text-sm text-gray-400 mt-1">Select all that apply. We'll flag relevant ingredients for you.</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {SKIN_CONCERNS.map(({ id, label, emoji }) => {
                  const selected = concerns.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleConcern(id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all"
                      style={{
                        borderColor: selected ? '#111827' : '#E5E7EB',
                        background: selected ? '#111827' : 'white',
                        color: selected ? 'white' : '#374151',
                      }}
                    >
                      <span>{emoji}</span>
                      <span className="text-sm font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleDone}
                className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold text-base"
              >
                Done — Start Scanning
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}