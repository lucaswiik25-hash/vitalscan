import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, ArrowLeft, ShoppingBag, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';

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
        setDisplayed(prev => { const next = [...prev]; next[lineIdx] = line.slice(0, charIdx + 1); return next; });
        setCharIdx(c => c + 1);
      }, speed);
    } else {
      timeoutRef.current = setTimeout(() => { setLineIdx(l => l + 1); setCharIdx(0); }, 220);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [lineIdx, charIdx, speed]);
  return displayed;
}

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
      result_data: combined,
    }).catch(() => {});
    setIsAnalyzing(false);
  };

  // Handle replay from scan history
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('replay') === '1') {
      const stored = sessionStorage.getItem('replayScan');
      if (stored) {
        try {
          const { scan } = JSON.parse(stored);
          if (scan?.result_data) setResult(scan.result_data);
          else if (scan) setResult({ ...scan, product_name: scan.product_name, brand: scan.brand, safety_score: scan.safety_score, verdict: scan.verdict, image_url: scan.image_url });
        } catch (_) {}
        sessionStorage.removeItem('replayScan');
      }
    }
  }, []);

  const reset = () => {
    setResult(null); setStep1Data(null); setStep(1);
    setS1File(null); setS1Preview(null); setS2File(null); setS2Preview(null);
  };

  if (isAnalyzing) return <AnalyzingScreen type="skincare" message={analyzingMsg} />;

  // ─── Results page ───────────────────────────────────────────────────────────
  if (result) {
    const scoreNum = result.safety_score || 0;
    const scoreColor = scoreNum >= 70 ? '#16a34a' : scoreNum >= 40 ? '#ca8a04' : '#dc2626';
    const verdictLabel = result.verdict === 'recommended' ? 'Recommended'
      : result.verdict === 'use with caution' ? 'Not Recommended'
      : 'Avoid';
    const VIcon = result.verdict === 'recommended' ? CheckCircle : result.verdict === 'use with caution' ? AlertTriangle : XCircle;

    const safeCount = (result.ingredients || []).filter(i => (i.safety_rating || '').toLowerCase() === 'safe').length;
    const cautionCount = (result.ingredients || []).filter(i => (i.safety_rating || '').toLowerCase() === 'caution').length;
    const avoidCount = (result.ingredients || []).filter(i => (i.safety_rating || '').toLowerCase() === 'avoid').length;

    return (
      <div className="min-h-screen pb-10">
        {/* Header */}
        <div className="px-5 pt-12 pb-3 flex items-center justify-between">
          <button onClick={() => { reset(); navigate('/scanner'); }} className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Scanner
          </button>
        </div>

        {/* Title */}
        <div className="px-5 mb-4">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">AI ANALYSIS</p>
          <h1 className="text-2xl font-black text-gray-900">Skincare Analyzer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Two-step analysis of any cosmetic product</p>
          {/* Progress dots */}
          <div className="flex gap-1.5 mt-3">
            <div className="h-1.5 flex-1 rounded-full bg-green-400" />
            <div className="h-1.5 flex-1 rounded-full bg-green-400" />
            <div className="h-1.5 flex-1 rounded-full bg-green-400" />
          </div>
        </div>

        <div className="px-4 space-y-3">
          {/* Main verdict card */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Safety Score</p>
                <p className="text-5xl font-black leading-none" style={{ color: scoreColor }}>{scoreNum}</p>
                <p className="text-xs text-gray-400 mt-0.5">out of 100</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">{result.brand}</p>
                <p className="text-xs text-gray-500">{result.product_name}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <VIcon className="w-3.5 h-3.5" style={{ color: scoreColor }} />
                  <span className="text-xs font-bold" style={{ color: scoreColor }}>{verdictLabel}</span>
                </div>
              </div>
            </div>
            {result.verdict_reason && (
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">{result.verdict_reason}</p>
            )}
          </div>

          {/* Ingredient count pills */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[16px] p-3 text-center" style={{ background: '#f0fdf4' }}>
              <p className="text-2xl font-black text-green-600">{safeCount}</p>
              <p className="text-xs text-green-600 font-medium mt-0.5">Safe</p>
            </div>
            <div className="rounded-[16px] p-3 text-center" style={{ background: '#fefce8' }}>
              <p className="text-2xl font-black text-yellow-600">{cautionCount}</p>
              <p className="text-xs text-yellow-600 font-medium mt-0.5">Caution</p>
            </div>
            <div className="rounded-[16px] p-3 text-center" style={{ background: '#fef2f2' }}>
              <p className="text-2xl font-black text-red-500">{avoidCount}</p>
              <p className="text-xs text-red-500 font-medium mt-0.5">Avoid</p>
            </div>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Skin Type', value: result.skin_type_suitability || '—' },
              { label: 'Eye Safe', value: result.eye_area_safe ? 'Yes' : 'No', color: result.eye_area_safe ? '#16a34a' : '#dc2626' },
              { label: 'Pregnancy', value: result.pregnancy_safe ? 'Safe' : 'Check', color: result.pregnancy_safe ? '#16a34a' : '#ca8a04' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-[16px] p-3 text-center shadow-sm">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: color || '#1a1a1a' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Long term effects — bullet points */}
          {result.long_term_summary && (
            <div className="bg-white rounded-[20px] p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-800 mb-2">Long-Term Effects</p>
              {result.long_term_summary.split(/[.\n]+/).filter(s => s.trim().length > 4).map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span className="text-gray-300 mt-0.5 shrink-0">•</span>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.trim()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top beneficial */}
          {result.top_beneficial?.length > 0 && (
            <div className="bg-white rounded-[20px] p-4 shadow-sm">
              <p className="text-sm font-bold text-green-700 mb-2">✅ Top Beneficial Ingredients</p>
              {result.top_beneficial.map((b, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span className="text-green-400 shrink-0">•</span>
                  <p className="text-xs text-gray-600">{b}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top concerning */}
          {result.top_concerning?.length > 0 && (
            <div className="bg-white rounded-[20px] p-4 shadow-sm">
              <p className="text-sm font-bold text-red-600 mb-2">⚠️ Top Concerns</p>
              {result.top_concerning.map((c, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span className="text-red-400 shrink-0">•</span>
                  <p className="text-xs text-gray-600">{c}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ingredient breakdown — grouped by rating */}
          {['Avoid', 'Caution', 'Safe'].map(rating => {
            const group = (result.ingredients || []).filter(ing => (ing.safety_rating || '') === rating);
            if (!group.length) return null;
            const sc = safetyColor(rating);
            const bgMap = { Avoid: '#fef2f2', Caution: '#fefce8', Safe: '#f9fafb' };
            return (
              <div key={rating} className="bg-white rounded-[20px] p-4 shadow-sm">
                <p className="text-sm font-bold mb-3" style={{ color: sc.text }}>{rating} Ingredients ({group.length})</p>
                <div className="space-y-1.5">
                  {group.map((ing, i) => {
                    const flags = [
                      ing.is_irritant && 'Irritant',
                      ing.is_allergen && 'Allergen',
                      ing.is_comedogenic && 'Comedogenic',
                      ing.is_hormone_disruptor && 'Hormone Disruptor',
                      ing.has_fragrance && 'Fragrance',
                    ].filter(Boolean);
                    return (
                      <div key={i} className="rounded-[12px] px-3 py-2.5" style={{ background: bgMap[rating] }}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                          {flags.length > 0 && (
                            <div className="flex gap-1 shrink-0">
                              {flags.slice(0, 2).map(f => (
                                <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/70" style={{ color: sc.text }}>{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {ing.skin_effect && <p className="text-[11px] text-gray-500 mt-0.5">• {ing.skin_effect}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Analyse another */}
          <button onClick={() => { reset(); navigate('/scanner'); }} className="w-full py-4 rounded-[20px] bg-white shadow-sm text-sm font-semibold text-gray-700 text-center">
            Analyse Another Product
          </button>
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
      <div className="min-h-screen px-6 pt-14 pb-20">
        <input ref={cam2Ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleS2File} />
        <input ref={up2Ref} type="file" accept="image/*" className="hidden" onChange={handleS2File} />
        <button onClick={() => { setStep(1); setStep1Data(null); }} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <div className="space-y-6">
          <p className="text-3xl font-bold text-gray-900 leading-snug">Almost there.</p>
          <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
            Now{' '}
            <ScanButton label="Photograph Ingredients" onClick={() => cam2Ref.current?.click()} />{' '}
            label on the back of <span className="font-bold">{step1Data.product_name || 'your product'}</span>.
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
  return <SkincareLanding userName={userName} cam1Ref={cam1Ref} up1Ref={up1Ref} onS1File={handleS1File} onBack={() => navigate(-1)} />;
}

function SkincareLanding({ userName, cam1Ref, up1Ref, onS1File, onBack }) {
  const lines = [
    `Hi ${userName}.`,
    `Here you can [Scan Product] by photographing the front of the product.`,
    `We'll then check every ingredient for [Safety & Concerns] including irritants, allergens, and hormone disruptors.`,
    `Or [Upload from Gallery] if you already have a photo.`,
  ];
  const displayed = useTypingEffect(lines, 26);

  const renderLine = (text, idx) => {
    if (!text) return null;
    if (idx === 0) return <p key={idx} className="text-3xl font-bold text-gray-900 leading-snug">{text}</p>;
    const actions = {
      '[Scan Product]': { label: 'Scan Product', onClick: () => cam1Ref.current?.click() },
      '[Safety & Concerns]': { label: 'Safety & Concerns', onClick: () => cam1Ref.current?.click() },
      '[Upload from Gallery]': { label: 'Upload from Gallery', onClick: () => up1Ref.current?.click() },
    };
    const parts = [];
    let remaining = text;
    Object.entries(actions).forEach(([token, { label, onClick }]) => {
      const ti = remaining.indexOf(token);
      if (ti !== -1) {
        if (ti > 0) parts.push(<span key={`pre-${token}`}>{remaining.slice(0, ti)}</span>);
        parts.push(<button key={token} onClick={onClick} className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-900 text-white text-lg font-bold active:scale-95 transition-transform mx-1" style={{ verticalAlign: 'middle' }}>{label}</button>);
        remaining = remaining.slice(ti + token.length);
      }
    });
    if (remaining) parts.push(<span key="tail">{remaining}</span>);
    return <p key={idx} className="text-2xl font-semibold text-gray-900 leading-relaxed">{parts}</p>;
  };

  return (
    <div className="min-h-screen px-6 pt-14 pb-20">
      <input ref={cam1Ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={onS1File} />
      <input ref={up1Ref} type="file" accept="image/*" className="hidden" onChange={onS1File} />
      <button onClick={onBack} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-900" />
      </button>
      <div className="space-y-6">
        {lines.map((_, idx) => renderLine(displayed[idx] || '', idx))}
      </div>
    </div>
  );
}