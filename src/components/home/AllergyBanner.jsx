import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AllergyBanner({ allergens = [] }) {
  if (!allergens.length) return null;
  return (
    <div className="mx-5 mb-3 rounded-[16px] px-4 py-3 flex items-start gap-2.5"
      style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-bold text-red-700 mb-1.5">Allergen Alert — Avoiding:</p>
        <div className="flex flex-wrap gap-1.5">
          {allergens.map(a => (
            <span key={a} className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}