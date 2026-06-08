import React, { useState } from 'react';
import { motion } from 'framer-motion';

const HEALTH_CONDITIONS = [
  { id: 'digestive_issues', label: 'Digestive issues', emoji: '🫁' },
  { id: 'hormonal_imbalance', label: 'Hormonal imbalance', emoji: '⚗️' },
  { id: 'sleep_problems', label: 'Sleep problems', emoji: '😴' },
  { id: 'anxiety', label: 'Anxiety / Stress', emoji: '🧠' },
  { id: 'heart_health', label: 'Heart health', emoji: '❤️' },
  { id: 'joint_pain', label: 'Joint pain', emoji: '🦴' },
  { id: 'none', label: 'None', emoji: '✅' },
];

export default function SupplementMiniOnboarding({ onComplete, onSkip }) {
  const [conditions, setConditions] = useState([]);

  const toggle = (id) => {
    if (id === 'none') {
      setConditions(['none']);
      return;
    }
    setConditions(prev => {
      const without = prev.filter(c => c !== 'none');
      return without.includes(id) ? without.filter(c => c !== id) : [...without, id];
    });
  };

  const handleDone = () => {
    onComplete({ health_conditions: conditions.filter(c => c !== 'none') });
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

        <div className="mb-6 pr-12">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Quick personalisation</p>
          <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">Any health conditions?</h2>
          <p className="text-sm text-gray-400 mt-1">We'll flag supplement interactions and irrelevant recommendations for you.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {HEALTH_CONDITIONS.map(({ id, label, emoji }) => {
            const selected = conditions.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
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
    </div>
  );
}