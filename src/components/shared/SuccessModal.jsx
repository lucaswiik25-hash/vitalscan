import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function SuccessModal({ title, message, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        className="relative bg-white rounded-[24px] p-6 w-full max-w-sm text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}
