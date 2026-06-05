import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CYCLES = {
  food: [
    'Reading nutritional data...',
    'Calculating macros...',
    'Checking ingredients...',
    'Analysing health impact...',
    'Almost done...',
  ],
  skincare: [
    'Identifying product...',
    'Reading ingredients...',
    'Checking for irritants...',
    'Analysing safety profile...',
    'Almost done...',
  ],
  supplement: [
    'Identifying supplement...',
    'Analysing formula...',
    'Checking ingredient quality...',
    'Generating recommendations...',
    'Almost done...',
  ],
};

export default function AnalyzingScreen({ type = 'food', message }) {
  const cycles = CYCLES[type] || CYCLES.food;
  const [cycleIdx, setCycleIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycleIdx(i => (i + 1) % cycles.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [cycles.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 1, 92));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const displayText = message || cycles[cycleIdx];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50 px-8">
      {/* Spinner ring */}
      <div className="relative mb-10">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#f0f0f0" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke="#111827"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="213"
            animate={{ strokeDashoffset: [213, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '40px 40px', transform: 'rotate(-90deg)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">
            {type === 'food' ? '🥗' : type === 'skincare' ? '🧴' : '💊'}
          </span>
        </div>
      </div>

      {/* Cycling text */}
      <div className="h-8 flex items-center justify-center mb-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={displayText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="text-base font-medium text-gray-700 text-center"
          >
            {displayText}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gray-900 rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>

      <p className="mt-4 text-xs text-gray-400">This may take a few seconds</p>
    </div>
  );
}