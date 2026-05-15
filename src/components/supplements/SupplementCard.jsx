import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import PillIllustration from './PillIllustration';
import { motion } from 'framer-motion';

const timeLabel = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', with_food: 'With Food' };

export default function SupplementCard({ supplement, index, onTap, onDelete }) {
  const taken = supplement.taken_today;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.07 }}
      className="relative bg-white rounded-[28px] px-6 pt-8 pb-6 shadow-sm flex flex-col items-center cursor-pointer active:scale-[0.98] transition-transform"
      style={{ border: taken ? '1.5px solid #e5e7eb' : '1.5px solid rgba(0,0,0,0.06)' }}
      onClick={onTap}
    >
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(supplement.id); }}
        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center z-10"
      >
        <X className="w-3.5 h-3.5 text-gray-500" />
      </button>

      {/* Taken indicator dot */}
      {taken && (
        <div className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-green-400" />
      )}

      {/* Pill illustration */}
      <div className={taken ? 'opacity-40 grayscale' : ''}>
        <PillIllustration name={supplement.name} scale={0.95} />
      </div>

      {/* Name */}
      <h3 className={`text-lg font-black text-center mt-4 mb-2 ${taken ? 'text-gray-400' : 'text-gray-900'}`}>
        {supplement.name}
      </h3>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {supplement.time_of_day && (
          <span className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1"/>
              <path d="M5 2.5V5L6.5 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            {timeLabel[supplement.time_of_day]}
          </span>
        )}
        {supplement.dose && (
          <span className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <ellipse cx="5" cy="5" rx="3.5" ry="4" stroke="currentColor" strokeWidth="1"/>
              <line x1="1.5" y1="5" x2="8.5" y2="5" stroke="currentColor" strokeWidth="1"/>
            </svg>
            {supplement.dose}
          </span>
        )}
      </div>
    </motion.div>
  );
}