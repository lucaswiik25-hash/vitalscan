import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

export default function SuccessModal({ title, message, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center px-0">
      <div
        className={`bottom-sheet-backdrop absolute inset-0 bg-black/40 backdrop-blur-sm ${visible ? 'is-visible' : ''}`}
        onClick={onClose}
      />
      <div
        className={`bottom-sheet-panel relative bg-white rounded-t-[24px] p-6 w-full max-w-lg text-center ${visible ? 'is-visible' : ''}`}
      >
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <button
          onClick={onClose}
          className="press-scale w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
