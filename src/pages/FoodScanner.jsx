import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, HelpCircle, Zap, ImageIcon, Camera } from 'lucide-react';
import { format } from 'date-fns';
import FoodScanResult from '../components/scanner/FoodScanResult';

const MODES = ['Scan Food', 'Barcode', 'Food Label'];

export default function FoodScanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(0);
  const [flash, setFlash] = useState(false);
  const [zoom, setZoom] = useState('1x');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showLabelInfo, setShowLabelInfo] = useState(false);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCapturedImage(previewUrl);
    setIsAnalyzing(true);

    // Upload the file
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Call 1: Basic identification
    const call1 = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this food image. Identify the food, estimate serving size and provide nutritional data.
If this is a packaged product with a barcode visible, note that.
If this is a nutrition label, extract the exact values from it.

Provide your best estimate for all values. Be specific about the food name.`,
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
          fiber: { type: 'number' },
          sugar: { type: 'number' },
          sodium: { type: 'number' },
          has_barcode: { type: 'boolean' },
          allergens: { type: 'array', items: { type: 'string' } },
          ingredients_text: { type: 'string' },
        },
      },
    });

    setResult({ ...call1, image_url: file_url, step: 1 });
    setIsAnalyzing(false);

    // Call 2: Deep analysis (auto-triggered)
    const call2 = await base44.integrations.Core.InvokeLLM({
      prompt: `Given this food "${call1.name}" with these nutrition values:
Calories: ${call1.calories}, Protein: ${call1.protein}g, Carbs: ${call1.carbs}g, Fat: ${call1.fat}g, Sugar: ${call1.sugar}g, Sodium: ${call1.sodium}mg

Analyze:
1. Diet compatibility for a general healthy diet (yes/limit/no with reason)
2. Bloat risk level (low/medium/high with reason)
3. Glycemic impact (low/medium/high with reason)
4. Skin impact: collagen effect, inflammation level, sebum effect, summary
5. Appearance tip
6. Health score 1-10
7. Whether this food makes tomorrow's bloat better or worse`,
      response_json_schema: {
        type: 'object',
        properties: {
          diet_compatibility: { type: 'string', enum: ['yes', 'limit', 'no'] },
          diet_reason: { type: 'string' },
          bloat_risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          bloat_reason: { type: 'string' },
          glycemic_impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          glycemic_reason: { type: 'string' },
          skin_impact: {
            type: 'object',
            properties: {
              collagen_effect: { type: 'string' },
              inflammation: { type: 'string' },
              sebum_effect: { type: 'string' },
              summary: { type: 'string' },
            },
          },
          appearance_tip: { type: 'string' },
          health_score: { type: 'number' },
          tomorrow_prediction: { type: 'string' },
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

  // Show result screen
  if (result) {
    return (
      <FoodScanResult
        result={result}
        onLog={logMeal}
        onScanAnother={() => { setResult(null); setCapturedImage(null); }}
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Camera preview / placeholder */}
      <div className="flex-1 relative">
        {capturedImage ? (
          <img src={capturedImage} className="w-full h-full object-cover absolute inset-0" alt="" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900" />
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-12 h-1 bg-white/30 rounded-full" />
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scan frame */}
        {!isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center">
            {mode === 1 ? (
              // Barcode frame: wide horizontal
              <div className="w-[80%] h-[25%] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-xl" style={{ borderWidth: '3px' }} />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-xl" style={{ borderWidth: '3px' }} />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-xl" style={{ borderWidth: '3px' }} />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-xl" style={{ borderWidth: '3px' }} />
              </div>
            ) : (
              // Food scan frame: square
              <div className="w-[75%] aspect-square relative">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-white rounded-tl-2xl" style={{ borderWidth: '3px' }} />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-white rounded-tr-2xl" style={{ borderWidth: '3px' }} />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-white rounded-bl-2xl" style={{ borderWidth: '3px' }} />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-white rounded-br-2xl" style={{ borderWidth: '3px' }} />
              </div>
            )}
          </div>
        )}

        {/* Analyzing overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" style={{ borderWidth: '3px' }} />
            </div>
            <p className="text-white font-semibold text-lg">Analyzing...</p>
            <p className="text-white/60 text-sm mt-1">Identifying your food</p>
          </div>
        )}
      </div>

      {/* Food label info overlay */}
      {showLabelInfo && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur flex flex-col items-center justify-center z-30 px-8">
          <img
            src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&h=400&fit=crop"
            alt="Nutrition label"
            className="w-48 h-60 object-cover rounded-xl mb-6"
          />
          <h2 className="text-white text-2xl font-bold text-center">Nutrition Label Scanner</h2>
          <p className="text-white/60 text-center mt-2">Get nutrition details from any label to track your intake accurately.</p>
          <button
            onClick={() => setShowLabelInfo(false)}
            className="mt-6 bg-white text-black font-semibold px-8 py-3 rounded-full"
          >
            Got it
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-black px-4 pb-10 pt-4">
        {/* Zoom */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex bg-white/10 rounded-full p-0.5">
            {['.5x', '1x'].map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  zoom === z ? 'bg-white/20 text-white' : 'text-white/50'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {MODES.map((m, i) => (
            <button
              key={m}
              onClick={() => {
                setMode(i);
                if (i === 2) setShowLabelInfo(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                mode === i ? 'bg-white text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              <span>{i === 0 ? '📷' : i === 1 ? '📊' : '📋'}</span>
              {m}
            </button>
          ))}
        </div>

        {/* Shutter row */}
        <div className="flex items-center justify-between px-6">
          <button
            onClick={() => setFlash(!flash)}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
          >
            <Zap className={`w-5 h-5 ${flash ? 'text-yellow-400' : 'text-white/60'}`} />
          </button>
          <button
            onClick={handleCapture}
            className="w-18 h-18 rounded-full bg-white border-4 border-white/30 flex items-center justify-center active:scale-95 transition-transform"
            style={{ width: 72, height: 72 }}
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>
          <button
            onClick={handleCapture}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ImageIcon className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );
}