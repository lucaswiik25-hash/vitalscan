import React, { useState } from 'react';
import { ArrowLeft, Share2, MoreHorizontal, Bookmark, Pencil, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VerdictPill = ({ value, type }) => {
  const colors = {
    yes: 'bg-green-100 text-green-700',
    limit: 'bg-yellow-100 text-yellow-700',
    no: 'bg-red-100 text-red-700',
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${colors[value] || 'bg-muted text-muted-foreground'}`}>
      {value}
    </span>
  );
};

export default function FoodScanResult({ result, onLog, onScanAnother, onBack }) {
  const [slide, setSlide] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      {/* Top image */}
      {result.image_url && (
        <div className="relative h-24 bg-gradient-to-b from-gray-800 to-gray-900">
          <img src={result.image_url} className="w-full h-full object-cover opacity-40" alt="" />
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
            <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold">Nutrition</span>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Share2 className="w-4 h-4 text-white" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-4 pb-28">
        {/* Food name */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Bookmark className="w-5 h-5 text-muted-foreground mt-1" />
            <div>
              <p className="text-xs text-muted-foreground">{result.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <h1 className="text-xl font-bold text-foreground mt-0.5">{result.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5">
            <span className="text-sm font-semibold">1</span>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Nutrition carousel */}
        <div className="mt-5">
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {/* Slide 1: Main macros */}
              <div className="min-w-full">
                <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
                  <p className="text-xs text-muted-foreground">Calories</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">🔥</span>
                    <span className="text-4xl font-extrabold text-foreground">{result.calories}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {[
                    { emoji: '🍖', label: 'Protein', value: `${result.protein}g` },
                    { emoji: '🌾', label: 'Carbs', value: `${result.carbs}g` },
                    { emoji: '🫒', label: 'Fats', value: `${result.fat}g` },
                  ].map(m => (
                    <div key={m.label} className="flex-1 bg-white border border-border rounded-2xl p-3 shadow-sm text-center">
                      <span className="text-sm">{m.emoji}</span>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-lg font-bold text-foreground">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Slide 2: Secondary macros + Health Score */}
              <div className="min-w-full">
                <div className="flex gap-2">
                  {[
                    { emoji: '🍆', label: 'Fiber', value: `${result.fiber || 0}g` },
                    { emoji: '🍬', label: 'Sugar', value: `${result.sugar || 0}g` },
                    { emoji: '🍜', label: 'Sodium', value: `${result.sodium || 0}mg` },
                  ].map(m => (
                    <div key={m.label} className="flex-1 bg-white border border-border rounded-2xl p-3 shadow-sm text-center">
                      <span className="text-sm">{m.emoji}</span>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-lg font-bold text-foreground">{m.value}</p>
                    </div>
                  ))}
                </div>
                {result.health_score && (
                  <div className="bg-white border border-border rounded-[20px] p-4 mt-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💖</span>
                        <span className="font-semibold text-foreground">Health Score</span>
                      </div>
                      <span className="font-bold text-foreground">{result.health_score}/10</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(result.health_score / 10) * 100}%`,
                          backgroundColor: result.health_score >= 7 ? '#22c55e' : result.health_score >= 4 ? '#eab308' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1].map(i => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === slide ? 'bg-foreground' : 'bg-muted-foreground/30'}`}
              />
            ))}
          </div>
        </div>

        {/* Deep analysis section (Call 2) */}
        {result.step >= 2 && (
          <div className="mt-5 space-y-3">
            {result.diet_compatibility && (
              <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">Diet Compatibility</span>
                  <VerdictPill value={result.diet_compatibility} />
                </div>
                <p className="text-xs text-muted-foreground">{result.diet_reason}</p>
              </div>
            )}
            {result.bloat_risk && (
              <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">Bloat Risk</span>
                  <VerdictPill value={result.bloat_risk} />
                </div>
                <p className="text-xs text-muted-foreground">{result.bloat_reason}</p>
              </div>
            )}
            {result.glycemic_impact && (
              <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">Glycemic Impact</span>
                  <VerdictPill value={result.glycemic_impact} />
                </div>
                <p className="text-xs text-muted-foreground">{result.glycemic_reason}</p>
              </div>
            )}
            {result.appearance_tip && (
              <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">Appearance Tip</span>
                </div>
                <p className="text-xs text-muted-foreground">{result.appearance_tip}</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        <div className="mt-5 bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">⚙️</span>
            <span className="text-sm text-muted-foreground">How did Cal AI do?</span>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ThumbsDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4 pb-8 flex gap-3 max-w-lg mx-auto">
        <Button
          variant="outline"
          onClick={onScanAnother}
          className="flex-1 h-12 rounded-2xl font-semibold glass-button border-border"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Fix Issue
        </Button>
        <Button
          onClick={onLog}
          className="flex-1 h-12 rounded-2xl bg-foreground text-white font-semibold"
        >
          Done
        </Button>
      </div>
    </div>
  );
}