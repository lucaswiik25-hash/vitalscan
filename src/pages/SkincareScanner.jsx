import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, ArrowLeft, ShoppingBag, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';

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

const safetyColor = (r) => {
  const v = (r || '').toLowerCase();
  if (v === 'safe') return { bg: '#dcfce7', text: '#16a34a' };
  if (v === 'caution') return { bg: '#fef9c3', text: '#ca8a04' };
  return { bg: '#fee2e2', text: '#dc2626' };
};

export default function SkincareScanner() {
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
    setAnalyzingMsg('Identifying product...');
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s1File });
    const rraw = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a cosmetic dermatologist. Look at this FRONT image of a skincare/cosmetic product. Read ALL visible text.
Return JSON with: brand (exact), product_name (exact), product_type (e.g. "moisturiser", "serum", "cleanser", "sunscreen"), marketing_claims (array), confidence ("high"/"medium"/"low"). NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          brand: { type: 'string' }, product_name: { type: 'string' },
          product_type: { type: 'string' }, marketing_claims: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'string' },
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
    setAnalyzingMsg('Reading ingredients & analysing safety...');
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s2File });
    const rraw = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a cosmetic dermatologist and ingredient toxicologist. This is the INGREDIENT LIST of "${step1Data?.brand} ${step1Data?.product_name}" (${step1Data?.product_type}).

Read EVERY ingredient visible. Return JSON with: safety_score (1-100), verdict ("recommended"/"use with caution"/"avoid"), verdict_reason, skin_type_suitability, eye_area_safe (boolean), pregnancy_safe (boolean), pregnancy_note, long_term_summary, top_beneficial (array 3 strings), top_concerning (array 3 strings), ingredients (array: name, inci_name, skin_effect, body_benefit (brief positive benefit string), body_risk (brief risk string or empty), safety_rating ("Safe"/"Caution"/"Avoid"), is_irritant, is_allergen, is_comedogenic, comedogenic_rating 0-5, is_hormone_disruptor, has_fragrance, is_active_beneficial). NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          safety_score: { type: 'number' }, verdict: { type: 'string' }, verdict_reason: { type: 'string' },
          skin_type_suitability: { type: 'string' }, eye_area_safe: { type: 'boolean' }, pregnancy_safe: { type: 'boolean' },
          pregnancy_note: { type: 'string' }, long_term_summary: { type: 'string' },
          top_beneficial: { type: 'array', items: { type: 'string' } },
          top_concerning: { type: 'array', items: { type: 'string' } },
          ingredients: { type: 'array', items: { type: 'object' } },
        },
      },
    });
    const res = rraw.data?.result || rraw.data || {};
    const combined = { ...step1Data, ...res, label_image_url: file_url };
    setResult(combined);
    base44.entities.ScanResult.create({
      type: 'skincare',
      date: new Date().toISOString().split('T')[0],
      image_url: step1Data?.image_url || null,
      product_name: combined.product_name,
      brand: combined.brand || null,
      safety_score: combined.safety_score || null,
      verdict: combined.verdict || null,
    }).catch(() => {});
    setIsAnalyzing(false);
  };

  const reset = () => {
    setResult(null); setStep1Data(null); setStep(1);
    setS1File(null); setS1Preview(null); setS2File(null); setS2Preview(null);
  };

  if (isAnalyzing) return <AnalyzingScreen type="skincare" message={analyzingMsg} />;

  // ─── Results page ───────────────────────────────────────────────────────────
  if (result) {
    const sc = result.safety_score >= 70 ? '#16a34a' : result.safety_score >= 40 ? '#ca8a04' : '#dc2626';
    const verdictStyle = result.verdict === 'recommended'
      ? { bg: '#dcfce7', color: '#16a34a', label: 'Recommended', VIcon: CheckCircle }
      : result.verdict === 'use with caution'
        ? { bg: '#fef9c3', color: '#ca8a04', label: 'Use With Caution', VIcon: AlertTriangle }
        : { bg: '#fee2e2', color: '#dc2626', label: 'Avoid', VIcon: XCircle };
    const { VIcon } = verdictStyle;

    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col overflow-hidden" style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Hero image */}
        <div className="shrink-0 mx-4 mt-12 mb-0 relative bg-white rounded-[20px] overflow-hidden"
          style={{ height: 210, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          {result.image_url
            ? <img src={result.image_url} alt={result.product_name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <ShoppingBag className="w-16 h-16 text-gray-300" />
              </div>
          }
          <button onClick={reset}
            className="absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)' }}>
            <ArrowLeft style={{ width: 16, height: 16, color: 'white', strokeWidth: 2.5 }} />
          </button>
        </div>

        {/* Product name + verdict */}
        <div className="shrink-0 px-5 pt-4 pb-2">
          <h1 className="text-[28px] font-black text-gray-900 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            {result.product_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{result.brand} · {result.product_type}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{ background: verdictStyle.bg, color: verdictStyle.color }}>
              <VIcon className="w-4 h-4" />{verdictStyle.label}
            </div>
            <span className="text-2xl font-black" style={{ color: sc }}>{result.safety_score}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{result.verdict_reason}</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Skin Type', value: result.skin_type_suitability || '—' },
              { label: 'Eye Safe', value: result.eye_area_safe ? 'Yes' : 'No', color: result.eye_area_safe ? '#16a34a' : '#dc2626' },
              { label: 'Pregnancy', value: result.pregnancy_safe ? 'Safe' : 'Check', color: result.pregnancy_safe ? '#16a34a' : '#ca8a04' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-[16px] p-3 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: color || '#1a1a1a' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Beneficial / Concerning */}
          {(result.top_beneficial?.length > 0 || result.top_concerning?.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {result.top_beneficial?.length > 0 && (
                <div className="bg-green-50 rounded-[16px] p-3">
                  <p className="text-[10px] font-bold text-green-700 mb-1.5">Top Beneficial</p>
                  {result.top_beneficial.map(b => <p key={b} className="text-[10px] text-green-600 mb-0.5">• {b}</p>)}
                </div>
              )}
              {result.top_concerning?.length > 0 && (
                <div className="bg-red-50 rounded-[16px] p-3">
                  <p className="text-[10px] font-bold text-red-700 mb-1.5">Top Concerns</p>
                  {result.top_concerning.map(c => <p key={c} className="text-[10px] text-red-600 mb-0.5">• {c}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Long term */}
          {result.long_term_summary && (
            <div className="bg-white rounded-[16px] p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold text-gray-700 mb-1">Long-term Effects</p>
              <p className="text-xs text-gray-500 leading-relaxed">{result.long_term_summary}</p>
            </div>
          )}

          {/* Full ingredient list */}
          <div className="bg-white rounded-[20px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="text-xs font-bold text-gray-700 mb-3">Ingredients ({result.ingredients?.length || 0})</p>
            <div className="space-y-3">
              {(result.ingredients || []).map((ing, i) => {
                const sc = safetyColor(ing.safety_rating);
                const flags = [
                  ing.is_irritant && 'Irritant', ing.is_allergen && 'Allergen',
                  ing.is_comedogenic && `Comedogenic ${ing.comedogenic_rating > 0 ? `(${ing.comedogenic_rating}/5)` : ''}`,
                  ing.is_hormone_disruptor && 'Hormone Disruptor',
                  ing.has_fragrance && 'Fragrance',
                  ing.is_active_beneficial && 'Active Ingredient',
                ].filter(Boolean);
                return (
                  <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: sc.bg, color: sc.text }}>{ing.safety_rating}</span>
                    </div>
                    {ing.skin_effect && <p className="text-[10px] text-gray-500 leading-relaxed">{ing.skin_effect}</p>}
                    {ing.body_benefit && (
                      <p className="text-[10px] text-green-600 mt-0.5">+ {ing.body_benefit}</p>
                    )}
                    {ing.body_risk && (
                      <p className="text-[10px] text-red-500 mt-0.5">- {ing.body_risk}</p>
                    )}
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {flags.map(f => (
                          <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: f === 'Active Ingredient' ? '#dcfce7' : f.includes('Hormone') ? '#fee2e2' : '#f3f4f6',
                              color: f === 'Active Ingredient' ? '#16a34a' : f.includes('Hormone') ? '#dc2626' : '#555',
                            }}>{f}</span>
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

  // ─── Photo preview (step 1 or 2) ───────────────────────────────────────────
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

  // ─── Step 2: photograph ingredient label ───────────────────────────────────
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
            <ScanButton label="📷 photograph the ingredients" onClick={() => cam2Ref.current?.click()} />{' '}
            label on the back of <span className="font-bold">{step1Data.product_name || 'your product'}</span>.
          </p>
          <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
            Or{' '}
            <ScanButton label="🖼 upload from gallery" onClick={() => up2Ref.current?.click()} />{' '}
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
          <ScanButton label="📷 scan a product" onClick={() => cam1Ref.current?.click()} />{' '}
          by photographing the front of the product.
        </p>
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          We'll then check every ingredient for{' '}
          <ScanButton label="🧪 safety & concerns" onClick={() => cam1Ref.current?.click()} />{' '}
          including irritants, allergens, and hormone disruptors.
        </p>
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Or{' '}
          <ScanButton label="🖼 upload from gallery" onClick={() => up1Ref.current?.click()} />{' '}
          if you already have a photo.
        </p>
      </div>
    </div>
  );
}