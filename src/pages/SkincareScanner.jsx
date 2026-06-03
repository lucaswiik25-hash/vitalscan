import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';
import SkincareVerdictPage from '../components/scanner/SkincareVerdictPage';

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
    try {
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
      setStep(2);
      setS1File(null);
    } catch (err) {
      alert('Analysis failed: ' + (err?.message || 'Unknown error'));
      setS1Preview(URL.createObjectURL(s1File));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyseStep2 = async () => {
    if (!s2File) return;
    setIsAnalyzing(true);
    setS2Preview(null);
    setAnalyzingMsg('Reading ingredients...');
    try {
    const { file_url } = await base44.integrations.Core.UploadFile({ file: s2File });

    // ── Phase 1: ingredients only (fast, small payload) ──────────────────────
    const r1 = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a cosmetic ingredient toxicologist. This is the INGREDIENT LIST of "${step1Data?.brand} ${step1Data?.product_name}".
  Read EVERY ingredient visible. For each ingredient return: name, inci_name, skin_effect (one sentence), body_benefit (brief positive or empty), body_risk (brief risk or empty), safety_rating ("Safe"/"Caution"/"Avoid"), is_irritant (boolean), is_allergen (boolean), is_comedogenic (boolean), comedogenic_rating (0-5), is_hormone_disruptor (boolean), has_fragrance (boolean), is_active_beneficial (boolean). NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          ingredients: { type: 'array', items: { type: 'object' } },
        },
      },
    });
    const phase1 = r1.data?.result || r1.data || {};
    const partialResult = { ...step1Data, ingredients: phase1.ingredients || [], label_image_url: file_url, _loadingDetails: true };
    setResult(partialResult);
    setIsAnalyzing(false);

    // ── Phase 2: full safety analysis (runs in background) ───────────────────
    base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a cosmetic dermatologist. This is the INGREDIENT LIST of "${step1Data?.brand} ${step1Data?.product_name}" (${step1Data?.product_type}).
  Based on the full ingredient list, return: safety_score (1-100), verdict ("recommended"/"use with caution"/"avoid"), verdict_reason (2 sentences), skin_type_suitability (e.g. "All skin types" / "Oily skin"), eye_area_safe (boolean), pregnancy_safe (boolean), pregnancy_note, long_term_summary (2-3 sentences), top_beneficial (array of 3 ingredient name strings), top_concerning (array of 3 strings). NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          safety_score: { type: 'number' }, verdict: { type: 'string' }, verdict_reason: { type: 'string' },
          skin_type_suitability: { type: 'string' }, eye_area_safe: { type: 'boolean' }, pregnancy_safe: { type: 'boolean' },
          pregnancy_note: { type: 'string' }, long_term_summary: { type: 'string' },
          top_beneficial: { type: 'array', items: { type: 'string' } },
          top_concerning: { type: 'array', items: { type: 'string' } },
        },
      },
    }).then(r2 => {
      const phase2 = r2.data?.result || r2.data || {};
      setResult(prev => {
        const combined = { ...prev, ...phase2, _loadingDetails: false };
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
        return combined;
      });
    }).catch(() => {
      setResult(prev => ({ ...prev, _loadingDetails: false }));
    });
    } catch (err) {
      alert('Analysis failed: ' + (err?.message || 'Unknown error'));
      setS2Preview(URL.createObjectURL(s2File));
      setIsAnalyzing(false);
    }
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
    return (
      <SkincareVerdictPage
        result={result}
        onBack={() => { reset(); navigate('/scanner'); }}
      />
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