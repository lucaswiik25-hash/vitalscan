import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const SLOTS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '☕' },
  { key: 'lunch', label: 'Lunch', emoji: '🍜' },
  { key: 'dinner', label: 'Dinner', emoji: '🥗' },
  { key: 'snack', label: 'Snack', emoji: '🍎' },
];

export default function MealSlotPicker({ foodName, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-t-[28px] px-5 pt-5 pb-10"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Which meal?</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          We couldn't tell when you ate <strong>{foodName}</strong>. Pick a meal slot:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SLOTS.map((slot) => (
            <button
              key={slot.key}
              onClick={() => onSelect(slot.key)}
              className="h-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center gap-2 font-semibold text-gray-900 active:scale-95 transition-transform"
            >
              <span className="text-xl">{slot.emoji}</span>
              {slot.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
