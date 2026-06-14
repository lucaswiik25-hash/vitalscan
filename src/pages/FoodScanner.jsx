import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles, Plus, ArrowLeft, Camera, Barcode, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import FoodScanResult from '../components/scanner/FoodScanResult';
import { useScanJob, loadScanResult } from '@/lib/ScanJobContext';
import BarcodeInput from '../components/scanner/BarcodeInput';
import MealSlotPicker from '../components/shared/MealSlotPicker';
import SuccessModal from '../components/shared/SuccessModal';
import { buildCall2Prompt, call2Schema, dietPreamble } from '../lib/dietPrompts';
import { useUserProfile } from '../hooks/useUserProfile';
import { parseApiResponse } from '../lib/parseApiResponse';
import { inferMealTypeFromTime, inferMealTypeFromFood, shouldAskMealSlot } from '../lib/mealClassification';
import { listFoodLogs, createFoodLog, listHydrationLogs, listExerciseLogs, createScanHistory, prepareImageForAI } from '@/lib/db';
import { analyzeWithClaude, invokeLLM } from '@/lib/ai';

export default function FoodScanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { runBackgroundAnalysis } = useScanJob();
  const cameraInputRef = useRef(null);
  const labelInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [scanMode, setScanMode] = useState('food'); // 'food' | 'label' | 'full_back'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [extraNotes, setExtraNotes] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const barcodeInputRef = useRef(null);
  const fullBackRef = useRef(null);
  // Step 2: after front scan, optionally scan full back
  const [frontScanData, setFrontScanData] = useState(null);
  const [showFullBackPrompt, setShowFullBackPrompt] = useState(false);
  const [showMealSlotPicker, setShowMealSlotPicker] = useState(false);
  const [pendingLogIt, setPendingLogIt] = useState(true);
  const [showLogSuccess, setShowLogSuccess] = useState(false);
  const [loggedMealName, setLoggedMealName] = useState('');

  const { profile } = useUserProfile();
  const userName = profile.name || 'there';

  // Handle replay from scan history
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('bgScan') === '1') {
      const data = loadScanResult('bgScan_food');
      if (data) setResult(data);
      window.history.replaceState({}, '', window.location.pathname);
    }
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
    // Skip preview — go straight to "anything to add" popup
    setCapturedFile(file);
    setCapturedImage(URL.createObjectURL(file)); // keep for reference but don't show preview
    setShowAddSheet(true);
    e.target.value = '';
  };

  const getTodayContext = async (dietMode) => {
    if (dietMode !== 'appearance_mode') return {};
    const today = format(new Date(), 'yyyy-MM-dd');
    const [meals, waterLogs, exercises] = await Promise.all([
      listFoodLogs({ date: today, logged: true }),
      listHydrationLogs({ date: today }),
      listExerciseLogs({ date: today }),
    ]);
    return {
      sodiumToday: meals.reduce((s, m) => s + (m.sodium || 0), 0),
      sugarToday: meals.reduce((s, m) => s + (m.sugar || 0), 0),
      waterMl: waterLogs.filter(l => l.amount_ml > 0).reduce((s, l) => s + l.amount_ml, 0),
      caloriesBurned: exercises.reduce((s, e) => s + (e.calories_burned || 0), 0),
    };
  };

  const analyseFullBack = async (backFile, frontData) => {
    setIsAnalyzing(true);
    setShowFullBackPrompt(false);
    setCapturedImage(null);
    try {
    const { file_url: back_url, image_base64, image_media_type } = await prepareImageForAI(backFile);

    const r1raw = await analyzeWithClaude({
      image_base64,
      image_media_type,
      prompt: `You are a professional nutritionist. This is the FULL BACK of a food product package for: "${frontData.name || 'food product'}".
Read EVERY visible item on this label: full ingredient list, all nutrition facts, allergens, serving info, additionals.
Combine with and enhance this front-scan data: ${JSON.stringify(frontData)}.
Return the same schema but with the most accurate, complete values extracted from both images.
Return JSON with: name, confidence ("high"), serving_size, calories, protein, carbs, fat, saturated_fat, sugar, fiber, sodium, potassium, cholesterol, allergens (array), has_barcode (false), barcode_number (""), ingredients_text (full visible list).
NEVER fail.`,
      response_json_schema: { type: 'object', properties: { name: { type: 'string' }, confidence: { type: 'string' }, serving_size: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }, saturated_fat: { type: 'number' }, sugar: { type: 'number' }, fiber: { type: 'number' }, sodium: { type: 'number' }, potassium: { type: 'number' }, cholesterol: { type: 'number' }, allergens: { type: 'array', items: { type: 'string' } }, has_barcode: { type: 'boolean' }, barcode_number: { type: 'string' }, ingredients_text: { type: 'string' } } },
    });
    const enriched = { ...frontData, ...parseApiResponse(r1raw), confidence: 'high' };

    const userProfile = profile;
    const dietMode = userProfile.diet_mode || 'standard';
    const isAppearance = dietMode === 'appearance_mode';
    const pre = dietPreamble(dietMode);
    const todayContext = await getTodayContext(dietMode);
    const call2Prompt = buildCall2Prompt(dietMode, enriched, userProfile, todayContext);
    const r2raw = await analyzeWithClaude({ prompt: call2Prompt, response_json_schema: call2Schema });
    const r2result = parseApiResponse(r2raw);
    let vitamins = [];
    try {
      const vitRes = await invokeLLM({ prompt: `List key vitamins in: "${enriched.name}". Up to 8. Return JSON with vitamins array, each: name, amount, dv_percent.`, response_json_schema: { type: 'object', properties: { vitamins: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, amount: { type: 'string' }, dv_percent: { type: 'number' } } } } } } });
      vitamins = vitRes?.vitamins || [];
    } catch {}
    const finalResult = { ...enriched, ...r2result, vitamins, image_url: back_url, step: 2, is_appearance_mode: isAppearance, diet_mode: dietMode, scanned_full_back: true };
    setResult(finalResult);
    createScanHistory({ type: 'food', date: format(new Date(), 'yyyy-MM-dd'), image_url: back_url, product_name: enriched.name, brand: enriched.brand || null, safety_score: finalResult.health_score ? Math.round(finalResult.health_score * 10) : null, result_data: finalResult, verdict: finalResult.diet_compatibility || null }).catch(() => {});
    setIsAnalyzing(false);
    setFrontScanData(null);
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      alert(err.message || 'Failed to analyze the back label. Please try again.');
    }
  };

  const analyse = async () => {
    if (!capturedFile) return;
    const file = capturedFile;
    const notes = extraNotes.trim();
    setShowAddSheet(false);
    setCapturedImage(null);
    setCapturedFile(null);
    setExtraNotes('');

    runBackgroundAnalysis({
      label: 'Analyzing your food…',
      resultKey: 'bgScan_food',
      viewPath: '/food-scanner',
      navigateAway: () => navigate('/scanner'),
      task: async () => {
        const { file_url, image_base64, image_media_type } = await prepareImageForAI(file);
        const userProfile = profile;
        const dietMode = userProfile.diet_mode || 'standard';
        const isAppearance = dietMode === 'appearance_mode';
        const pre = dietPreamble(dietMode);
        const extraContext = notes
          ? `\n\nAdditional context from user: "${notes}". Include this in your nutritional estimate.`
          : '';

        const r1raw = await analyzeWithClaude({
          image_base64,
          image_media_type,
          prompt: `${pre}You are a professional nutritionist and food scientist. Analyze this image carefully.

If you can see a BARCODE on the packaging, read and return the exact barcode number digits.
If this is a NUTRITION LABEL, extract every value precisely from the label.
If this is a FOOD PHOTO, identify the food and estimate all values accurately.

Return JSON with: name (exact product/food name including brand), confidence ("high"/"medium"/"low"), serving_size, calories (kcal), protein (g), carbs (g), fat (g), saturated_fat (g), sugar (g), fiber (g), sodium (mg), potassium (mg), cholesterol (mg), allergens (array from: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame), has_barcode (boolean), barcode_number (string), ingredients_text (full ingredient list if visible).

NEVER fail. Always estimate from visual cues if exact values are not readable.${extraContext}`,
          response_json_schema: { type: 'object', properties: { name: { type: 'string' }, confidence: { type: 'string' }, serving_size: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }, saturated_fat: { type: 'number' }, sugar: { type: 'number' }, fiber: { type: 'number' }, sodium: { type: 'number' }, potassium: { type: 'number' }, cholesterol: { type: 'number' }, allergens: { type: 'array', items: { type: 'string' } }, has_barcode: { type: 'boolean' }, barcode_number: { type: 'string' }, ingredients_text: { type: 'string' } } },
        });
        const call1 = parseApiResponse(r1raw);

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
        const r2raw = await analyzeWithClaude({ prompt: call2Prompt, response_json_schema: call2Schema });
        const r2result = parseApiResponse(r2raw);

        let vitamins = [];
        try {
          const vitRes = await invokeLLM({
            prompt: `List the key vitamins and minerals found in: "${enriched.name}". Return up to 8 most notable ones. For each: name (e.g. "Vitamin C"), amount (e.g. "15mg" or "estimated"), dv_percent (approximate % daily value as a number, 0 if unknown). NEVER fail.`,
            response_json_schema: {
              type: 'object',
              properties: {
                vitamins: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, amount: { type: 'string' }, dv_percent: { type: 'number' } } } }
              }
            }
          });
          vitamins = vitRes?.vitamins || [];
        } catch (_) {}

        const finalResult = { ...enriched, ...r2result, vitamins, image_url: file_url, step: 2, is_appearance_mode: isAppearance, diet_mode: dietMode };
        createScanHistory({
          type: 'food',
          date: format(new Date(), 'yyyy-MM-dd'),
          image_url: file_url,
          product_name: enriched.name,
          brand: enriched.brand || null,
          safety_score: finalResult.health_score ? Math.round(finalResult.health_score * 10) : null,
          result_data: finalResult,
          verdict: finalResult.diet_compatibility || finalResult.appearance_impact || null,
        }).catch(() => {});
        return finalResult;
      },
    });
  };

  const analyseBarcodeManual = async (barcode) => {
    setShowBarcodeInput(false);
    runBackgroundAnalysis({
      label: 'Analyzing product…',
      resultKey: 'bgScan_food',
      viewPath: '/food-scanner',
      navigateAway: () => navigate('/scanner'),
      task: async () => {
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
        const r2braw = await analyzeWithClaude({
          prompt: buildCall2Prompt(dietMode, enriched, userProfile, todayCtx),
          response_json_schema: call2Schema,
        });
        let vitaminsB = [];
        try {
          const vitResB = await invokeLLM({
            prompt: `List the key vitamins and minerals found in: "${enriched.name}". Return up to 8 most notable ones. For each: name, amount (e.g. "15mg"), dv_percent (% daily value as number). NEVER fail.`,
            response_json_schema: { type: 'object', properties: { vitamins: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, amount: { type: 'string' }, dv_percent: { type: 'number' } } } } } }
          });
          vitaminsB = vitResB?.vitamins || [];
        } catch (_) {}
        const analysis = parseApiResponse(r2braw);
        if (!analysis.diet_compatibility && !analysis.appearance_impact && enriched.name?.startsWith('Product ')) {
          throw new Error('Product not found in barcode database. Try scanning the nutrition label instead.');
        }
        const finalResult = { ...enriched, ...analysis, vitamins: vitaminsB, step: 2, is_appearance_mode: isAppearance, diet_mode: dietMode };
        createScanHistory({
          type: 'food',
          date: format(new Date(), 'yyyy-MM-dd'),
          product_name: enriched.name,
          brand: enriched.brand || null,
          result_data: finalResult,
          verdict: finalResult.diet_compatibility || finalResult.appearance_impact || null,
        }).catch(() => {});
        return finalResult;
      },
    });
  };

  const classifyMealType = async (foodName, timeStr) => {
    const timeInference = inferMealTypeFromTime();
    const foodInference = inferMealTypeFromFood(foodName);
    try {
      const res = await invokeLLM({
        prompt: `A user logged "${foodName}" at ${timeStr}. Classify into: breakfast, lunch, dinner, or snack. Also return confidence (0-1) for how certain you are.`,
        response_json_schema: {
          type: 'object',
          properties: {
            meal_type: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
            confidence: { type: 'number' },
          },
        },
      });
      const llmType = res?.meal_type || 'snack';
      const llmConfidence = res?.confidence ?? 0.5;
      if (shouldAskMealSlot({ foodInference, timeInference, llmConfidence })) {
        return { needsPicker: true, meal_type: llmType };
      }
      if (foodInference?.confidence >= 0.8) return { needsPicker: false, meal_type: foodInference.meal_type };
      if (llmConfidence >= 0.85) return { needsPicker: false, meal_type: llmType };
      if (timeInference.confidence >= 0.7) return { needsPicker: false, meal_type: timeInference.meal_type };
      return { needsPicker: false, meal_type: llmType };
    } catch (_) {
      if (foodInference?.confidence >= 0.8) return { needsPicker: false, meal_type: foodInference.meal_type };
      if (timeInference.confidence >= 0.7) return { needsPicker: false, meal_type: timeInference.meal_type };
      return { needsPicker: true, meal_type: 'snack' };
    }
  };

  const saveMeal = async (logIt, meal_type) => {
    if (!result) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const timeStr = format(new Date(), 'h:mm a');
    const mealData = {
      name: result.name || 'Unknown food',
      date: today,
      time: timeStr,
      meal_type,
      calories: Number(result.calories) || 0,
      protein: Number(result.protein) || 0,
      carbs: Number(result.carbs) || 0,
      fat: Number(result.fat) || 0,
      fiber: Number(result.fiber) || 0,
      sugar: Number(result.sugar) || 0,
      sodium: Number(result.sodium) || 0,
      logged: logIt,
    };
    if (result.image_url) mealData.image_url = result.image_url;
    if (result.serving_size) mealData.serving_size = result.serving_size;
    if (result.confidence) mealData.confidence = result.confidence;
    if (result.has_barcode) mealData.source = 'barcode';
    else mealData.source = 'ai_visual';
    if (result.allergens?.length) mealData.allergens_detected = result.allergens;
    if (result.diet_compatibility) mealData.diet_compatibility = result.diet_compatibility;
    if (result.diet_reason) mealData.diet_reason = result.diet_reason;
    if (result.bloat_risk) mealData.bloat_risk = result.bloat_risk;
    if (result.bloat_reason) mealData.bloat_reason = result.bloat_reason;
    if (result.glycemic_impact) mealData.glycemic_impact = result.glycemic_impact;
    if (result.glycemic_reason) mealData.glycemic_reason = result.glycemic_reason;
    if (result.health_score) mealData.health_score = result.health_score;
    if (result.vitamins?.length) mealData.vitamins = result.vitamins;
    await createFoodLog(mealData);
    queryClient.invalidateQueries({ queryKey: ['meals'] });
    queryClient.invalidateQueries({ queryKey: ['allMeals'] });
    queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
    if (logIt) {
      setLoggedMealName(mealData.name);
      setShowLogSuccess(true);
    } else {
      navigate('/');
    }
  };

  const logMeal = async (logIt = true) => {
    if (!result) return;
    if (!logIt) {
      await saveMeal(false, 'snack');
      return;
    }
    const timeStr = format(new Date(), 'h:mm a');
    const classification = await classifyMealType(result.name || 'food', timeStr);
    if (classification.needsPicker) {
      setPendingLogIt(logIt);
      setShowMealSlotPicker(true);
      return;
    }
    await saveMeal(logIt, classification.meal_type);
  };

  const handleMealSlotSelect = async (meal_type) => {
    setShowMealSlotPicker(false);
    await saveMeal(pendingLogIt, meal_type);
  };

  // "Anything to add" popup — shown right after photo is taken, before analyzing
  if (showAddSheet && capturedFile) {
    return (
      <div className="fixed inset-0 bg-black/60 flex flex-col justify-end z-50">
        <motion.div
          className="bg-white rounded-t-[28px] px-5 pt-5 pb-10 space-y-4"
          initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-2" />
          {capturedImage && (
            <div className="w-full h-36 rounded-2xl overflow-hidden mb-2">
              <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <p className="text-base font-bold text-gray-900">Anything to add?</p>
          <p className="text-xs text-gray-400">Describe hidden ingredients, sauces, or extras the AI might miss.</p>
          <textarea
            value={extraNotes}
            onChange={e => setExtraNotes(e.target.value)}
            placeholder="e.g. also had ketchup, hidden vegetables, olive oil drizzle..."
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
            rows={3}
            autoFocus
          />
          <button onClick={() => { setShowAddSheet(false); analyse(); }}
            className="w-full h-14 rounded-full bg-gray-900 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg">
            Analyse
          </button>
          <button onClick={() => { setShowAddSheet(false); setCapturedFile(null); setCapturedImage(null); setExtraNotes(''); }}
            className="w-full text-center text-sm text-gray-400 font-medium">
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <>
        <FoodScanResult
          result={result}
          onResultChange={setResult}
          onLog={() => logMeal(true)}
          onLogAnalysisOnly={() => logMeal(false)}
          onScanAnother={() => { setResult(null); setCapturedImage(null); setCapturedFile(null); setExtraNotes(''); }}
          onBack={() => { setResult(null); navigate('/scanner'); }}
        />
        {showMealSlotPicker && (
          <MealSlotPicker
            foodName={result.name || 'this food'}
            onSelect={handleMealSlotSelect}
            onClose={() => setShowMealSlotPicker(false)}
          />
        )}
        {showLogSuccess && (
          <SuccessModal
            title="Meal Logged!"
            message={`${loggedMealName} has been saved to your diary.`}
            onClose={() => { setShowLogSuccess(false); navigate('/'); }}
          />
        )}
      </>
    );
  }



  // Hidden barcode camera input (used by BarcodeInput modal)
  const barcodeCameraInput = (
    <input
      ref={barcodeInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setShowBarcodeInput(false);
        setIsAnalyzing(true);
        try {
          const { image_base64, image_media_type } = await prepareImageForAI(file);
          const r = await analyzeWithClaude({
            image_base64,
            image_media_type,
            prompt: 'This image contains a barcode. Read the exact numeric barcode digits printed under the bars. Return JSON with barcode_number as a string of digits only.',
            response_json_schema: { type: 'object', properties: { barcode_number: { type: 'string' } } },
          });
          const barcodeNumber = (parseApiResponse(r).barcode_number || '').replace(/\D/g, '');
          if (barcodeNumber) {
            await analyseBarcodeManual(barcodeNumber);
          } else {
            setIsAnalyzing(false);
            setShowBarcodeInput(true);
          }
        } catch (err) {
          console.error(err);
          setIsAnalyzing(false);
          setShowBarcodeInput(true);
          alert(err.message || 'Could not read barcode. Try again or enter it manually.');
        }
      }}
    />
  );

  if (showBarcodeInput) {
    return (
      <>
        {barcodeCameraInput}
        <BarcodeInput
          onSubmit={analyseBarcodeManual}
          onClose={() => setShowBarcodeInput(false)}
          onCameraScan={() => barcodeInputRef.current?.click()}
        />
      </>
    );
  }

  // Full-back prompt overlay
  if (showFullBackPrompt && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <input ref={fullBackRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) { e.target.value = ''; return; }
            e.target.value = '';
            await analyseFullBack(file, frontScanData);
          }} />
        <div className="w-full bg-white" style={{ borderRadius: '28px 28px 0 0', padding: '24px 24px 40px' }}>
          <div style={{ width: 40, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 20px' }} />
          <p style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8 }}>Want 100% accuracy?</p>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>
            Scan the full back of the packaging and the AI will extract all visible ingredients, macros, and allergens for the most complete analysis.
          </p>
          <button
            onClick={() => fullBackRef.current?.click()}
            className="w-full h-14 rounded-2xl bg-gray-900 text-white font-semibold text-base flex items-center justify-center gap-2 mb-3">
            📷 Scan Full Back
          </button>
          <button
            onClick={() => { setShowFullBackPrompt(false); setFrontScanData(null); }}
            className="w-full h-12 rounded-2xl text-gray-500 font-medium text-sm">
            Skip — results are good enough
          </button>
        </div>
      </div>
    );
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
      barcodeInput={barcodeCameraInput}
      onBack={() => navigate(-1)}
      onCamera={() => cameraInputRef.current?.click()}
      onBarcode={() => { setShowBarcodeInput(true); }}
      onLabel={() => labelInputRef.current?.click()}
      onGallery={() => uploadInputRef.current?.click()}
    />
  );
}

function useTypingEffect(lines, speed = 28) {
  const linesRef = useRef(lines);
  const [displayed, setDisplayed] = useState(() => lines.map(() => ''));
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const ls = linesRef.current;
    if (lineIdx >= ls.length) return;
    const line = ls[lineIdx];
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
      }, 220);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [lineIdx, charIdx, speed]);

  return displayed;
}

function FoodScannerLanding({ userName, foodInput, labelInput, uploadInput, barcodeInput, onBack, onCamera, onBarcode, onLabel, onGallery }) {
  const lines = [
    `Hi ${userName}.`,
    `Here you can [Photo Scan] your foods by just taking a picture.`,
    `Also you can [Barcode Scan] scan a barcode for the most accurate verdict.`,
    `Lastly you can [Nutrition Label] scan a nutrition label for detailed macros.`,
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
      {foodInput}{labelInput}{uploadInput}{barcodeInput}
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