import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, HelpCircle, Zap, ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import FoodScanResult from '../components/scanner/FoodScanResult';

const MODES = ['Scan Food', 'Barcode', 'Food Label'];

export default function FoodScanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [mode, setMode] = useState(0);
  const [flash, setFlash] = useState(false);
  const [zoom, setZoom] = useState('1x');
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Auto-trigger camera on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      cameraInputRef.current?.click();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setCapturedImage(previewUrl);
    setCapturedFile(file);
  };

  const analyse = async () => {
    if (!capturedFile) return;
    setIsAnalyzing(true);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });

    // Step 1: identify the food / barcode number from image
    const call1 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional nutritionist and food scientist. Analyze this image carefully.

If you can see a BARCODE on the packaging, read and return the exact barcode number digits.
If this is a NUTRITION LABEL, extract every value precisely from the label.
If this is a FOOD PHOTO, identify the food and estimate all values accurately.

Return:
- name: exact product name or food name including brand if visible
- confidence: "high" (clear label/barcode), "medium" (recognizable food), "low" (unclear)
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
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          serving_size: { type: 'string' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          saturated_fat: { type: 'number' },
          sugar: { type: 'number' },
          fiber: { type: 'number' },
          sodium: { type: 'number' },
          potassium: { type: 'number' },
          cholesterol: { type: 'number' },
          allergens: { type: 'array', items: { type: 'string' } },
          has_barcode: { type: 'boolean' },
          barcode_number: { type: 'string' },
          ingredients_text: { type: 'string' },
        },
      },
    });

    // If barcode detected, fetch real product data from OpenFoodFacts
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
      } catch (_) { /* fallback to AI data */ }
    }

    setResult({ ...enriched, image_url: file_url, step: 1 });
    setIsAnalyzing(false);

    const call2 = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a clinical nutritionist and dermatologist. Analyze this food for diet, body, and appearance impact.

Food: "${enriched.name}"
Nutrition per serving: ${enriched.calories} kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium, ${enriched.fiber || 0}g fiber

Provide a complete analysis. Return:
- diet_compatibility: "yes", "limit", or "no" — verdict for a general healthy diet
- diet_reason: one sentence explaining the verdict
- bloat_risk: "low", "medium", or "high"
- bloat_reason: one sentence
- glycemic_impact: "low", "medium", or "high"
- glycemic_reason: one sentence
- collagen_effect: "Positive", "Neutral", or "Negative"
- inflammation: "Low", "Medium", or "High" — inflammation this food causes
- sebum_effect: "Increases", "Neutral", or "Reduces"
- skin_summary: two sentences on what this food does to skin over time with regular consumption
- appearance_tip: one actionable sentence specific to this exact food
- tomorrow_face: "Positive", "Neutral", or "Negative" contribution to next-day appearance
- tomorrow_face_note: one sentence explaining
- hormone_impact: "Positive", "Neutral", or "Negative"
- hormone_note: one sentence on testosterone or estrogen effect
- gut_health: "Positive", "Neutral", or "Negative"
- gut_note: one sentence reason
- processing_level: "Whole Food", "Minimally Processed", "Processed", or "Ultra Processed"
- health_score: number 1-10

NEVER fail. Always provide all fields.`,
      response_json_schema: {
        type: 'object',
        properties: {
          diet_compatibility: { type: 'string', enum: ['yes', 'limit', 'no'] },
          diet_reason: { type: 'string' },
          bloat_risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          bloat_reason: { type: 'string' },
          glycemic_impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          glycemic_reason: { type: 'string' },
          collagen_effect: { type: 'string' },
          inflammation: { type: 'string' },
          sebum_effect: { type: 'string' },
          skin_summary: { type: 'string' },
          appearance_tip: { type: 'string' },
          tomorrow_face: { type: 'string' },
          tomorrow_face_note: { type: 'string' },
          hormone_impact: { type: 'string' },
          hormone_note: { type: 'string' },
          gut_health: { type: 'string' },
          gut_note: { type: 'string' },
          processing_level: { type: 'string' },
          health_score: { type: 'number' },
        },
      },
    });

    setResult(prev => ({ ...prev, ...call2, step: 2 }));
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
        onScanAnother={() => { setResult(null); setCapturedImage(null); setCapturedFile(null); cameraInputRef.current?.click(); }}
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="flex-1 relative">
        {capturedImage ? (
          <img src={capturedImage} className="w-full h-full object-cover absolute inset-0" alt="" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 absolute inset-0" />
        )}

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-12 h-1 bg-white/30 rounded-full" />
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scan frame — only when no image captured */}
        {!capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            {mode === 1 ? (
              <div className="w-[80%] h-[25%] relative">
                {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl'].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />
                ))}
              </div>
            ) : (
              <div className="w-[75%] aspect-square relative">
                {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl'].map((cls, i) => (
                  <div key={i} className={`absolute w-10 h-10 border-white ${cls}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analyse button overlay when image is captured */}
        {capturedImage && !isAnalyzing && (
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3 z-10 px-6">
            <button
              onClick={analyse}
              className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.95)', color: '#1a1a1a' }}
            >
              <Sparkles className="w-5 h-5" />
              Analyse
            </button>
            <button
              onClick={() => { setCapturedImage(null); setCapturedFile(null); cameraInputRef.current?.click(); }}
              className="text-white/60 text-sm font-medium"
            >
              Retake photo
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <p className="text-white font-semibold text-lg">Analyzing...</p>
            <p className="text-white/60 text-sm mt-1">Identifying your food</p>
          </div>
        )}
      </div>

      {/* Controls — hide when image captured */}
      {!capturedImage && (
        <div className="bg-black px-4 pb-10 pt-4">
          <div className="flex items-center justify-center mb-4">
            <div className="flex bg-white/10 rounded-full p-0.5">
              {['.5x', '1x'].map(z => (
                <button key={z} onClick={() => setZoom(z)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${zoom === z ? 'bg-white/20 text-white' : 'text-white/50'}`}>
                  {z}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            {MODES.map((m, i) => (
              <button key={m} onClick={() => setMode(i)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${mode === i ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between px-6">
            <button onClick={() => setFlash(!flash)} className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
              <Zap className={`w-5 h-5 ${flash ? 'text-yellow-400' : 'text-white/60'}`} />
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white/30 flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-white" />
            </button>
            <button onClick={() => uploadInputRef.current?.click()} className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}