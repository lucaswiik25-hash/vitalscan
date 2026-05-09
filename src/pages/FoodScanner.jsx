import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, HelpCircle, Zap, ImageIcon, Barcode, FileText, UtensilsCrossed } from 'lucide-react';
import { format } from 'date-fns';
import FoodScanResult from '../components/scanner/FoodScanResult';

const MODES = [
  { id: 'food', label: 'Scan Food', icon: UtensilsCrossed, desc: 'Photograph any meal or packaged product' },
  { id: 'barcode', label: 'Barcode', icon: Barcode, desc: 'Point at any product barcode' },
  { id: 'label', label: 'Food Label', icon: FileText, desc: 'Photograph the nutrition facts panel' },
];

export default function FoodScanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [mode, setMode] = useState(0);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scanLineAnim, setScanLineAnim] = useState(0);

  // Animate scan line
  useEffect(() => {
    let start = null;
    let raf;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % 2000;
      setScanLineAnim(elapsed / 2000);
      raf = requestAnimationFrame(animate);
    };
    if (!capturedFile && !isAnalyzing) {
      raf = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(raf);
  }, [capturedFile, isAnalyzing]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCapturedImage(URL.createObjectURL(file));
    setCapturedFile(file);
  };

  const analyse = async () => {
    if (!capturedFile) return;
    setIsAnalyzing(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });

    const { data: r1 } = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a professional nutritionist and food scientist. Analyze this image carefully.

If you can see a BARCODE on the packaging, read and return the exact barcode number digits.
If this is a NUTRITION LABEL, extract every value precisely from the label.
If this is a FOOD PHOTO, identify the food and estimate all values accurately.

Return JSON with:
- name: exact product name or food name including brand if visible
- confidence: "high", "medium", or "low"
- serving_size: e.g. "1 cup (240ml)" or "100g"
- calories: total kcal per serving
- protein: grams
- carbs: total carbohydrates grams
- fat: total fat grams
- saturated_fat: saturated fat grams
- sugar: total sugars grams
- fiber: dietary fiber grams
- sodium: milligrams
- potassium: milligrams
- cholesterol: milligrams
- allergens: array of detected allergens from: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame
- has_barcode: true only if you can read actual barcode digits
- barcode_number: string of barcode digits if visible
- ingredients_text: full ingredient list text if visible on label

NEVER fail. Always estimate from visual cues if exact values are not readable.`,
      response_json_schema: { type: 'object', properties: { name: { type: 'string' }, confidence: { type: 'string' }, serving_size: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }, saturated_fat: { type: 'number' }, sugar: { type: 'number' }, fiber: { type: 'number' }, sodium: { type: 'number' }, potassium: { type: 'number' }, cholesterol: { type: 'number' }, allergens: { type: 'array', items: { type: 'string' } }, has_barcode: { type: 'boolean' }, barcode_number: { type: 'string' }, ingredients_text: { type: 'string' } } },
    });
    const call1 = r1.result;

    let enriched = { ...call1 };
    if (call1.has_barcode && call1.barcode_number) {
      try {
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${call1.barcode_number}.json`);
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          const p = offData.product;
          const n = p.nutriments || {};
          enriched = {
            ...enriched,
            name: p.product_name || enriched.name,
            brand: p.brands || '',
            serving_size: p.serving_size || enriched.serving_size,
            calories: Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || enriched.calories),
            protein: Math.round((n['proteins_serving'] || n['proteins_100g'] || enriched.protein) * 10) / 10,
            carbs: Math.round((n['carbohydrates_serving'] || n['carbohydrates_100g'] || enriched.carbs) * 10) / 10,
            fat: Math.round((n['fat_serving'] || n['fat_100g'] || enriched.fat) * 10) / 10,
            fiber: Math.round((n['fiber_serving'] || n['fiber_100g'] || enriched.fiber || 0) * 10) / 10,
            sugar: Math.round((n['sugars_serving'] || n['sugars_100g'] || enriched.sugar || 0) * 10) / 10,
            sodium: Math.round((n['sodium_serving'] || n['sodium_100g'] || 0) * 1000),
            allergens: (p.allergens_tags || []).map(a => a.replace('en:', '')),
            ingredients_text: p.ingredients_text || enriched.ingredients_text,
            confidence: 'high',
            source: 'openfoodfacts',
          };
        }
      } catch (_) { }
    }

    setResult({ ...enriched, image_url: file_url, step: 1 });
    setIsAnalyzing(false);

    const { data: r2 } = await base44.functions.invoke('analyzeWithClaude', {
      prompt: `You are a clinical nutritionist and dermatologist. Analyze this food for diet, body, and appearance impact.

Food: "${enriched.name}"
Nutrition per serving: ${enriched.calories} kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium, ${enriched.fiber || 0}g fiber

Return JSON with: diet_compatibility ("yes"/"limit"/"no"), diet_reason, bloat_risk ("low"/"medium"/"high"), bloat_reason, glycemic_impact ("low"/"medium"/"high"), glycemic_reason, collagen_effect, inflammation ("Low"/"Medium"/"High"), sebum_effect, skin_summary, appearance_tip, tomorrow_face, tomorrow_face_note, hormone_impact, hormone_note, gut_health, gut_note, processing_level ("Whole Food"/"Minimally Processed"/"Processed"/"Ultra Processed"), health_score (1-10). NEVER fail.`,
      response_json_schema: { type: 'object', properties: { diet_compatibility: { type: 'string' }, diet_reason: { type: 'string' }, bloat_risk: { type: 'string' }, bloat_reason: { type: 'string' }, glycemic_impact: { type: 'string' }, glycemic_reason: { type: 'string' }, collagen_effect: { type: 'string' }, inflammation: { type: 'string' }, sebum_effect: { type: 'string' }, skin_summary: { type: 'string' }, appearance_tip: { type: 'string' }, tomorrow_face: { type: 'string' }, tomorrow_face_note: { type: 'string' }, hormone_impact: { type: 'string' }, hormone_note: { type: 'string' }, gut_health: { type: 'string' }, gut_note: { type: 'string' }, processing_level: { type: 'string' }, health_score: { type: 'number' } } },
    });
    setResult(prev => ({ ...prev, ...r2.result, step: 2 }));
  };

  const logMeal = async () => {
    if (!result) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    await base44.entities.Meal.create({
      name: result.name,
      date: today,
      time: format(new Date(), 'h:mm a'),
      image_url: result.image_url,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      sugar: result.sugar,
      sodium: result.sodium,
      serving_size: result.serving_size,
      confidence: result.confidence,
      source: result.has_barcode ? 'barcode' : 'ai_visual',
      allergens_detected: result.allergens || [],
      diet_compatibility: result.diet_compatibility,
      diet_reason: result.diet_reason,
      bloat_risk: result.bloat_risk,
      bloat_reason: result.bloat_reason,
      glycemic_impact: result.glycemic_impact,
      glycemic_reason: result.glycemic_reason,
      skin_impact: result.skin_impact,
      appearance_tip: result.appearance_tip,
      health_score: result.health_score,
      logged: true,
    });
    queryClient.invalidateQueries({ queryKey: ['meals'] });
    queryClient.invalidateQueries({ queryKey: ['allMeals'] });
    navigate('/');
  };

  if (result) {
    return (
      <FoodScanResult
        result={result}
        onLog={logMeal}
        onScanAnother={() => { setResult(null); setCapturedImage(null); setCapturedFile(null); }}
        onBack={() => navigate(-1)}
      />
    );
  }

  const isBarcode = mode === 1;
  const isLabel = mode === 2;

  // Frame dimensions
  const frameW = isBarcode ? '82%' : '75%';
  const frameAspect = isBarcode ? 'aspect-[3/1]' : 'aspect-square';

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12 z-10">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-5 h-5 text-gray-700" />
        </button>
        <button className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Center scanning frame */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {isAnalyzing ? (
          <div className="flex flex-col items-center">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ width: '75vw', aspectRatio: '1', boxShadow: '0 0 0 4px rgba(74,222,128,0.4), 0 0 40px rgba(74,222,128,0.3)' }}
            >
              <div className="absolute inset-0 bg-gray-100 rounded-2xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              </div>
              {/* Green pulse border */}
              <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ border: '3px solid rgba(74,222,128,0.7)' }} />
            </div>
            <p className="mt-6 text-gray-500 text-sm font-medium">Analyzing your food...</p>
          </div>
        ) : (
          <>
            <div className="relative" style={{ width: frameW }}>
              <div className={`relative ${frameAspect}`}>
                {/* Corner brackets */}
                {[
                  'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl',
                  'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl',
                  'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl',
                  'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-10 h-10 border-gray-800 ${cls}`} />
                ))}

                {/* Scan line */}
                <div
                  className="absolute left-2 right-2 h-0.5 rounded-full"
                  style={{
                    top: `${scanLineAnim * 100}%`,
                    background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent)',
                    opacity: 0.7,
                  }}
                />

                {/* Label mode overlay */}
                {isLabel && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                    <div className="border-2 border-gray-600 rounded-lg w-3/4 h-3/4 flex flex-col items-center justify-center gap-1 p-2">
                      <div className="w-full h-1 bg-gray-600 rounded" />
                      <div className="w-3/4 h-1 bg-gray-600 rounded" />
                      <div className="w-full h-1 bg-gray-600 rounded" />
                      <div className="w-2/3 h-1 bg-gray-600 rounded" />
                    </div>
                    <p className="text-[9px] text-gray-600 mt-1 font-medium">Align the label inside the frame</p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-5 text-gray-400 text-sm text-center px-8">
              {isBarcode ? 'Point at any product barcode' : isLabel ? 'Align the nutrition label inside the frame' : 'Point at food, a barcode, or a nutrition label'}
            </p>
          </>
        )}
      </div>

      {/* Bottom controls */}
      {!isAnalyzing && (
        <div className="pb-10 px-5 space-y-4">
          {/* Mode selector frosted card */}
          <div className="bg-gray-100/80 backdrop-blur rounded-[24px] p-3">
            <div className="flex gap-2 mb-2">
              {MODES.map((m, i) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(i)}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all"
                    style={{ background: mode === i ? 'white' : 'transparent' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: mode === i ? '#1a1a1a' : '#9ca3af' }} strokeWidth={1.5} />
                    <span className="text-xs font-semibold" style={{ color: mode === i ? '#1a1a1a' : '#9ca3af' }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-gray-400">{MODES[mode].desc}</p>
          </div>

          {/* Shutter row */}
          <div className="flex items-center justify-between px-4">
            <button
              onClick={() => setFlash(f => !f)}
              className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <Zap className={`w-5 h-5 ${flash ? 'text-yellow-500' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gray-900 border-4 border-gray-200 flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
            <button
              onClick={() => uploadInputRef.current?.click()}
              className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}