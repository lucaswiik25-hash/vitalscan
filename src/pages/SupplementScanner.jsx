import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, ArrowLeft, Pill, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';

function ScanButton({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-900 text-white text-lg font-bold active:scale-95 transition-transform mx-1"
      style={{ verticalAlign: 'middle' }}>
      {label}
    </button>
  );
}

const flagColor = (flag) => {
  const f = (flag || '').toLowerCase();
  if (f === 'correctly dosed' || f === 'none') return { bg: '#dcfce7', text: '#16a34a' };
  if (f === 'underdosed') return { bg: '#fef9c3', text: '#ca8a04' };
  if (f === 'overdose risk') return { bg: '#fee2e2', text: '#dc2626' };
  if (f === 'poor form') return { bg: '#fce7f3', text: '#be185d' };
  if (f === 'filler') return { bg: '#f3f4f6', text: '#6b7280' };
  return { bg: '#f3f4f6', text: '#6b7280' };
};

const bioColor = (b) => b === 'High' ? '#16a34a' : b === 'Medium' ? '#ca8a04' : '#dc2626';

export default function SupplementScanner() {
  const navigate = useNavigate();
  const cam1Ref = useRef(null);
  const up1Ref = useRef(null);
  const cam2Ref = useRef(null);
  const up2Ref = useRef(null);

  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [s1File, setS1File] = useState(null);
  const [s1Preview, setS1Preview] = useState(null);
  const [s2File, setS2File] = useState(null);
  const [s2Preview, setS2Preview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingMsg, setAnalyzingMsg] = useState('');
  const [result, setResult] = useState(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const userName = profiles[0]?.name || 'there';

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
    setS1Preview(null);
    setAnalyzingMsg('Identifying your supplement...');
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s1File });
    const rraw = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a supplement and nutraceutical expert. Look at the FRONT of this supplement bottle. Read ALL visible text.
Return JSON with: brand (exact), product_name (exact), format ("tablet"/"capsule"/"softgel"/"powder"/"gummy"/"liquid"/"other"), primary_ingredient (main active), secondary_ingredients (array of strings), marketing_claims (array of strings), confidence ("high"/"medium"/"low"). NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string' }, product_name: { type: 'string' }, format: { type: 'string' },
          primary_ingredient: { type: 'string' }, secondary_ingredients: { type: 'array', items: { type: 'string' } },
          marketing_claims: { type: 'array', items: { type: 'string' } }, confidence: { type: 'string' },
        },
      },
    });
    setStep1Data({ ...(rraw.data?.result || rraw.data || {}), image_url: file_url });
    setIsAnalyzing(false);
    setStep(2);
    setS1File(null);
  };

  const analyseStep2 = async () => {
    if (!s2File) return;
    setIsAnalyzing(true);
    setS2Preview(null);
    setAnalyzingMsg('Analysing supplement facts...');
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s2File });
    const rraw = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a clinical supplement expert and pharmacologist. This is the SUPPLEMENT FACTS panel of: "${step1Data?.brand} ${step1Data?.product_name}" — primary ingredient: ${step1Data?.primary_ingredient}.

Read EVERY line of the supplement facts. Return JSON with: serving_size, servings_per_container, estimated_duration, quality_score (1-100), verdict ("YES"/"MAYBE"/"NO"), verdict_reason, best_time_to_take, food_note, absorption_tip, interactions, ingredients (array: name, amount, dri_percent, bioavailability ("High"/"Medium"/"Low"), form_quality, flag ("None"/"Underdosed"/"Correctly Dosed"/"Overdose Risk"/"Poor Form"/"Filler"), body_benefit (brief positive string), body_risk (brief risk or empty)), other_ingredients_flags (array of strings). NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          serving_size: { type: 'string' }, servings_per_container: { type: 'number' },
          estimated_duration: { type: 'string' }, quality_score: { type: 'number' },
          verdict: { type: 'string' }, verdict_reason: { type: 'string' },
          best_time_to_take: { type: 'string' }, food_note: { type: 'string' },
          absorption_tip: { type: 'string' }, interactions: { type: 'string' },
          ingredients: { type: 'array', items: { type: 'object' } },
          other_ingredients_flags: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    const combined = { ...step1Data, ...(rraw.data?.result || rraw.data || {}) };
    setResult(combined);
    base44.entities.ScanResult.create({
      type: 'supplement',
      date: new Date().toISOString().split('T')[0],
      image_url: step1Data?.image_url || null,
      product_name: combined.product_name,
      brand: combined.brand || null,
      quality_score: combined.quality_score || null,
      verdict: combined.verdict || null,
    }).catch(() => {});
    setIsAnalyzing(false);
  };

  const reset = () => {
    setResult(null); setStep1Data(null); setStep(1);
    setS1File(null); setS1Preview(null); setS2File(null); setS2Preview(null);
  };

  if (isAnalyzing) return <AnalyzingScreen type="supplement" message={analyzingMsg} />;

  // ─── Results page ───────────────────────────────────────────────────────────
  if (result) {
    const scoreColor = result.quality_score >= 70 ? '#16a34a' : result.quality_score >= 40 ? '#ca8a04' : '#dc2626';
    const verdictStyle = result.verdict === 'YES'
      ? { bg: '#dcfce7', color: '#16a34a', label: 'Worth Buying', VIcon: CheckCircle }
      : result.verdict === 'MAYBE'
        ? { bg: '#fef9c3', color: '#ca8a04', label: 'Maybe', VIcon: AlertTriangle }
        : { bg: '#fee2e2', color: '#dc2626', label: 'Not Recommended', VIcon: XCircle };
    const { VIcon } = verdictStyle;

    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Hero image */}
        <div className="shrink-0 mx-4 mt-12 mb-0 relative bg-white rounded-[20px] overflow-hidden"
          style={{ height: 210, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          {result.image_url
            ? <img src={result.image_url} alt={result.product_name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Pill className="w-16 h-16 text-gray-300" />
              </div>
          }
          <button onClick={reset}
            className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)' }}>
            <ArrowLeft style={{ width: 16, height: 16, color: 'white', strokeWidth: 2.5 }} />
          </button>
        </div>

        {/* Name + verdict */}
        <div className="shrink-0 px-5 pt-4 pb-2">
          <p className="text-xs text-gray-400">{result.brand} · {result.format}</p>
          <h1 className="text-[28px] font-black text-gray-900 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            {result.product_name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{ background: verdictStyle.bg, color: verdictStyle.color }}>
              <VIcon className="w-4 h-4" />{verdictStyle.label}
            </div>
            <span className="text-2xl font-black" style={{ color: scoreColor }}>{result.quality_score}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
          {result.verdict_reason && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{result.verdict_reason}</p>}
          {result.marketing_claims?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {result.marketing_claims.map(c => (
                <span key={c} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{c}</span>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Serving', value: result.serving_size || '—' },
              { label: 'Servings', value: result.servings_per_container || '—' },
              { label: 'Supply', value: result.estimated_duration || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-[16px] p-3 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* How to take */}
          <div className="bg-white rounded-[20px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-xs font-bold text-gray-700 mb-2">How to Take</p>
            {[
              { label: 'Best Time', value: result.best_time_to_take },
              { label: 'Food', value: result.food_note },
              { label: 'Absorption', value: result.absorption_tip },
            ].map(({ label, value }) => value && (
              <div key={label} className="flex items-start gap-2 mb-1.5 last:mb-0">
                <span className="text-xs font-semibold text-gray-500 w-20 shrink-0">{label}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{value}</p>
              </div>
            ))}
            {result.interactions && (
              <div className="flex items-start gap-2 p-3 rounded-xl mt-2" style={{ background: '#fef9c3' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-yellow-600" />
                <p className="text-xs text-yellow-800">{result.interactions}</p>
              </div>
            )}
          </div>

          {/* Other ingredient warnings */}
          {result.other_ingredients_flags?.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-[16px] p-4">
              <p className="text-xs font-bold text-orange-700 mb-2">Other Ingredients Concerns</p>
              {result.other_ingredients_flags.map((f, i) => (
                <p key={i} className="text-xs text-orange-700 flex items-start gap-1.5 mb-0.5">
                  <span className="mt-0.5">•</span>{f}
                </p>
              ))}
            </div>
          )}

          {/* Full ingredients list */}
          <div className="bg-white rounded-[20px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-xs font-bold text-gray-700 mb-3">Supplement Facts</p>
            <div className="space-y-3">
              {(result.ingredients || []).map((ing, i) => {
                const fc = flagColor(ing.flag);
                return (
                  <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                      {ing.flag && ing.flag.toLowerCase() !== 'none' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: fc.bg, color: fc.text }}>{ing.flag}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-gray-700">{ing.amount}</span>
                      {ing.dri_percent && ing.dri_percent !== 'N/A' && (
                        <span className="text-[10px] text-gray-400">DRI: {ing.dri_percent}</span>
                      )}
                      {ing.bioavailability && (
                        <span className="text-[10px] font-bold" style={{ color: bioColor(ing.bioavailability) }}>
                          {ing.bioavailability} bioavailability
                        </span>
                      )}
                    </div>
                    {ing.form_quality && <p className="text-[10px] text-gray-400 leading-relaxed">{ing.form_quality}</p>}
                    {ing.body_benefit && <p className="text-[10px] text-green-600 mt-0.5">+ {ing.body_benefit}</p>}
                    {ing.body_risk && <p className="text-[10px] text-red-500 mt-0.5">- {ing.body_risk}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Photo preview ─────────────────────────────────────────────────────────
  const activePreview = step === 1 ? s1Preview : s2Preview;
  const activeAnalyse = step === 1 ? analyseStep1 : analyseStep2;
  const activeRetake = step === 1 ? () => { setS1File(null); setS1Preview(null); } : () => { setS2File(null); setS2Preview(null); };

  if (activePreview) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={activePreview} className="flex-1 w-full object-cover" alt="Captured" />
        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-12">
          <button onClick={activeRetake} className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-3">
          <button onClick={activeAnalyse}
            className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" /> Analyse
          </button>
          <button onClick={activeRetake} className="text-white/70 text-sm font-medium">Retake photo</button>
        </div>
      </div>
    );
  }

  // ─── Step 2: photograph label ──────────────────────────────────────────────
  if (step === 2 && step1Data) {
    return (
      <div className="min-h-screen bg-white px-6 pt-14 pb-20">
        <input ref={cam2Ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleS2File} />
        <input ref={up2Ref} type="file" accept="image/*" className="hidden" onChange={handleS2File} />
        <button onClick={() => { setStep(1); setStep1Data(null); }} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <div className="space-y-6">
          <p className="text-3xl font-bold text-gray-900 leading-snug">Almost there.</p>
          <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
            Now{' '}
            <ScanButton label="Photograph Label" onClick={() => cam2Ref.current?.click()} />{' '}
            label or supplement facts panel of <span className="font-bold">{step1Data.product_name || 'your supplement'}</span>.
          </p>
          <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
            Or{' '}
            <ScanButton label="Upload from Gallery" onClick={() => up2Ref.current?.click()} />{' '}
            if you already have a photo.
          </p>
        </div>
      </div>
    );
  }

  // ─── Step 1: landing ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white px-6 pt-14 pb-20">
      <input ref={cam1Ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleS1File} />
      <input ref={up1Ref} type="file" accept="image/*" className="hidden" onChange={handleS1File} />
      <button onClick={() => navigate(-1)} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-900" />
      </button>
      <div className="space-y-6">
        <p className="text-3xl font-bold text-gray-900 leading-snug">Hi {userName}.</p>
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Here you can{' '}
          <ScanButton label="Scan Supplement" onClick={() => cam1Ref.current?.click()} />{' '}
          by photographing the front of the bottle.
        </p>
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          We'll then check the{' '}
          <ScanButton label="Ingredient Label" onClick={() => cam1Ref.current?.click()} />{' '}
          for quality, dosage, and bioavailability.
        </p>
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Or{' '}
          <ScanButton label="Upload from Gallery" onClick={() => up1Ref.current?.click()} />{' '}
          if you already have a photo.
        </p>
      </div>
    </div>
  );
}