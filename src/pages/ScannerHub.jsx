import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Camera, Sparkles, Pill, ShieldCheck, Target } from 'lucide-react';

const scanOptions = [
  {
    title: 'Food Scanner',
    description: 'Scan any food or barcode to get full nutrition info',
    emoji: '🍎',
    path: '/food-scanner',
    gradient: 'from-orange-50 to-red-50',
  },
  {
    title: 'Skincare Analyzer',
    description: 'Analyze ingredients in any cosmetic product',
    emoji: '🧴',
    path: '/skincare-scanner',
    gradient: 'from-pink-50 to-purple-50',
  },
  {
    title: 'Supplement Scanner',
    description: 'Check quality and dosage of any supplement',
    emoji: '💊',
    path: '/supplement-scanner',
    gradient: 'from-blue-50 to-cyan-50',
  },
];

export default function ScannerHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-lg font-bold text-foreground">Scanner</span>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-4 space-y-3">
        {scanOptions.map((opt) => (
          <Link
            key={opt.path}
            to={opt.path}
            className={`block bg-gradient-to-br ${opt.gradient} border border-border rounded-[20px] p-5 shadow-sm active:scale-[0.98] transition-transform`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{opt.emoji}</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">{opt.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Feature highlights */}
      <div className="px-5 mt-6 flex gap-3">
        <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Allergen Aware</p>
            <p className="text-xs text-muted-foreground">Auto-detects your allergens</p>
          </div>
        </div>
        <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center gap-3">
          <Target className="w-5 h-5 text-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Goal-Aligned</p>
            <p className="text-xs text-muted-foreground">Matches your diet plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}