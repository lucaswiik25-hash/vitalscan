import React, { useState, useRef, useEffect } from 'react';
import { X, Barcode, Search } from 'lucide-react';

export default function BarcodeInput({ onSubmit, onClose }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim().replace(/\s/g, '');
    if (trimmed.length >= 8) onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] px-5 pt-6 pb-10">
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Barcode className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Enter Barcode Manually</p>
            <p className="text-xs text-gray-400">Type the barcode number from the product</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 5000112637922"
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-base font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-gray-300"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={value.length < 8}
            className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Scan with your camera or type the number under the barcode
        </p>
      </div>
    </div>
  );
}