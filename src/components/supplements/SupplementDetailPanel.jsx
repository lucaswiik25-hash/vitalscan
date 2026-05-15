import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import PillIllustration, { getPillIndex } from './PillIllustration';

const timeLabel = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', with_food: 'With Food' };

export default function SupplementDetailPanel({ supplement, onClose, onToggleTaken }) {
  if (!supplement) return null;
  const taken = supplement.taken_today;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-t-[32px] px-6 pt-6 pb-10"
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Pill illustration */}
        <div className="flex justify-center mt-2 mb-5">
          <PillIllustration name={supplement.name} scale={1.1} />
        </div>

        {/* Name */}
        <h2 className="text-2xl font-black text-gray-900 text-center mb-4">{supplement.name}</h2>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Dose', value: supplement.dose || '—' },
            { label: 'Time to take', value: timeLabel[supplement.time_of_day] || '—' },
            { label: 'Per day', value: '1×' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-base font-black text-gray-900">{value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Mark as taken */}
        <button
          onClick={() => { onToggleTaken(supplement); onClose(); }}
          className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-98"
          style={{
            background: taken ? '#e5e7eb' : '#1a1a1a',
            color: taken ? '#6b7280' : '#ffffff',
          }}
        >
          {taken ? (
            <><Check className="w-5 h-5" /> Marked as Taken</>
          ) : (
            <><Check className="w-5 h-5" /> Mark as Taken</>
          )}
        </button>
      </motion.div>
    </div>
  );
}