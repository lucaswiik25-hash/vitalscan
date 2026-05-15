import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles, Plus, ArrowLeft, Camera, Barcode, FileText } from 'lucide-react';
import { format } from 'date-fns';
import FoodScanResult from '../components/scanner/FoodScanResult';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';
import BarcodeInput from '../components/scanner/BarcodeInput';
import { buildCall2Prompt, call2Schema, dietPreamble } from '../lib/dietPrompts';

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

  const getTodayContext = async (dietMode) => {
    if (dietMode !== 'appearance_mode') return {};
    const today = format(new Date(), 'yyyy-MM-dd');
    const [meals, waterLogs, exercises] = await Promise.all([
      base44.entities.Meal.filter({ date: today, logged: true }),
      base44.entities.WaterLog.filter({ date: today }),
      base44.entities.Exercise.filter({ date: today }),
    ]);
    return {
      sodiumToday: meals.reduce((s, m) => s + (m.sodium || 0), 0),
      sugarToday: meals.reduce((s, m) => s + (m.sugar || 0), 0),
      waterMl: waterLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0),
      caloriesBurned: exercises.reduce((s, e) => s + (e.calories_burned || 0), 0),
    };
  };

  const analyse = async () => {
    if (!capturedFile) return;
    setIsAnalyzing(true);
    setCapturedImage(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });

    const userProfile = profile;
    const dietMode = userProfile.diet_mode || 'standard';
    const isAppearance = dietMode === 'appearance_mode';
    const pre = dietPreamble(dietMode);

    const extraContext = extraNotes.trim()
      ? `\n\nAdditional context from user: "${extraNotes.trim()}". Include this in your nutritional estimate.`
      : '';

    const r1raw = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `${pre}You are a professional nutritionist and food scientist. Analyze this image carefully.

If you can see a BARCODE on the packaging, read and return the exact barcode number digits.
If this is a NUTRITION LABEL, extract every value precisely from the label.
If this is a FOOD PHOTO, identify the food and estimate all values accurately.

Return JSON with: name (exact product/food name including brand), confidence ("high"/"medium"/"low"), serving_size, calories (kcal), protein (g), carbs (g), fat (g), saturated_fat (g), sugar (g), fiber (g), sodium (mg), potassium (mg), cholesterol (mg), allergens (array from: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame), has_barcode (boolean), barcode_number (string), ingredients_text (full ingredient list if visible).

NEVER fail. Always estimate from visual cues if exact values are not readable.${extraContext}`,
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

    const todayContext = await getTodayContext(dietMode);
    const call2Prompt = buildCall2Prompt(dietMode, enriched, userProfile, todayContext);

    const r2raw = await base44.functions.invoke('analyzeWithClaude', {
      prompt: call2Prompt,
      response_json_schema: call2Schema,
    });
    const r2result = r2raw.data?.result || r2raw.data || {};

    const finalResult = { ...enriched, ...r2result, image_url: file_url, step: 2, is_appearance_mode: isAppearance, diet_mode: dietMode };
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
    const todayCtx = await getTodayContext(dietMode);
    const r2braw = await base44.functions.invoke('analyzeWithClaude', {
      prompt: buildCall2Prompt(dietMode, enriched, userProfile, todayCtx),
      response_json_schema: call2Schema,
    });
    const finalResult = { ...enriched, ...(r2braw.data?.result || r2braw.data || {}), step: 2, is_appearance_mode: isAppearance, diet_mode: dietMode };
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
    <FoodScannerLanding
      userName={userName}
      foodInput={foodInput}
      labelInput={labelInput}
      uploadInput={uploadInput}
      onBack={() => navigate(-1)}
      onCamera={() => cameraInputRef.current?.click()}
      onBarcode={() => setShowBarcodeInput(true)}
      onLabel={() => labelInputRef.current?.click()}
      onGallery={() => uploadInputRef.current?.click()}
    />
  );
}

function useTypingEffect(lines, speed = 28) {
  const [displayed, setDisplayed] = useState(() => lines.map(() => ''));
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const line = lines[lineIdx];
    if (charIdx < line.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev];
          next[lineIdx] = line.slice(0, charIdx + 1);
          return next;
        });
        setCharIdx(c => c + 1);
      }, speed);
    } else {
      timeoutRef.current = setTimeout(() => {
        setLineIdx(l => l + 1);
        setCharIdx(0);
      }, 320);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [lineIdx, charIdx, lines, speed]);

  return displayed;
}

function FoodScannerLanding({ userName, foodInput, labelInput, uploadInput, onBack, onCamera, onBarcode, onLabel, onGallery }) {
  const lines = [
    `Hi ${userName}.`,
    `Here you can [Photo Scan] your foods by just taking a picture.`,
    `Also you can [Barcode Scan] scan a barcode for the most accurate verdict.`,
    `Lastly you can [Nutrition Label] scan a nutrition label.`,
  ];
  const displayed = useTypingEffect(lines, 26);

  const renderLine = (text, idx) => {
    if (!text) return null;
    if (idx === 0) return <p key={idx} className="text-3xl font-bold text-gray-900 leading-snug">{text}</p>;

    const actions = {
      '[Photo Scan]': { label: 'Photo Scan', onClick: onCamera },
      '[Barcode Scan]': { label: 'Barcode Scan', onClick: onBarcode },
      '[Nutrition Label]': { label: 'Nutrition Label', onClick: onLabel },
    };

    const parts = [];
    let remaining = text;
    Object.entries(actions).forEach(([token, { label, onClick }]) => {
      const ti = remaining.indexOf(token);
      if (ti !== -1) {
        if (ti > 0) parts.push(<span key={`pre-${token}`}>{remaining.slice(0, ti)}</span>);
        parts.push(
          <button key={token} onClick={onClick}
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-900 text-white text-lg font-bold active:scale-95 transition-transform mx-1"
            style={{ verticalAlign: 'middle' }}>
            {label}
          </button>
        );
        remaining = remaining.slice(ti + token.length);
      }
    });
    if (remaining) parts.push(<span key="tail">{remaining}</span>);

    return (
      <p key={idx} className="text-2xl font-semibold text-gray-900 leading-relaxed">
        {parts}
      </p>
    );
  };

  return (
    <div className="min-h-screen px-6 pt-14 pb-20">
      {foodInput}{labelInput}{uploadInput}
      <button onClick={onBack} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-900" />
      </button>
      <div className="space-y-6">
        {lines.map((_, idx) => renderLine(displayed[idx] || '', idx))}
      </div>
      <button onClick={onGallery} className="mt-12 w-full text-center text-sm text-gray-400 font-medium">
        Or choose from gallery →
      </button>
    </div>
  );
}