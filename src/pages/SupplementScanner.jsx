import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, ArrowLeft, Pill, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
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
          else if (scan) setResult({ ...scan, product_name: scan.product_name, brand: scan.brand, quality_score: scan.quality_score, verdict: scan.verdict, image_url: scan.image_url });
        } catch (_) {}
        sessionStorage.removeItem('replayScan');
      }
    }
  }, []);

  const reset = () => {
    setResult(null); setStep1Data(null); setStep(1);
    setS1File(null); setS1Preview(null); setS2File(null); setS2Preview(null);
  };

  if (isAnalyzing) return <AnalyzingScreen type="supplement" message={analyzingMsg} />;

  // ─── Results page ───────────────────────────────────────────────────────────
  if (result) {
    const scoreNum = result.quality_score || 0;
    const scoreColor = scoreNum >= 70 ? '#16a34a' : scoreNum >= 40 ? '#ca8a04' : '#dc2626';
    const verdictLabel = result.verdict === 'YES' ? 'Worth Buying' : result.verdict === 'MAYBE' ? 'Maybe' : 'Not Recommended';
    const VIcon = result.verdict === 'YES' ? CheckCircle : result.verdict === 'MAYBE' ? AlertTriangle : XCircle;

    const correctCount = (result.ingredients || []).filter(i => (i.flag || '').toLowerCase() === 'correctly dosed').length;
    const underdosedCount = (result.ingredients || []).filter(i => (i.flag || '').toLowerCase() === 'underdosed').length;
    const poorCount = (result.ingredients || []).filter(i => ['poor form', 'filler', 'overdose risk'].includes((i.flag || '').toLowerCase())).length;

    return (
      <div className="min-h-screen pb-10">
        {/* Header */}
        <div className="px-5 pt-12 pb-3 flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Scanner
          </button>
        </div>

        {/* Title */}
        <div className="px-5 mb-4">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">AI ANALYSIS</p>
          <h1 className="text-2xl font-black text-gray-900">Supplement Scanner</h1>
          <p className="text-sm text-gray-400 mt-0.5">Two-step quality & dosage analysis</p>
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
                <p className="text-xs text-gray-400 mb-1">Quality Score</p>
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
              <p className="text-2xl font-black text-green-600">{correctCount}</p>
              <p className="text-xs text-green-600 font-medium mt-0.5">Correctly Dosed</p>
            </div>
            <div className="rounded-[16px] p-3 text-center" style={{ background: '#fefce8' }}>
              <p className="text-2xl font-black text-yellow-600">{underdosedCount}</p>
              <p className="text-xs text-yellow-600 font-medium mt-0.5">Underdosed</p>
            </div>
            <div className="rounded-[16px] p-3 text-center" style={{ background: '#fef2f2' }}>
              <p className="text-2xl font-black text-red-500">{poorCount}</p>
              <p className="text-xs text-red-500 font-medium mt-0.5">Poor Form</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Serving', value: result.serving_size || '—' },
              { label: 'Servings', value: String(result.servings_per_container || '—') },
              { label: 'Supply', value: result.estimated_duration || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-[16px] p-3 text-center shadow-sm">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* How to take — bullet points */}
          <div className="bg-white rounded-[20px] p-4 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-2">How to Take</p>
            {[
              { emoji: '⏰', label: 'Best Time', value: result.best_time_to_take },
              { emoji: '🍽️', label: 'With Food', value: result.food_note },
              { emoji: '💊', label: 'Absorption', value: result.absorption_tip },
            ].map(({ emoji, label, value }) => value && (
              <div key={label} className="flex items-start gap-2 mb-2 last:mb-0">
                <span className="shrink-0 text-sm">{emoji}</span>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}: </span>
                  <span className="text-xs text-gray-600">{value}</span>
                </div>
              </div>
            ))}
            {result.interactions && (
              <div className="flex items-start gap-2 p-3 rounded-xl mt-2" style={{ background: '#fefce8' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-yellow-600" />
                <p className="text-xs text-yellow-800">⚠️ {result.interactions}</p>
              </div>
            )}
          </div>

          {/* Supplement facts — grouped by flag */}
          {[
            { key: 'correctly dosed', label: '✅ Correctly Dosed', bg: '#f0fdf4', textColor: '#16a34a' },
            { key: 'underdosed',      label: '⚠️ Underdosed',       bg: '#fefce8', textColor: '#ca8a04' },
            { key: 'poor form',       label: '❌ Poor Form',         bg: '#fef2f2', textColor: '#dc2626' },
            { key: 'overdose risk',   label: '🚨 Overdose Risk',     bg: '#fef2f2', textColor: '#dc2626' },
            { key: 'filler',          label: '🔘 Fillers',           bg: '#f3f4f6', textColor: '#6b7280' },
            { key: 'none',            label: '📋 Other Ingredients', bg: '#f9fafb', textColor: '#374151' },
          ].map(({ key, label, bg, textColor }) => {
            const group = (result.ingredients || []).filter(ing => (ing.flag || 'none').toLowerCase() === key);
            if (!group.length) return null;
            return (
              <div key={key} className="bg-white rounded-[20px] p-4 shadow-sm">
                <p className="text-sm font-bold mb-2" style={{ color: textColor }}>{label} ({group.length})</p>
                <div className="space-y-1.5">
                  {group.map((ing, i) => (
                    <div key={i} className="rounded-[12px] px-3 py-2.5" style={{ background: bg }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-800">{ing.name}</p>
                        {ing.amount && <p className="text-[11px] text-gray-500 shrink-0">{ing.amount}</p>}
                      </div>
                      {ing.form_quality && <p className="text-[11px] text-gray-400 mt-0.5">• {ing.form_quality}</p>}
                      {ing.body_benefit && <p className="text-[11px] text-green-600 mt-0.5">• {ing.body_benefit}</p>}
                      {ing.body_risk && <p className="text-[11px] text-red-500 mt-0.5">• {ing.body_risk}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button onClick={reset} className="w-full py-4 rounded-[20px] bg-white shadow-sm text-sm font-semibold text-gray-700 text-center">
            Analyse Another Product
          </button>
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
  return <SupplementLanding userName={userName} cam1Ref={cam1Ref} up1Ref={up1Ref} onS1File={handleS1File} onBack={() => navigate(-1)} />;
}

function SupplementLanding({ userName, cam1Ref, up1Ref, onS1File, onBack }) {
  const lines = [
    `Hi ${userName}.`,
    `Here you can [Scan Supplement] by photographing the front of the bottle.`,
    `We'll then check the [Ingredient Label] for quality, dosage, and bioavailability.`,
    `Or [Upload from Gallery] if you already have a photo.`,
  ];
  const displayed = useTypingEffect(lines, 26);

  const renderLine = (text, idx) => {
    if (!text) return null;
    if (idx === 0) return <p key={idx} className="text-3xl font-bold text-gray-900 leading-snug">{text}</p>;
    const actions = {
      '[Scan Supplement]': { label: 'Scan Supplement', onClick: () => cam1Ref.current?.click() },
      '[Ingredient Label]': { label: 'Ingredient Label', onClick: () => cam1Ref.current?.click() },
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