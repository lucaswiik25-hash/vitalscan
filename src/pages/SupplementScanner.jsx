import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, ImageIcon, ArrowLeft, CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

const FLAG_STYLES = {
  none: { bg: '#f0fdf4', text: '#16a34a' },
  underdosed: { bg: '#fef9c3', text: '#ca8a04' },
  'overdose risk': { bg: '#fee2e2', text: '#dc2626' },
  'poor form': { bg: '#fce7f3', text: '#be185d' },
  filler: { bg: '#f3f4f6', text: '#6b7280' },
};

const VERDICT_STYLES = {
  YES: { bg: '#dcfce7', text: '#16a34a', icon: CheckCircle },
  MAYBE: { bg: '#fef9c3', text: '#ca8a04', icon: AlertTriangle },
  NO: { bg: '#fee2e2', text: '#dc2626', icon: XCircle },
};

export default function SupplementScanner() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Step 1 state
  const [s1File, setS1File] = useState(null);
  const [s1Preview, setS1Preview] = useState(null);
  // Step 2 state
  const [s2File, setS2File] = useState(null);
  const [s2Preview, setS2Preview] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { cameraRef.current?.click(); }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleS1File = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setS1File(file);
    setS1Preview(URL.createObjectURL(file));
  };

  const analyseStep1 = async () => {
    if (!s1File) return;
    setIsAnalyzing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s1File });
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a supplement expert. Look at this image of the FRONT of a supplement bottle. Read all visible text.

Return JSON:
- brand: brand name
- product_name: product name
- format: one of "tablet", "capsule", "powder", "gummy", "other"
- primary_ingredient: main active ingredient
- confidence: "high", "medium", or "low"

NEVER fail. Always estimate if unclear.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          product_name: { type: 'string' },
          format: { type: 'string' },
          primary_ingredient: { type: 'string' },
          confidence: { type: 'string' },
        },
      },
    });
    setStep1Data({ ...res, image_url: file_url });
    setIsAnalyzing(false);
    setStep(2);
    setS1File(null); setS1Preview(null);
    setTimeout(() => { cameraRef.current?.click(); }, 200);
  };

  const handleS2File = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setS2File(file);
    setS2Preview(URL.createObjectURL(file));
  };

  const analyseStep2 = async () => {
    if (!s2File) return;
    setIsAnalyzing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s2File });
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a supplement expert. This is the BACK / ingredient panel of: "${step1Data?.brand} ${step1Data?.product_name}" (primary: ${step1Data?.primary_ingredient}).

Read the supplement facts label and return JSON with:
- serving_size: string
- servings_per_container: number
- ingredients: array each with: name, amount, dri_percent, bioavailability ("High"/"Medium"/"Low"), form_note, flag ("none"/"underdosed"/"overdose risk"/"poor form"/"filler")
- quality_score: 1-100
- verdict: "YES", "MAYBE", or "NO"
- verdict_reason: 2 sentences
- best_time_to_take: string
- absorption_tip: string
- warning: string or null

NEVER fail. Always estimate if image is unclear.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          serving_size: { type: 'string' },
          servings_per_container: { type: 'number' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                dri_percent: { type: 'string' },
                bioavailability: { type: 'string' },
                form_note: { type: 'string' },
                flag: { type: 'string' },
              },
            },
          },
          quality_score: { type: 'number' },
          verdict: { type: 'string' },
          verdict_reason: { type: 'string' },
          best_time_to_take: { type: 'string' },
          absorption_tip: { type: 'string' },
          warning: { type: 'string' },
        },
      },
    });
    setResult({ ...step1Data, ...res });
    setIsAnalyzing(false);
  };

  const reset = () => { setResult(null); setStep1Data(null); setStep(1); setS1File(null); setS1Preview(null); setS2File(null); setS2Preview(null); };

  // Results
  if (result) {
    const vs = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.MAYBE;
    const VIcon = vs.icon;
    const scoreColor = result.quality_score >= 70 ? '#16a34a' : result.quality_score >= 40 ? '#ca8a04' : '#dc2626';
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={reset} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Supplement Analysis</h1>
        </div>
        <div className="px-5 space-y-4 pb-16">
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{result.brand}</p>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{result.product_name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{result.format} · {result.primary_ingredient}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Quality</p>
                <p className="text-3xl font-extrabold" style={{ color: scoreColor }}>{result.quality_score}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: vs.bg, color: vs.text }}>
              <VIcon className="w-4 h-4" /> Worth buying: {result.verdict}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{result.verdict_reason}</p>
          </div>
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Best Time to Take</p>
              <p className="text-sm text-foreground mt-0.5">{result.best_time_to_take}</p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Absorption Tip</p>
              <p className="text-sm text-foreground mt-0.5">{result.absorption_tip}</p>
            </div>
            {result.warning && (
              <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#fef9c3' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ca8a04' }} />
                <p className="text-xs" style={{ color: '#92400e' }}>{result.warning}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
              <p className="text-xs text-muted-foreground">Serving Size</p>
              <p className="text-base font-bold text-foreground mt-0.5">{result.serving_size}</p>
            </div>
            <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
              <p className="text-xs text-muted-foreground">Servings</p>
              <p className="text-base font-bold text-foreground mt-0.5">{result.servings_per_container}</p>
            </div>
          </div>
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Ingredients</h3>
            <div className="space-y-3">
              {(result.ingredients || []).map((ing, i) => {
                const fs = FLAG_STYLES[ing.flag] || FLAG_STYLES.none;
                const bioColor = ing.bioavailability === 'High' ? '#16a34a' : ing.bioavailability === 'Medium' ? '#ca8a04' : '#dc2626';
                return (
                  <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{ing.name}</p>
                      {ing.flag && ing.flag !== 'none' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: fs.bg, color: fs.text }}>{ing.flag}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{ing.amount}</span>
                      <span className="text-xs text-muted-foreground">DRI: {ing.dri_percent}</span>
                      <span className="text-xs font-semibold" style={{ color: bioColor }}>{ing.bioavailability} bioavailability</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{ing.form_note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Camera UI helper
  const CameraUI = ({ preview, onShutter, onUpload, onAnalyse, onRetake, stepLabel, hint, analyseLabel, analyzing, analysingText }) => (
    <div className="min-h-screen bg-black flex flex-col">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={step === 1 ? handleS1File : handleS2File} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={step === 1 ? handleS1File : handleS2File} />
      <div className="flex-1 relative">
        {preview
          ? <img src={preview} className="w-full h-full object-cover absolute inset-0" alt="" />
          : <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 absolute inset-0" />}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
          <button onClick={step === 1 ? () => navigate(-1) : () => { setStep(1); setStep1Data(null); setS2File(null); setS2Preview(null); }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
            {step === 1 ? <X className="w-5 h-5 text-white" /> : <ArrowLeft className="w-5 h-5 text-white" />}
          </button>
          <span className="text-white font-semibold">{stepLabel}</span>
          <div className="w-10" />
        </div>
        {!preview && !analyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-[60%] aspect-[2/3] relative">
              {['top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl', 'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl', 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl', 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl'].map((cls, i) => (
                <div key={i} className={`absolute w-10 h-10 border-white ${cls}`} />
              ))}
            </div>
            <p className="text-white/60 text-xs mt-6">{hint}</p>
          </div>
        )}
        {preview && !analyzing && (
          <div className="absolute bottom-4 left-0 right-0 px-6 flex flex-col gap-3 z-10">
            <button onClick={onAnalyse} className="w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.95)', color: '#1a1a1a' }}>
              <Sparkles className="w-5 h-5" /> {analyseLabel}
            </button>
            <button onClick={onRetake} className="text-white/60 text-sm text-center">Retake</button>
          </div>
        )}
        {analyzing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
            <p className="text-white font-semibold text-lg">{analysingText}</p>
          </div>
        )}
      </div>
      {!preview && (
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

  if (step === 1) {
    return <CameraUI
      preview={s1Preview}
      onAnalyse={analyseStep1}
      onRetake={() => { setS1File(null); setS1Preview(null); cameraRef.current?.click(); }}
      stepLabel="Step 1 of 2"
      hint="Photograph the FRONT of the supplement bottle"
      analyseLabel="Identify Supplement"
      analyzing={isAnalyzing}
      analysingText="Reading front label..."
    />;
  }

  return <CameraUI
    preview={s2Preview}
    onAnalyse={analyseStep2}
    onRetake={() => { setS2File(null); setS2Preview(null); cameraRef.current?.click(); }}
    stepLabel="Step 2 of 2"
    hint="Photograph the supplement FACTS panel on the back"
    analyseLabel="Analyse Ingredients"
    analyzing={isAnalyzing}
    analysingText="Analysing ingredient panel..."
  />;
}