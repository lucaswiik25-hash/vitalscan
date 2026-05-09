import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, HelpCircle, ImageIcon, Check, Pill, FileText, CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

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
  const [s1File, setS1File] = useState(null);
  const [s1Preview, setS1Preview] = useState(null);
  const [s2File, setS2File] = useState(null);
  const [s2Preview, setS2Preview] = useState(null);

  const handleS1File = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setS1File(file);
    setS1Preview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleS2File = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setS2File(file);
    setS2Preview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const analyseStep1 = async () => {
    if (!s1File) return;
    setIsAnalyzing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s1File });
    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a supplement and nutraceutical expert. Look at this image of the FRONT of a supplement bottle. Read ALL visible text carefully.

Return JSON with: brand (exact), product_name (exact), format ("tablet"/"capsule"/"softgel"/"powder"/"gummy"/"liquid"/"other"), primary_ingredient (main active ingredient), secondary_ingredients (array of other active ingredients visible on front), marketing_claims (array of any claims like "Third Party Tested", "Non-GMO", "Vegan", "GMP Certified"), confidence ("high"/"medium"/"low"). NEVER fail.`,
      response_json_schema: { type: 'object', properties: { brand: { type: 'string' }, product_name: { type: 'string' }, format: { type: 'string' }, primary_ingredient: { type: 'string' }, secondary_ingredients: { type: 'array', items: { type: 'string' } }, marketing_claims: { type: 'array', items: { type: 'string' } }, confidence: { type: 'string' } } },
    });
    setStep1Data({ ...r.result, image_url: file_url });
    setIsAnalyzing(false);
    setStep(2);
    setS1File(null); setS1Preview(null);
  };

  const analyseStep2 = async () => {
    if (!s2File) return;
    setIsAnalyzing(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s2File });
    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a clinical supplement expert and pharmacologist. This is the SUPPLEMENT FACTS panel on the back of: "${step1Data?.brand} ${step1Data?.product_name}" — primary ingredient: ${step1Data?.primary_ingredient}.

Read every single line of the supplement facts label. Return JSON with: serving_size, servings_per_container, estimated_duration, ingredients (array with: name, amount, dri_percent, bioavailability ("High"/"Medium"/"Low"), form_quality, flag ("None"/"Underdosed"/"Correctly Dosed"/"Overdose Risk"/"Poor Form"/"Filler")), other_ingredients_flags (array), quality_score (1-100), verdict ("YES"/"MAYBE"/"NO"), verdict_reason, best_time_to_take, food_note, absorption_tip, interactions, container_supply. NEVER fail.`,
      response_json_schema: { type: 'object', properties: { serving_size: { type: 'string' }, servings_per_container: { type: 'number' }, estimated_duration: { type: 'string' }, ingredients: { type: 'array', items: { type: 'object' } }, other_ingredients_flags: { type: 'array', items: { type: 'string' } }, quality_score: { type: 'number' }, verdict: { type: 'string' }, verdict_reason: { type: 'string' }, best_time_to_take: { type: 'string' }, food_note: { type: 'string' }, absorption_tip: { type: 'string' }, interactions: { type: 'string' }, container_supply: { type: 'string' } } },
    });
    setResult({ ...step1Data, ...r.result });
    setIsAnalyzing(false);
  };

  const reset = () => { setResult(null); setStep1Data(null); setStep(1); setS1File(null); setS1Preview(null); setS2File(null); setS2Preview(null); };

  // Results page
  if (result) {
    const vs = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.MAYBE;
    const VIcon = vs.icon;
    const scoreColor = result.quality_score >= 70 ? '#16a34a' : result.quality_score >= 40 ? '#ca8a04' : '#dc2626';
    const bioColor = (b) => b === 'High' ? '#16a34a' : b === 'Medium' ? '#ca8a04' : '#dc2626';
    const getFS = (flag) => {
      const k = (flag || '').toLowerCase();
      if (k === 'correctly dosed') return { bg: '#dcfce7', text: '#16a34a' };
      return FLAG_STYLES[k] || FLAG_STYLES.none;
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={reset} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Supplement Analysis</h1>
        </div>
        <div className="px-5 space-y-4 pb-16">
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
          <div className="grid grid-cols-3 gap-2">
            {[{ label: 'Serving Size', value: result.serving_size }, { label: 'Servings', value: result.servings_per_container }, { label: 'Supply', value: result.estimated_duration || result.container_supply || '—' }].map(({ label, value }) => (
              <div key={label} className="bg-white border border-border rounded-[20px] p-3 shadow-sm text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">How to Take</p>
            {[{ label: '⏰ Best Time', value: result.best_time_to_take }, { label: '🍽️ Food', value: result.food_note }, { label: '💡 Absorption', value: result.absorption_tip }].map(({ label, value }) => value && (
              <div key={label} className="flex items-start gap-2">
                <span className="text-xs font-semibold text-foreground w-24 shrink-0">{label}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{value}</p>
              </div>
            ))}
            {result.interactions && (
              <div className="flex items-start gap-2 p-3 rounded-xl mt-1" style={{ background: '#fef9c3' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ca8a04' }} />
                <p className="text-xs" style={{ color: '#92400e' }}>{result.interactions}</p>
              </div>
            )}
          </div>
          {result.other_ingredients_flags?.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-[20px] p-4">
              <p className="text-xs font-bold text-orange-700 mb-2">⚠️ Other Ingredients Concerns</p>
              <ul className="space-y-1">{result.other_ingredients_flags.map((f, i) => <li key={i} className="text-xs text-orange-700 flex items-start gap-1.5"><span className="mt-0.5">•</span>{f}</li>)}</ul>
            </div>
          )}
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
                      {ing.dri_percent && ing.dri_percent !== 'N/A' && <span className="text-xs text-muted-foreground">DRI: {ing.dri_percent}</span>}
                      <span className="text-[10px] font-bold" style={{ color: bioColor(ing.bioavailability) }}>{ing.bioavailability} bioavailability</span>
                    </div>
                    {ing.form_quality && <p className="text-[10px] text-muted-foreground leading-relaxed">{ing.form_quality}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Photo preview screen (step 1 or step 2)
  const activePreview = step === 1 ? s1Preview : s2Preview;
  const activeAnalyse = step === 1 ? analyseStep1 : analyseStep2;
  const activeRetake = step === 1
    ? () => { setS1File(null); setS1Preview(null); }
    : () => { setS2File(null); setS2Preview(null); };

  if (activePreview && !isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={activePreview} className="flex-1 w-full object-cover" alt="Captured" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
          <button onClick={activeRetake}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-8 h-1 rounded-full bg-white/40" />
          <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-3">
          <button onClick={activeAnalyse}
            className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" />
            Analyse
          </button>
          <button onClick={activeRetake} className="text-white/70 text-sm font-medium">
            Retake photo
          </button>
        </div>
      </div>
    );
  }

  // Camera UI
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={step === 1 ? handleS1File : handleS2File} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={step === 1 ? handleS1File : handleS2File} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 z-10">
        <button onClick={step === 1 ? () => navigate(-1) : () => { setStep(1); setStep1Data(null); setS2File(null); setS2Preview(null); }}
          className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-5 h-5 text-gray-700" />
        </button>
        <button className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {isAnalyzing ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center animate-pulse mb-4">
              <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Analyzing your supplement...</p>
          </div>
        ) : (
          <>
            {/* Two step cards */}
            <div className="flex gap-4 w-full mb-6">
              {/* Step 1 */}
              <div className="flex-1 rounded-[24px] p-5 border-2 flex flex-col items-center text-center gap-2"
                style={{
                  borderColor: step === 1 ? '#1a1a1a' : step1Data ? '#22c55e' : '#e5e7eb',
                  background: step1Data ? '#f0fdf4' : step === 1 ? '#f9f9f9' : '#f5f5f5',
                }}>
                {step1Data
                  ? <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div>
                  : <Pill className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
                }
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Step 1</p>
                <p className="text-[11px] text-gray-400 leading-snug">Photograph the front of the bottle</p>
              </div>

              {/* Dotted connector */}
              <div className="flex items-center self-center">
                <div className="flex gap-0.5">{[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />)}</div>
              </div>

              {/* Step 2 */}
              <div className="flex-1 rounded-[24px] p-5 border-2 flex flex-col items-center text-center gap-2"
                style={{
                  borderColor: step === 2 ? '#1a1a1a' : '#e5e7eb',
                  background: step === 2 ? '#f9f9f9' : '#f5f5f5',
                  opacity: step === 1 && !step1Data ? 0.5 : 1,
                }}>
                <FileText className="w-10 h-10 text-gray-700" strokeWidth={1.5} />
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Step 2</p>
                <p className="text-[11px] text-gray-400 leading-snug">Then photograph the back label</p>
              </div>
            </div>

            {/* Progress */}
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Step {step} of 2</p>
            <p className="text-center text-sm text-gray-500 px-4 leading-relaxed">
              {step === 1
                ? 'Start by photographing the front of the supplement bottle so we can identify the product.'
                : `Now photograph the back label or supplement facts panel of ${step1Data?.product_name || 'the supplement'}.`
              }
            </p>


          </>
        )}
      </div>

      {/* Bottom */}
      {!isAnalyzing && (
        <div className="pb-10 px-8">
          <div className="flex items-center justify-between px-4">
            <div className="w-11" />
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-20 h-20 rounded-full bg-gray-900 border-4 border-gray-200 active:scale-95 transition-transform shadow-lg"
            />
            <button onClick={() => uploadRef.current?.click()} className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}