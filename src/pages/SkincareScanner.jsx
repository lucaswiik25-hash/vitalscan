import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, ImageIcon, ArrowLeft, Shield, XCircle, Sparkles } from 'lucide-react';

const SAFETY_COLORS = {
  safe: { bg: '#dcfce7', text: '#16a34a', label: 'Safe' },
  caution: { bg: '#fef9c3', text: '#ca8a04', label: 'Caution' },
  avoid: { bg: '#fee2e2', text: '#dc2626', label: 'Avoid' },
};

const FLAG_COLORS = {
  irritant: '#fed7aa',
  allergen: '#fecaca',
  comedogenic: '#e9d5ff',
  'hormone disruptor': '#fce7f3',
  fragrance: '#dbeafe',
  alcohol: '#f3f4f6',
};

export default function SkincareScanner() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const [step, setStep] = useState(1); // 1 = front photo, 2 = ingredients photo
  const [step1Data, setStep1Data] = useState(null); // { product_name, product_type, file_url }
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [step2File, setStep2File] = useState(null);
  const [step2Preview, setStep2Preview] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { cameraRef.current?.click(); }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStep1File = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const analyseStep1 = async () => {
    if (!capturedFile) return;
    setIsAnalyzing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cosmetic product expert. Look at this image of the FRONT of a skincare or cosmetic product. Read all visible text — brand, product name, product type.

Return JSON:
- brand: brand name
- product_name: full product name
- product_type: e.g. "Shampoo", "Moisturizer", "Hand Soap", "Serum", "Conditioner"
- confidence: "high", "medium", or "low"

NEVER fail. Estimate if unclear.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          product_name: { type: 'string' },
          product_type: { type: 'string' },
          confidence: { type: 'string' },
        },
      },
    });
    setStep1Data({ ...res, file_url });
    setIsAnalyzing(false);
    setStep(2);
    // reset for step 2
    setCapturedFile(null);
    setPreviewUrl(null);
    setTimeout(() => { cameraRef.current?.click(); }, 200);
  };

  const handleStep2File = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep2File(file);
    setStep2Preview(URL.createObjectURL(file));
  };

  const analyseStep2 = async () => {
    if (!step2File) return;
    setIsAnalyzing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: step2File });

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a cosmetic ingredient safety expert. This is the ingredient list of: "${step1Data?.brand} ${step1Data?.product_name}" (${step1Data?.product_type}). 
      
IMPORTANT: This is a ${step1Data?.product_type}. Evaluate ingredients appropriately — for example, sulfates in shampoo vs hand soap have different risk profiles. Read every single ingredient visible on the label.

Return JSON:
- safety_score: 1-100 (100 = perfectly safe)
- ingredients: array with: name, function (1 sentence for this product type), safety_rating ("safe"/"caution"/"avoid"), flags (array from: ["irritant","allergen","comedogenic","hormone disruptor","fragrance","alcohol"])
- long_term_summary: 2-3 sentences about long-term effects for skin/hair for THIS product type
- verdict: "recommended" or "not recommended"
- verdict_reason: one sentence

NEVER fail.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          safety_score: { type: 'number' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                function: { type: 'string' },
                safety_rating: { type: 'string' },
                flags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          long_term_summary: { type: 'string' },
          verdict: { type: 'string' },
          verdict_reason: { type: 'string' },
        },
      },
    });

    setResult({ ...step1Data, ...res });
    setIsAnalyzing(false);
  };

  // Results
  if (result) {
    const sc = result.safety_score >= 70 ? '#16a34a' : result.safety_score >= 40 ? '#ca8a04' : '#dc2626';
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={() => { setResult(null); setStep(1); setStep1Data(null); setStep2File(null); setStep2Preview(null); setCapturedFile(null); setPreviewUrl(null); }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Skincare Analysis</h1>
        </div>
        <div className="px-5 space-y-4 pb-16">
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{result.brand} · {result.product_type}</p>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{result.product_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Safety Score</p>
                <p className="text-3xl font-extrabold" style={{ color: sc }}>{result.safety_score}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: result.verdict === 'recommended' ? '#dcfce7' : '#fee2e2', color: result.verdict === 'recommended' ? '#16a34a' : '#dc2626' }}>
              {result.verdict === 'recommended' ? <Shield className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {result.verdict === 'recommended' ? 'Recommended' : 'Not Recommended'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{result.verdict_reason}</p>
          </div>
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-2">Long-term Effects</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.long_term_summary}</p>
          </div>
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Ingredients ({result.ingredients?.length || 0})</h3>
            <div className="space-y-3">
              {(result.ingredients || []).map((ing, i) => {
                const s = SAFETY_COLORS[ing.safety_rating] || SAFETY_COLORS.safe;
                return (
                  <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{ing.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ing.function}</p>
                    {ing.flags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {ing.flags.map(f => (
                          <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: FLAG_COLORS[f] || '#f3f4f6', color: '#555' }}>{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Front photo
  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleStep1File} />
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleStep1File} />
        <div className="flex-1 relative">
          {previewUrl
            ? <img src={previewUrl} className="w-full h-full object-cover absolute inset-0" alt="" />
            : <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 absolute inset-0" />}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold">Step 1 of 2</span>
            <div className="w-10" />
          </div>
          {!previewUrl && !isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[65%] aspect-[2/3] relative">
                {['top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl'].map((cls, i) => (
                  <div key={i} className={`absolute w-10 h-10 border-white ${cls}`} />
                ))}
                <p className="absolute -bottom-8 left-0 right-0 text-center text-white/60 text-xs">Photograph the FRONT of the product</p>
              </div>
            </div>
          )}
          {previewUrl && !isAnalyzing && (
            <div className="absolute bottom-4 left-0 right-0 px-6 flex flex-col gap-3 z-10">
              <button onClick={analyseStep1} className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#1a1a1a' }}>
                <Sparkles className="w-5 h-5" /> Identify Product
              </button>
              <button onClick={() => { setPreviewUrl(null); setCapturedFile(null); cameraRef.current?.click(); }} className="text-white/60 text-sm text-center">Retake</button>
            </div>
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <p className="text-white font-semibold text-lg">Identifying product...</p>
            </div>
          )}
        </div>
        {!previewUrl && (
          <div className="bg-black px-6 pb-10 pt-4 flex items-center justify-between">
            <div className="w-11" />
            <button onClick={() => cameraRef.current?.click()} className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform" />
            <button onClick={() => uploadRef.current?.click()} className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white/60" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Ingredients photo
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleStep2File} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleStep2File} />
      <div className="flex-1 relative">
        {step2Preview
          ? <img src={step2Preview} className="w-full h-full object-cover absolute inset-0" alt="" />
          : <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900 absolute inset-0" />}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
          <button onClick={() => { setStep(1); setStep1Data(null); setStep2File(null); setStep2Preview(null); setPreviewUrl(null); setCapturedFile(null); }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-white font-semibold">Step 2 of 2</span>
            <span className="text-white/50 text-xs mt-0.5">{step1Data?.brand} {step1Data?.product_name}</span>
          </div>
          <div className="w-10" />
        </div>
        {!step2Preview && !isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[75%] aspect-[3/4] relative">
              {['top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl'].map((cls, i) => (
                <div key={i} className={`absolute w-10 h-10 border-white ${cls}`} />
              ))}
              <p className="absolute -bottom-8 left-0 right-0 text-center text-white/60 text-xs">Now photograph the INGREDIENT LIST</p>
            </div>
          </div>
        )}
        {step2Preview && !isAnalyzing && (
          <div className="absolute bottom-4 left-0 right-0 px-6 flex flex-col gap-3 z-10">
            <button onClick={analyseStep2} className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.95)', color: '#1a1a1a' }}>
              <Sparkles className="w-5 h-5" /> Analyse Ingredients
            </button>
            <button onClick={() => { setStep2Preview(null); setStep2File(null); cameraRef.current?.click(); }} className="text-white/60 text-sm text-center">Retake</button>
          </div>
        )}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <p className="text-white font-semibold text-lg">Analysing ingredients...</p>
            <p className="text-white/60 text-sm mt-1">Checking for safety of {step1Data?.product_type}</p>
          </div>
        )}
      </div>
      {!step2Preview && (
        <div className="bg-black px-6 pb-10 pt-4 flex items-center justify-between">
          <div className="w-11" />
          <button onClick={() => cameraRef.current?.click()} className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform" />
          <button onClick={() => uploadRef.current?.click()} className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white/60" />
          </button>
        </div>
      )}
    </div>
  );
}