import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';
import SkincareVerdictPage from '../components/scanner/SkincareVerdictPage';
import { parseApiResponse } from '../lib/parseApiResponse';

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
  const [s2File, setS2File] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingMsg, setAnalyzingMsg] = useState('');
  const [result, setResult] = useState(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const userName = profiles[0]?.name || 'there';

  const handleS1File = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setS1File(file);
    // Directly analyse without showing preview
    setIsAnalyzing(true);
    setAnalyzingMsg('Identifying product...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
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
      setStep1Data({ ...parseApiResponse(rraw), image_url: file_url });
      setStep(2);
    } catch (err) {
      alert('Analysis failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setS1File(null);
    }
  };

  const handleS2File = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setS2File(file);
    // Directly analyse without showing preview
    await analyseStep2WithFile(file);
  };

  const analyseStep2WithFile = async (file) => {
    setIsAnalyzing(true);
    setAnalyzingMsg('Analyzing ingredients & safety...');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const rraw = await base44.functions.invoke('analyzeWithClaude', {
        image_url: file_url,
        prompt: `You are a cosmetic dermatologist and ingredient toxicologist. Analyze the INGREDIENT LIST of "${step1Data?.brand} ${step1Data?.product_name}" (${step1Data?.product_type || 'skincare product'}).

Read EVERY ingredient visible on the label. Return a COMPLETE analysis:

INGREDIENTS: array of every ingredient with: name, inci_name, skin_effect (one sentence), body_benefit, body_risk, safety_rating ("Safe"/"Caution"/"Avoid"), is_irritant, is_allergen, is_comedogenic, comedogenic_rating (0-5), is_hormone_disruptor, has_fragrance, is_active_beneficial.

SAFETY: safety_score (1-100), verdict ("recommended"/"use with caution"/"avoid"), verdict_reason (2 sentences), skin_type_suitability, eye_area_safe, pregnancy_safe, pregnancy_note, long_term_summary, top_beneficial (3 ingredient names), top_concerning (3 strings).

USAGE: routine_step, application_method (how much and how to apply), frequency, apply_after, do_not_combine, results_timeline, routine_steps (4-5 numbered steps like "1. Cleanse: Start with a clean face").

NEVER fail. Always return at least 3 ingredients if any are visible.`,
        response_json_schema: {
          type: 'object',
          properties: {
            ingredients: { type: 'array', items: { type: 'object' } },
            safety_score: { type: 'number' }, verdict: { type: 'string' }, verdict_reason: { type: 'string' },
            skin_type_suitability: { type: 'string' }, eye_area_safe: { type: 'boolean' }, pregnancy_safe: { type: 'boolean' },
            pregnancy_note: { type: 'string' }, long_term_summary: { type: 'string' },
            top_beneficial: { type: 'array', items: { type: 'string' } },
            top_concerning: { type: 'array', items: { type: 'string' } },
            routine_step: { type: 'string' }, application_method: { type: 'string' },
            frequency: { type: 'string' }, apply_after: { type: 'string' },
            do_not_combine: { type: 'string' }, results_timeline: { type: 'string' },
            routine_steps: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      const analysis = parseApiResponse(rraw);
      const combined = { ...step1Data, ...analysis, ingredients: analysis.ingredients || [], label_image_url: file_url, _loadingDetails: false };
      setResult(combined);
      setIsAnalyzing(false);
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
    } catch (err) {
      alert('Analysis failed: ' + (err?.message || 'Unknown error'));
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
    setS1File(null); setS2File(null);
  };

  if (isAnalyzing) return <AnalyzingScreen type="skincare" message={analyzingMsg} onCancel={() => { setIsAnalyzing(false); setS1File(null); setS2File(null); navigate('/scanner'); }} />;

  // ─── Results page ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <SkincareVerdictPage
        result={result}
        onBack={() => { reset(); navigate('/scanner'); }}
      />
    );
  }

  // Auto-trigger analysis when file is picked (no preview page)
  // analyseStep1 / analyseStep2 are called directly from handleS1File / handleS2File via useEffect


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