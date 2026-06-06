import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIPS = {
  food: [
    { emoji: '🥦', title: 'Eat the Rainbow', body: 'Aim for 5 different coloured vegetables a day — each colour provides unique phytonutrients.' },
    { emoji: '💧', title: 'Hydrate Before Eating', body: 'Drinking 500ml of water 30 minutes before a meal can reduce calorie intake by up to 13%.' },
    { emoji: '🧠', title: 'Protein Keeps You Full', body: 'Protein activates satiety hormones and keeps you fuller for longer than carbs or fat.' },
    { emoji: '🕐', title: 'Chew Slowly', body: 'It takes ~20 minutes for your brain to register fullness. Eat slowly to avoid overeating.' },
    { emoji: '🌾', title: 'Choose Whole Grains', body: 'Whole grains keep blood sugar stable and contain 3x more fibre than refined grains.' },
    { emoji: '🥑', title: 'Healthy Fats Matter', body: 'Avocado, olive oil and nuts support brain health, hormone balance, and skin glow.' },
  ],
  skincare: [
    { emoji: '☀️', title: 'SPF Every Day', body: 'UV radiation causes 90% of premature skin ageing. Apply SPF 30+ even on cloudy days.' },
    { emoji: '💧', title: 'Hydration = Glow', body: 'Drinking 2L of water daily plumps skin cells and reduces the appearance of fine lines.' },
    { emoji: '🧴', title: 'Layer Lightest First', body: 'Always apply skincare from thinnest to thickest consistency: toner → serum → moisturiser.' },
    { emoji: '🌙', title: 'Night is Repair Time', body: 'Skin cell turnover peaks between midnight and 4am — a good night routine matters.' },
    { emoji: '🍓', title: 'Vitamin C = Collagen', body: 'Vitamin C is essential for collagen synthesis. Low intake leads to dull, ageing skin.' },
    { emoji: '❄️', title: 'Cold Water Closes Pores', body: 'Rinse your face with cold water after cleansing to tighten pores and reduce redness.' },
  ],
  supplement: [
    { emoji: '🕐', title: 'Timing Matters', body: 'Taking fat-soluble vitamins (A, D, E, K) with a meal containing fat increases absorption by up to 50%.' },
    { emoji: '⚠️', title: 'More ≠ Better', body: 'Most supplements have an optimal dose. Excess water-soluble vitamins are excreted; fat-soluble ones can accumulate.' },
    { emoji: '🧪', title: 'Third-Party Testing', body: 'Look for supplements certified by NSF, USP or Informed Sport to ensure purity and label accuracy.' },
    { emoji: '💊', title: 'Creatine Is King', body: 'Creatine monohydrate is the most researched ergogenic supplement — safe, effective, and affordable.' },
    { emoji: '🌿', title: 'Food First', body: 'Supplements fill gaps — they work best alongside a varied whole-food diet, not as a replacement.' },
    { emoji: '🩸', title: 'Test Don\'t Guess', body: 'Get blood work done before supplementing vitamins D, B12, or iron — over-supplementing can cause harm.' },
  ],
};

const CYCLES = {
  food: ['Reading nutritional data...', 'Calculating macros...', 'Checking ingredients...', 'Analysing health impact...', 'Almost done...'],
  skincare: ['Identifying product...', 'Reading ingredients...', 'Checking for irritants...', 'Analysing safety profile...', 'Almost done...'],
  supplement: ['Identifying supplement...', 'Analysing formula...', 'Checking ingredient quality...', 'Generating recommendations...', 'Almost done...'],
};

export default function AnalyzingScreen({ type = 'food', message, onCancel }) {
  const navigate = useNavigate();
  const cycles = CYCLES[type] || CYCLES.food;
  const tips = TIPS[type] || TIPS.food;

  const [cycleIdx, setCycleIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCycleIdx(i => (i + 1) % cycles.length), 2200);
    return () => clearInterval(interval);
  }, [cycles.length]);

  useEffect(() => {
    const interval = setInterval(() => setProgress(p => Math.min(p + 1, 92)), 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const displayText = message || cycles[cycleIdx];
  const tip = tips[tipIdx];

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white z-50">
      {/* Cancel button */}
      <div className="absolute top-12 left-5 z-10">
        <button onClick={handleCancel}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.07)' }}>
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Main spinner area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        {/* Pulsing ring with emoji */}
        <div className="relative mb-10">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full"
            style={{ width: 90, height: 90, background: 'rgba(0,0,0,0.04)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="90" height="90" viewBox="0 0 90 90" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="45" cy="45" r="40" fill="none" stroke="#f0f0f0" strokeWidth="5" />
              <motion.circle
                cx="45" cy="45" r="40"
                fill="none"
                stroke="#111827"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="251"
                animate={{ strokeDashoffset: [251, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '45px 45px', transform: 'rotate(-90deg)' }}
              />
            </svg>
            <span style={{ fontSize: 30 }}>
              {type === 'food' ? '🥗' : type === 'skincare' ? '🧴' : '💊'}
            </span>
          </div>
        </div>

        {/* Cycling status text */}
        <div className="h-7 flex items-center justify-center mb-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayText}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-gray-800 text-center"
            >
              {displayText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-56 h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full bg-gray-900 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
        <p className="text-[11px] text-gray-400 mb-10">{progress}%</p>
      </div>

      {/* Tip flashcard at bottom */}
      <div className="px-5 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIdx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-4"
            style={{ background: '#F7F8FA', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-start gap-3">
              <span style={{ fontSize: 28, flexShrink: 0 }}>{tip.emoji}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 3 }}>{tip.title}</p>
                <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.55 }}>{tip.body}</p>
              </div>
            </div>
            {/* Tip dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {tips.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-300"
                  style={{ width: i === tipIdx ? 16 : 5, height: 5, background: i === tipIdx ? '#111' : '#d1d5db' }} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}