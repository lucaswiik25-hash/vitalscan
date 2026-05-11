import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, HelpCircle, Zap, ImageIcon, Barcode, FileText, UtensilsCrossed, Sparkles, Plus } from 'lucide-react';
import { format } from 'date-fns';
import FoodScanResult from '../components/scanner/FoodScanResult';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';
import BarcodeInput from '../components/scanner/BarcodeInput';

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
  const [extraNotes, setExtraNotes] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);

  // Animate scan line — slow: 4 seconds per cycle
  useEffect(() => {
    let start = null;
    let raf;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % 4000;
      setScanLineAnim(elapsed / 4000);
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
    e.target.value = '';
  };

  const analyse = async () => {
    if (!capturedFile) return;
    setIsAnalyzing(true);
    setCapturedImage(null); // hide preview, show analyzing screen

    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });

    const profiles = await base44.entities.UserProfile.list();
    const userProfile = profiles[0] || {};
    const dietMode = userProfile.diet_mode || 'standard';
    const isAppearance = dietMode === 'appearance_mode';

    const extraContext = extraNotes.trim()
      ? `\n\nAdditional context from user: "${extraNotes.trim()}". Include this in your nutritional estimate.`
      : '';

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

NEVER fail. Always estimate from visual cues if exact values are not readable.${isAppearance ? '\n\nAPPEARANCE MODE: Also return sodium and potassium as required numeric fields (mg).' : ''}${extraContext}`,
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

    // Run second analysis in parallel with showing step-1 result
    const appearancePrompt = isAppearance ? `You are a dermatologist and appearance optimization expert. This user is on APPEARANCE MODE — their entire goal is facial clarity, reduced water retention, sharp facial definition, clear skin, reduced undereye puffiness, and hormonal balance.

APPEARANCE FOODS TO RATE POSITIVELY: eggs, salmon, fatty fish, avocado, blueberries, dark berries, leafy greens, spinach, kale, cucumber, watermelon, sweet potato, olive oil, green tea, pumpkin seeds, broccoli, bone broth, kiwi, Brazil nuts, dark chocolate 85%+, pomegranate, carrots, garlic, walnuts.

APPEARANCE FOODS TO FLAG NEGATIVELY: high sodium foods (water retention → next day puffiness), refined sugar/added sugar (insulin spike → inflammation, glycation, sebum), seed oils (sunflower/canola/soybean/vegetable — inflammatory, disrupts omega ratio), alcohol (dehydrates skin, disrupts sleep), processed meats (sodium + nitrates → inflammation), dairy (IGF-1 spike → sebum in sensitive individuals), white bread/refined carbs (high GI → insulin → inflammation), soda/energy drinks (gut microbiome → skin), fast food (triple threat), artificial sweeteners (gut dysbiosis → skin), soy in large amounts (phytoestrogens → testosterone balance), trans fats (inflammatory, disrupts cell membranes).

Food: "${enriched.name}"
Nutrition per serving: ${enriched.calories} kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium, ${enriched.fiber || 0}g fiber
User sex: ${userProfile.sex || 'unknown'}

Return JSON with:
- appearance_impact: "Excellent", "Good", "Neutral", or "Avoid"
- appearance_reason: one sentence on why (specific to this food's effect on face/skin)
- bloat_risk: "Low", "Medium", or "High"
- bloat_reason: specific reason tied to sodium or sugar content
- skin_impact: one sentence on what this food does to skin clarity and texture
- collagen_effect: "Supports", "Neutral", or "Damages" with one sentence reason (collagen_reason)
- collagen_reason: string
- hormone_effect: "Supports", "Neutral", or "Disrupts" (for testosterone/hormonal balance)
- hormone_reason: one sentence
- tomorrow_face: one sentence — will this food make tomorrow's face look better or worse and why
- glycemic_impact: "Low", "Medium", or "High"
- glycemic_reason: one sentence (insulin spikes → sebum connection)
- health_score: 1-10
- processing_level: "Whole Food"/"Minimally Processed"/"Processed"/"Ultra Processed"
NEVER fail.` : `You are a clinical nutritionist and dermatologist. Analyze this food for diet, body, and appearance impact.

User's diet mode: ${dietMode}. Tailor the diet_compatibility verdict SPECIFICALLY to the rules of ${dietMode} — not general health.

Food: "${enriched.name}"
Nutrition per serving: ${enriched.calories} kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium, ${enriched.fiber || 0}g fiber

Return JSON with: diet_compatibility ("yes"/"limit"/"no"), diet_reason, bloat_risk ("low"/"medium"/"high"), bloat_reason, glycemic_impact ("low"/"medium"/"high"), glycemic_reason, collagen_effect, inflammation ("Low"/"Medium"/"High"), sebum_effect, skin_summary, appearance_tip, tomorrow_face, tomorrow_face_note, hormone_impact, hormone_note, gut_health, gut_note, processing_level ("Whole Food"/"Minimally Processed"/"Processed"/"Ultra Processed"), health_score (1-10). NEVER fail.`;

    const appearanceSchema = { type: 'object', properties: { appearance_impact: { type: 'string' }, appearance_reason: { type: 'string' }, bloat_risk: { type: 'string' }, bloat_reason: { type: 'string' }, skin_impact: { type: 'string' }, collagen_effect: { type: 'string' }, collagen_reason: { type: 'string' }, hormone_effect: { type: 'string' }, hormone_reason: { type: 'string' }, tomorrow_face: { type: 'string' }, glycemic_impact: { type: 'string' }, glycemic_reason: { type: 'string' }, health_score: { type: 'number' }, processing_level: { type: 'string' } } };
    const standardSchema = { type: 'object', properties: { diet_compatibility: { type: 'string' }, diet_reason: { type: 'string' }, bloat_risk: { type: 'string' }, bloat_reason: { type: 'string' }, glycemic_impact: { type: 'string' }, glycemic_reason: { type: 'string' }, collagen_effect: { type: 'string' }, inflammation: { type: 'string' }, sebum_effect: { type: 'string' }, skin_summary: { type: 'string' }, appearance_tip: { type: 'string' }, tomorrow_face: { type: 'string' }, tomorrow_face_note: { type: 'string' }, hormone_impact: { type: 'string' }, hormone_note: { type: 'string' }, gut_health: { type: 'string' }, gut_note: { type: 'string' }, processing_level: { type: 'string' }, health_score: { type: 'number' } } };

    const { data: r2 } = await base44.functions.invoke('analyzeWithClaude', {
      prompt: appearancePrompt,
      response_json_schema: isAppearance ? appearanceSchema : standardSchema,
    });

    const finalResult = { ...enriched, ...r2.result, image_url: file_url, step: 2, is_appearance_mode: isAppearance };
    setResult(finalResult);
    // Register scan
    base44.entities.ScanResult.create({
      type: 'food',
      date: format(new Date(), 'yyyy-MM-dd'),
      image_url: file_url,
      product_name: enriched.name,
      brand: enriched.brand || null,
      safety_score: finalResult.health_score ? Math.round(finalResult.health_score * 10) : null,
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
    const profiles = await base44.entities.UserProfile.list();
    const userProfile = profiles[0] || {};
    const dietMode = userProfile.diet_mode || 'standard';
    const isAppearance = dietMode === 'appearance_mode';
    const { data: r2 } = await base44.functions.invoke('analyzeWithClaude', {
      prompt: isAppearance
        ? `Appearance Mode analysis for: "${enriched.name}". Nutrition: ${enriched.calories}kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium. Return appearance_impact ("Excellent"/"Good"/"Neutral"/"Avoid"), appearance_reason, bloat_risk ("Low"/"Medium"/"High"), bloat_reason, skin_impact, collagen_effect, collagen_reason, hormone_effect, hormone_reason, tomorrow_face, glycemic_impact ("Low"/"Medium"/"High"), glycemic_reason, health_score (1-10), processing_level.`
        : `Diet compatibility for "${enriched.name}" on ${dietMode} diet. Nutrition: ${enriched.calories}kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs, ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium. Return diet_compatibility ("yes"/"limit"/"no"), diet_reason, bloat_risk ("low"/"medium"/"high"), bloat_reason, glycemic_impact, glycemic_reason, collagen_effect, inflammation, sebum_effect, skin_summary, appearance_tip, tomorrow_face, hormone_impact, hormone_note, gut_health, gut_note, processing_level, health_score (1-10).`,
      response_json_schema: { type: 'object', properties: { diet_compatibility: { type: 'string' }, diet_reason: { type: 'string' }, appearance_impact: { type: 'string' }, appearance_reason: { type: 'string' }, bloat_risk: { type: 'string' }, bloat_reason: { type: 'string' }, glycemic_impact: { type: 'string' }, glycemic_reason: { type: 'string' }, collagen_effect: { type: 'string' }, collagen_reason: { type: 'string' }, inflammation: { type: 'string' }, skin_impact: { type: 'string' }, skin_summary: { type: 'string' }, appearance_tip: { type: 'string' }, tomorrow_face: { type: 'string' }, hormone_effect: { type: 'string' }, hormone_reason: { type: 'string' }, hormone_impact: { type: 'string' }, hormone_note: { type: 'string' }, gut_health: { type: 'string' }, gut_note: { type: 'string' }, processing_level: { type: 'string' }, health_score: { type: 'number' } } },
    });
    const finalResult = { ...enriched, ...r2.result, step: 2, is_appearance_mode: isAppearance };
    setResult(finalResult);
    base44.entities.ScanResult.create({ type: 'food', date: format(new Date(), 'yyyy-MM-dd'), product_name: enriched.name, brand: enriched.brand || null, verdict: r2.result.diet_compatibility || r2.result.appearance_impact || null }).catch(() => {});
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
        onBack={() => navigate(-1)}
      />
    );
  }

  // Photo preview screen (food mode only gets "anything to add" sheet)
  if (capturedImage) {
    const isFoodMode = mode === 0;
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={capturedImage} className="flex-1 w-full object-cover" alt="Captured" />
        {/* Top overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
          <button onClick={() => { setCapturedImage(null); setCapturedFile(null); }}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-8 h-1 rounded-full bg-white/40" />
          <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* "Anything to add" bottom sheet for food mode */}
        {isFoodMode && showAddSheet && (
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

        {/* Bottom actions */}
        {!showAddSheet && (
          <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-3">
            {isFoodMode && (
              <button
                onClick={() => setShowAddSheet(true)}
                className="flex items-center gap-1.5 text-white/70 text-sm font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <Plus className="w-4 h-4" />
                Anything to add?
                {extraNotes.trim() && <span className="w-2 h-2 rounded-full bg-green-400 ml-1" />}
              </button>
            )}
            <button
              onClick={analyse}
              className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              Analyse
            </button>
            <button
              onClick={() => { setCapturedImage(null); setCapturedFile(null); }}
              className="text-white/70 text-sm font-medium"
            >
              Retake photo
            </button>
          </div>
        )}

        {/* Done button when sheet is open */}
        {showAddSheet && (
          <div className="absolute bottom-[35vh] left-0 right-0 pb-4 px-6 flex flex-col items-center gap-2">
            <button
              onClick={() => { setShowAddSheet(false); }}
              className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              Analyse
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show barcode manual input
  if (showBarcodeInput) {
    return <BarcodeInput onSubmit={analyseBarcodeManual} onClose={() => setShowBarcodeInput(false)} />;
  }

  const isBarcode = mode === 1;
  const isLabel = mode === 2;
  const frameW = isBarcode ? '82%' : '75%';
  const frameAspect = isBarcode ? 'aspect-[3/1]' : 'aspect-square';

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12 z-10">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Center scanning frame */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative" style={{ width: frameW }}>
          <div className={`relative ${frameAspect}`}>
            {/* Corner brackets */}
            {[
              'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl',
              'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl',
              'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl',
              'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-10 h-10 border-white ${cls}`} />
            ))}

            {/* Scan line — white, slow */}
            <div
              className="absolute left-2 right-2 h-0.5 rounded-full"
              style={{
                top: `${scanLineAnim * 100}%`,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
              }}
            />
          </div>
        </div>
        <p className="mt-5 text-white/50 text-sm text-center px-8">
          {isBarcode ? 'Point at any product barcode' : isLabel ? 'Align the nutrition label inside the frame' : 'Point at food, a barcode, or a nutrition label'}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="pb-10 px-5 space-y-4">
        {/* Mode selector */}
        <div className="bg-white/10 backdrop-blur rounded-[24px] p-3">
          <div className="flex gap-2 mb-2">
            {MODES.map((m, i) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(i)}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all"
                  style={{ background: mode === i ? 'rgba(255,255,255,0.15)' : 'transparent' }}
                >
                  <Icon className="w-4 h-4" style={{ color: mode === i ? 'white' : 'rgba(255,255,255,0.4)' }} strokeWidth={1.5} />
                  <span className="text-xs font-semibold" style={{ color: mode === i ? 'white' : 'rgba(255,255,255,0.4)' }}>{m.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-white/40">{MODES[mode].desc}</p>
        </div>

        {/* Shutter row */}
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => setFlash(f => !f)}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
          >
            <Zap className={`w-5 h-5 ${flash ? 'text-yellow-400' : 'text-white/40'}`} />
          </button>
          <button
            onClick={() => isBarcode ? setShowBarcodeInput(true) : cameraInputRef.current?.click()}
            className="w-20 h-20 rounded-full bg-white border-4 border-white/30 flex items-center justify-center active:scale-95 transition-transform shadow-lg"
          >
            <div className="w-16 h-16 rounded-full bg-white/80" />
          </button>
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ImageIcon className="w-5 h-5 text-white/40" />
          </button>
        </div>
      </div>
    </div>
  );
}