import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles, Plus, ArrowLeft, Camera, Barcode, FileText } from 'lucide-react';
import { format } from 'date-fns';
import FoodScanResult from '../components/scanner/FoodScanResult';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';
import BarcodeInput from '../components/scanner/BarcodeInput';

export default function FoodScanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cameraInputRef = useRef(null);
  const labelInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [scanMode, setScanMode] = useState('food'); // 'food' | 'label'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [extraNotes, setExtraNotes] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};
  const userName = profile.name || 'there';

  // Handle replay from scan history
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('replay') === '1') {
      const stored = sessionStorage.getItem('replayScan');
      if (stored) {
        try {
          const { scan } = JSON.parse(stored);
          if (scan) {
            // Build a result object from stored scan data
            const resultData = scan.result_data || {};
            setResult({
              ...resultData,
              name: resultData.name || scan.product_name,
              image_url: resultData.image_url || scan.image_url,
            });
          }
        } catch (_) {}
        sessionStorage.removeItem('replayScan');
      }
    }
  }, []);

  const handleFileChange = (e, mode) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanMode(mode || 'food');
    setCapturedImage(URL.createObjectURL(file));
    setCapturedFile(file);
    e.target.value = '';
  };

  const analyse = async () => {
    if (!capturedFile) return;
    setIsAnalyzing(true);
    setCapturedImage(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });

    const userProfile = profile;
    const dietMode = userProfile.diet_mode || 'standard';
    const isAppearance = dietMode === 'appearance_mode';

    const extraContext = extraNotes.trim()
      ? `\n\nAdditional context from user: "${extraNotes.trim()}". Include this in your nutritional estimate.`
      : '';

    const r1raw = await base44.functions.invoke('analyzeWithClaude', {
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

NEVER fail. Always estimate from visual cues if exact values are not readable.${isAppearance ? '\n\nAPPEARANCE MODE: Also return sodium and potassium as required numeric fields (mg).' : ''}${extraContext}`,
      response_json_schema: { type: 'object', properties: { name: { type: 'string' }, confidence: { type: 'string' }, serving_size: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }, saturated_fat: { type: 'number' }, sugar: { type: 'number' }, fiber: { type: 'number' }, sodium: { type: 'number' }, potassium: { type: 'number' }, cholesterol: { type: 'number' }, allergens: { type: 'array', items: { type: 'string' } }, has_barcode: { type: 'boolean' }, barcode_number: { type: 'string' }, ingredients_text: { type: 'string' } } },
    });
    const call1 = r1raw.data?.result || r1raw.data || {};

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

    const appearancePrompt = isAppearance ? `You are a dermatologist and appearance optimization expert. Food: "${enriched.name}". Nutrition: ${enriched.calories}kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium. User sex: ${userProfile.sex || 'unknown'}. Return appearance_impact ("Excellent"/"Good"/"Neutral"/"Avoid"), appearance_reason, bloat_risk ("Low"/"Medium"/"High"), bloat_reason, skin_impact, collagen_effect, collagen_reason, hormone_effect, hormone_reason, tomorrow_face, glycemic_impact ("Low"/"Medium"/"High"), glycemic_reason, health_score (1-10), processing_level. NEVER fail.`
      : `You are a clinical nutritionist. User's diet: ${dietMode}. Food: "${enriched.name}". Nutrition: ${enriched.calories}kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium. Return diet_compatibility ("yes"/"limit"/"no"), diet_reason, bloat_risk ("low"/"medium"/"high"), bloat_reason, glycemic_impact ("low"/"medium"/"high"), glycemic_reason, collagen_effect, inflammation ("Low"/"Medium"/"High"), sebum_effect, skin_summary, appearance_tip, tomorrow_face, tomorrow_face_note, hormone_impact, hormone_note, gut_health, gut_note, processing_level ("Whole Food"/"Minimally Processed"/"Processed"/"Ultra Processed"), health_score (1-10). NEVER fail.`;

    const appearanceSchema = { type: 'object', properties: { appearance_impact: { type: 'string' }, appearance_reason: { type: 'string' }, bloat_risk: { type: 'string' }, bloat_reason: { type: 'string' }, skin_impact: { type: 'string' }, collagen_effect: { type: 'string' }, collagen_reason: { type: 'string' }, hormone_effect: { type: 'string' }, hormone_reason: { type: 'string' }, tomorrow_face: { type: 'string' }, glycemic_impact: { type: 'string' }, glycemic_reason: { type: 'string' }, health_score: { type: 'number' }, processing_level: { type: 'string' } } };
    const standardSchema = { type: 'object', properties: { diet_compatibility: { type: 'string' }, diet_reason: { type: 'string' }, bloat_risk: { type: 'string' }, bloat_reason: { type: 'string' }, glycemic_impact: { type: 'string' }, glycemic_reason: { type: 'string' }, collagen_effect: { type: 'string' }, inflammation: { type: 'string' }, sebum_effect: { type: 'string' }, skin_summary: { type: 'string' }, appearance_tip: { type: 'string' }, tomorrow_face: { type: 'string' }, tomorrow_face_note: { type: 'string' }, hormone_impact: { type: 'string' }, hormone_note: { type: 'string' }, gut_health: { type: 'string' }, gut_note: { type: 'string' }, processing_level: { type: 'string' }, health_score: { type: 'number' } } };

    const r2raw = await base44.functions.invoke('analyzeWithClaude', {
      prompt: appearancePrompt,
      response_json_schema: isAppearance ? appearanceSchema : standardSchema,
    });
    const r2result = r2raw.data?.result || r2raw.data || {};

    const finalResult = { ...enriched, ...r2result, image_url: file_url, step: 2, is_appearance_mode: isAppearance };
    setResult(finalResult);
    base44.entities.ScanResult.create({
      type: 'food',
      date: format(new Date(), 'yyyy-MM-dd'),
      image_url: file_url,
      product_name: enriched.name,
      brand: enriched.brand || null,
      safety_score: finalResult.health_score ? Math.round(finalResult.health_score * 10) : null,
      result_data: finalResult,
      verdict: finalResult.diet_compatibility || finalResult.appearance_impact || null,
    }).catch(() => {});
    setIsAnalyzing(false);
  };

  const analyseBarcodeManual = async (barcode) => {
    setShowBarcodeInput(false);
    setIsAnalyzing(true);
    let enriched = { name: `Product ${barcode}`, barcode, has_barcode: true, barcode_number: barcode, confidence: 'medium' };
    try {
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const offData = await offRes.json();
      if (offData.status === 1 && offData.product) {
        const p = offData.product;
        const n = p.nutriments || {};
        enriched = {
          name: p.product_name || enriched.name,
          brand: p.brands || '',
          serving_size: p.serving_size || '100g',
          calories: Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0),
          protein: Math.round((n['proteins_serving'] || n['proteins_100g'] || 0) * 10) / 10,
          carbs: Math.round((n['carbohydrates_serving'] || n['carbohydrates_100g'] || 0) * 10) / 10,
          fat: Math.round((n['fat_serving'] || n['fat_100g'] || 0) * 10) / 10,
          fiber: Math.round((n['fiber_serving'] || n['fiber_100g'] || 0) * 10) / 10,
          sugar: Math.round((n['sugars_serving'] || n['sugars_100g'] || 0) * 10) / 10,
          sodium: Math.round((n['sodium_serving'] || n['sodium_100g'] || 0) * 1000),
          allergens: (p.allergens_tags || []).map(a => a.replace('en:', '')),
          ingredients_text: p.ingredients_text || '',
          confidence: 'high',
          source: 'openfoodfacts',
          has_barcode: true,
          barcode_number: barcode,
        };
      }
    } catch (_) {}
    const userProfile = profile;
    const dietMode = userProfile.diet_mode || 'standard';
    const isAppearance = dietMode === 'appearance_mode';
    const r2braw = await base44.functions.invoke('analyzeWithClaude', {
      prompt: isAppearance
        ? `Appearance Mode analysis for: "${enriched.name}". Nutrition: ${enriched.calories}kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium. Return appearance_impact, appearance_reason, bloat_risk, bloat_reason, skin_impact, collagen_effect, collagen_reason, hormone_effect, hormone_reason, tomorrow_face, glycemic_impact, glycemic_reason, health_score (1-10), processing_level.`
        : `Diet compatibility for "${enriched.name}" on ${dietMode} diet. Nutrition: ${enriched.calories}kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium. Return diet_compatibility, diet_reason, bloat_risk, bloat_reason, glycemic_impact, glycemic_reason, collagen_effect, inflammation, sebum_effect, skin_summary, appearance_tip, tomorrow_face, hormone_impact, hormone_note, gut_health, gut_note, processing_level, health_score (1-10).`,
      response_json_schema: { type: 'object', properties: { diet_compatibility: { type: 'string' }, diet_reason: { type: 'string' }, appearance_impact: { type: 'string' }, appearance_reason: { type: 'string' }, bloat_risk: { type: 'string' }, bloat_reason: { type: 'string' }, glycemic_impact: { type: 'string' }, glycemic_reason: { type: 'string' }, collagen_effect: { type: 'string' }, collagen_reason: { type: 'string' }, inflammation: { type: 'string' }, skin_impact: { type: 'string' }, skin_summary: { type: 'string' }, appearance_tip: { type: 'string' }, tomorrow_face: { type: 'string' }, hormone_effect: { type: 'string' }, hormone_reason: { type: 'string' }, hormone_impact: { type: 'string' }, hormone_note: { type: 'string' }, gut_health: { type: 'string' }, gut_note: { type: 'string' }, processing_level: { type: 'string' }, health_score: { type: 'number' } } },
    });
    const finalResult = { ...enriched, ...(r2braw.data?.result || r2braw.data || {}), step: 2, is_appearance_mode: isAppearance };
    setResult(finalResult);
    base44.entities.ScanResult.create({
      type: 'food',
      date: format(new Date(), 'yyyy-MM-dd'),
      product_name: enriched.name,
      brand: enriched.brand || null,
      result_data: finalResult,
      verdict: finalResult.diet_compatibility || finalResult.appearance_impact || null,
    }).catch(() => {});
    setIsAnalyzing(false);
  };

  const logMeal = async (logIt = true) => {
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
      logged: logIt,
    });
    queryClient.invalidateQueries({ queryKey: ['meals'] });
    queryClient.invalidateQueries({ queryKey: ['allMeals'] });
    navigate('/');
  };

  // Analyzing screen
  if (isAnalyzing) {
    return <AnalyzingScreen type="food" message="Analysing your food..." />;
  }

  // Result screen
  if (result) {
    return (
      <FoodScanResult
        result={result}
        onLog={() => logMeal(true)}
        onLogAnalysisOnly={() => logMeal(false)}
        onScanAnother={() => { setResult(null); setCapturedImage(null); setCapturedFile(null); setExtraNotes(''); }}
        onBack={() => { setResult(null); navigate('/food-scanner'); }}
      />
    );
  }

  // Photo preview screen
  if (capturedImage) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={capturedImage} className="flex-1 w-full object-cover" alt="Captured" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
          <button onClick={() => { setCapturedImage(null); setCapturedFile(null); }}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        {showAddSheet && (
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/20" onClick={() => setShowAddSheet(false)} />
            <div className="relative bg-white rounded-t-[28px] px-5 pt-5 pb-10" style={{ maxHeight: '35vh' }}>
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-900 mb-1">Anything to add?</p>
              <p className="text-xs text-gray-400 mb-3">Describe hidden ingredients, sauces, or extras the AI might miss.</p>
              <textarea
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
                placeholder="e.g. also had ketchup, hidden vegetables, olive oil drizzle..."
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
                rows={3}
                autoFocus
              />
            </div>
          </div>
        )}
        {!showAddSheet && (
          <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-3">
            <button onClick={() => setShowAddSheet(true)}
              className="flex items-center gap-1.5 text-white/70 text-sm font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Plus className="w-4 h-4" />
              Anything to add?
              {extraNotes.trim() && <span className="w-2 h-2 rounded-full bg-green-400 ml-1" />}
            </button>
            <button onClick={analyse}
              className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg">
              <Sparkles className="w-5 h-5" />
              Analyse
            </button>
            <button onClick={() => { setCapturedImage(null); setCapturedFile(null); }} className="text-white/70 text-sm font-medium">
              Retake photo
            </button>
          </div>
        )}
        {showAddSheet && (
          <div className="absolute bottom-[35vh] left-0 right-0 pb-4 px-6">
            <button onClick={() => { setShowAddSheet(false); analyse(); }}
              className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg">
              <Sparkles className="w-5 h-5" />
              Analyse
            </button>
          </div>
        )}
      </div>
    );
  }

  if (showBarcodeInput) {
    return <BarcodeInput onSubmit={analyseBarcodeManual} onClose={() => setShowBarcodeInput(false)} />;
  }

  // Hidden file inputs
  const foodInput = <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileChange(e, 'food')} />;
  const labelInput = <input ref={labelInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileChange(e, 'label')} />;
  const uploadInput = <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'food')} />;

  // ─── Landing page ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white px-6 pt-14 pb-20">
      {foodInput}{labelInput}{uploadInput}

      {/* Back button */}
      <button onClick={() => navigate(-1)} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-900" />
      </button>

      {/* Intro text */}
      <div className="space-y-6">
        <p className="text-3xl font-bold text-gray-900 leading-snug">
          Hi {userName}.
        </p>

        {/* Line 1: food picture scan */}
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Here you can{' '}
          <ScanButton
            label="📷 photo scan"
            onClick={() => cameraInputRef.current?.click()}
          />{' '}
          your foods by just taking a picture.
        </p>

        {/* Line 2: barcode */}
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Also you can{' '}
          <ScanButton
            label="▌▌▌ barcode"
            onClick={() => setShowBarcodeInput(true)}
          />{' '}
          scan a barcode for the most accurate verdict.
        </p>

        {/* Line 3: nutrition label */}
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Lastly you can{' '}
          <ScanButton
            label="☰ nutrition label"
            onClick={() => labelInputRef.current?.click()}
          />{' '}
          scan a nutrition label.
        </p>
      </div>

      {/* Upload from gallery link */}
      <button onClick={() => uploadInputRef.current?.click()}
        className="mt-12 w-full text-center text-sm text-gray-400 font-medium">
        Or choose from gallery →
      </button>
    </div>
  );
}

function ScanButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-900 text-white text-lg font-bold active:scale-95 transition-transform mx-1"
      style={{ verticalAlign: 'middle' }}
    >
      {label}
    </button>
  );
}