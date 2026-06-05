import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, ArrowLeft } from 'lucide-react';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen.jsx';
import SupplementVerdictPage from '../components/scanner/SupplementVerdictPage.jsx';
import { useUserProfile } from '../hooks/useUserProfile';

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

  const { profile } = useUserProfile();
  const userName = profile.name || 'there';

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

Read EVERY line of the supplement facts. Return JSON with: serving_size, servings_per_container, estimated_duration, quality_score (1-100), verdict ("YES"/"MAYBE"/"NO"), verdict_reason, best_time_to_take, food_note, absorption_tip, interactions, ingredients (array: name, amount, dri_percent, bioavailability ("High"/"Medium"/"Low"), form_quality, flag ("None"/"Underdosed"/"Correctly Dosed"/"Overdose Risk"/"Poor Form"/"Filler"), body_benefit (brief positive string), body_risk (brief risk or empty)), other_ingredients_flags (array of strings).
Also return: cycle_recommendation (e.g. "Take continuously" or "8 weeks on, 4 weeks off"), stack_with (e.g. "Stack with Vitamin D3 and Magnesium for best effect"), results_timeline (e.g. "2-4 weeks for initial effects, 8-12 weeks for full benefit"). NEVER fail.`,
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
          cycle_recommendation: { type: 'string' }, stack_with: { type: 'string' },
          results_timeline: { type: 'string' },
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
    return (
      <SupplementVerdictPage
        result={result}
        onBack={() => { reset(); navigate('/scanner'); }}
      />
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