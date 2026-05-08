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
      prompt: `You are a supplement and nutraceutical expert. Look at this image of the FRONT of a supplement bottle. Read ALL visible text carefully.

Return:
- brand: brand name exactly as shown
- product_name: full product name exactly as shown
- format: one of "tablet", "capsule", "softgel", "powder", "gummy", "liquid", "other"
- primary_ingredient: main active ingredient e.g. "Vitamin D3", "Creatine Monohydrate", "Omega-3"
- secondary_ingredients: array of other active ingredients visible on front
- marketing_claims: array of any claims visible e.g. "Third Party Tested", "Non-GMO", "Vegan", "GMP Certified"
- confidence: "high" (clear readable label), "medium", or "low"

NEVER fail. Always estimate from visual cues if text is not fully clear.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string' },
          product_name: { type: 'string' },
          format: { type: 'string' },
          primary_ingredient: { type: 'string' },
          secondary_ingredients: { type: 'array', items: { type: 'string' } },
          marketing_claims: { type: 'array', items: { type: 'string' } },
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
      prompt: `You are a clinical supplement expert and pharmacologist. This is the SUPPLEMENT FACTS panel on the back of: "${step1Data?.brand} ${step1Data?.product_name}" — primary ingredient: ${step1Data?.primary_ingredient}.

Read every single line of the supplement facts label. Return:

- serving_size: e.g. "2 capsules"
- servings_per_container: number
- estimated_duration: e.g. "30 days" based on servings_per_container and typical daily use
- ingredients: array for EVERY ingredient listed — for each:
  - name: exact ingredient name from label
  - amount: amount per serving with unit e.g. "500mg", "5000 IU"
  - dri_percent: % Daily Value if listed, else "N/A"
  - bioavailability: "High", "Medium", or "Low" — based on specific form (e.g. D3 > D2, glycinate > oxide, methylfolate > folic acid)
  - form_quality: one sentence assessing the specific form quality e.g. "Magnesium glycinate is a superior, highly bioavailable form"
  - flag: "None", "Underdosed", "Correctly Dosed", "Overdose Risk", "Poor Form", or "Filler"
- other_ingredients_flags: array of any concerning other ingredients — fillers, artificial colors, titanium dioxide, excess magnesium stearate, artificial sweeteners
- quality_score: 1-100 overall quality assessment
- verdict: "YES", "MAYBE", or "NO" — worth buying
- verdict_reason: 2-3 sentences covering dose vs DRI, ingredient forms, fillers, and value
- best_time_to_take: specific time e.g. "Morning with breakfast", "Before bed on empty stomach"
- food_note: "With food" or "Without food" and why — one sentence
- absorption_tip: one sentence on how to maximize absorption
- interactions: any warnings or interactions e.g. "Do not combine with blood thinners" — null if none
- container_supply: e.g. "30-day supply" estimated from servings

NEVER fail. Always estimate from visual cues and supplement knowledge if label is partially unclear.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          serving_size: { type: 'string' },
          servings_per_container: { type: 'number' },
          estimated_duration: { type: 'string' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                dri_percent: { type: 'string' },
                bioavailability: { type: 'string' },
                form_quality: { type: 'string' },
                flag: { type: 'string' },
              },
            },
          },
          other_ingredients_flags: { type: 'array', items: { type: 'string' } },
          quality_score: { type: 'number' },
          verdict: { type: 'string' },
          verdict_reason: { type: 'string' },
          best_time_to_take: { type: 'string' },
          food_note: { type: 'string' },
          absorption_tip: { type: 'string' },
          interactions: { type: 'string' },
          container_supply: { type: 'string' },
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
    const bioColor = (b) => b === 'High' ? '#16a34a' : b === 'Medium' ? '#ca8a04' : '#dc2626';
    const flagKey = (f) => (f || '').toLowerCase().replace(' ', '_');
    const getFS = (flag) => {
      const k = (flag || '').toLowerCase();
      if (k === 'none') return FLAG_STYLES.none;
      if (k === 'underdosed') return FLAG_STYLES.underdosed;
      if (k === 'overdose risk') return FLAG_STYLES['overdose risk'];
      if (k === 'poor form') return FLAG_STYLES['poor form'];
      if (k === 'filler') return FLAG_STYLES.filler;
      if (k === 'correctly dosed') return { bg: '#dcfce7', text: '#16a34a' };
      return FLAG_STYLES.none;
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={reset} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Supplement Analysis</h1>
        </div>
        <div className="px-5 space-y-4 pb-16">

          {/* Header card */}
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{result.brand}</p>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{result.product_name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{result.format} · {result.primary_ingredient}</p>
                {result.marketing_claims?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.marketing_claims.map(c => (
                      <span key={c} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs text-muted-foreground">Quality</p>
                <p className="text-3xl font-extrabold" style={{ color: scoreColor }}>{result.quality_score}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: vs.bg, color: vs.text }}>
              <VIcon className="w-4 h-4" /> Worth buying: {result.verdict}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{result.verdict_reason}</p>
          </div>

          {/* Serving info */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Serving Size', value: result.serving_size },
              { label: 'Servings', value: result.servings_per_container },
              { label: 'Supply', value: result.estimated_duration || result.container_supply || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-border rounded-[20px] p-3 shadow-sm text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* How to take */}
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">How to Take</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: '⏰ Best Time', value: result.best_time_to_take },
                { label: '🍽️ Food', value: result.food_note },
                { label: '💡 Absorption', value: result.absorption_tip },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-foreground w-24 shrink-0">{label}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
            {result.interactions && (
              <div className="flex items-start gap-2 p-3 rounded-xl mt-1" style={{ background: '#fef9c3' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ca8a04' }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: '#92400e' }}>Interactions & Warnings</p>
                  <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>{result.interactions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Other ingredients flags */}
          {result.other_ingredients_flags?.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-[20px] p-4">
              <p className="text-xs font-bold text-orange-700 mb-2">⚠️ Other Ingredients Concerns</p>
              <ul className="space-y-1">
                {result.other_ingredients_flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-orange-700">
                    <span className="mt-0.5">•</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ingredients */}
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Supplement Facts</h3>
            <div className="space-y-3">
              {(result.ingredients || []).map((ing, i) => {
                const fs = getFS(ing.flag);
                return (
                  <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-foreground">{ing.name}</p>
                      {ing.flag && ing.flag.toLowerCase() !== 'none' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: fs.bg, color: fs.text }}>{ing.flag}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">{ing.amount}</span>
                      {ing.dri_percent && ing.dri_percent !== 'N/A' && (
                        <span className="text-xs text-muted-foreground">DRI: {ing.dri_percent}</span>
                      )}
                      <span className="text-[10px] font-bold" style={{ color: bioColor(ing.bioavailability) }}>{ing.bioavailability} bioavailability</span>
                    </div>
                    {ing.form_quality && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{ing.form_quality}</p>
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