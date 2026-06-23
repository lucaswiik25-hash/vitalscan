import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { useScanJob, loadScanResult } from '@/lib/ScanJobContext';
import SupplementVerdictPage from '../components/scanner/SupplementVerdictPage';
import SupplementMiniOnboarding from '../components/onboarding/SupplementMiniOnboarding';
import { useUserProfile } from '../hooks/useUserProfile';
import { parseApiResponse } from '../lib/parseApiResponse';
import { createScanHistory, upsertProfile, uploadFile } from '@/lib/db';
import { analyzeWithClaude } from '@/lib/ai';

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
  const queryClient = useQueryClient();
  const { runBackgroundAnalysis } = useScanJob();
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
  const [showSupOnboarding, setShowSupOnboarding] = useState(false);

  const { profile } = useUserProfile();
  const userName = profile.name || 'there';

  // Show supplement mini-onboarding first time if health_conditions not set
  useEffect(() => {
    if (profile.id && !profile.supplement_onboarding_done) {
      setShowSupOnboarding(true);
    }
  }, [profile.id, profile.supplement_onboarding_done]);

  const handleSupOnboardingComplete = async (data) => {
    if (profile.id) {
      await upsertProfile({ ...data, supplement_onboarding_done: true });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
    setShowSupOnboarding(false);
  };

  const handleSupOnboardingSkip = async () => {
    if (profile.id) {
      await upsertProfile({ supplement_onboarding_done: true });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
    setShowSupOnboarding(false);
  };

  const handleS1File = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setS1File(file);
    setIsAnalyzing(true);
    setAnalyzingMsg('Identifying your supplement...');
    const { file_url } = await uploadFile({ file });
    const rraw = await analyzeWithClaude({
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
    setStep1Data({ ...parseApiResponse(rraw), image_url: file_url });
    setIsAnalyzing(false);
    setStep(2);
    setS1File(null);
  };

  const handleS2File = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setS2File(file);
    await analyseStep2WithFile(file);
  };

  const analyseStep2WithFile = async (file) => {
    const healthConditions = (profile.health_conditions || []).join(', ');
    const supplementPersonalisation = healthConditions
      ? `User health context: ${healthConditions}. Flag any ingredients that may interact negatively with these conditions. If the supplement is irrelevant to the user's goal of ${profile.goal || 'general health'}, state this clearly.`
      : `User goal: ${profile.goal || 'general health'}. Evaluate relevance to this goal.`;
    const step1Snapshot = step1Data;

    runBackgroundAnalysis({
      label: 'Analyzing supplement…',
      resultKey: 'bgScan_supplement',
      viewPath: '/supplement-scanner',
      navigateAway: () => navigate('/scanner'),
      task: async () => {
        const { file_url } = await uploadFile({ file });
        const rraw = await analyzeWithClaude({
          image_url: file_url,
          prompt: `You are a clinical supplement expert and pharmacologist. This is the SUPPLEMENT FACTS panel of: "${step1Snapshot?.brand} ${step1Snapshot?.product_name}" — primary ingredient: ${step1Snapshot?.primary_ingredient}.

${supplementPersonalisation}

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
        const combined = { ...step1Snapshot, ...parseApiResponse(rraw) };
        createScanHistory({
          type: 'supplement',
          date: new Date().toISOString().split('T')[0],
          image_url: step1Snapshot?.image_url || null,
          product_name: combined.product_name,
          brand: combined.brand || null,
          quality_score: combined.quality_score || null,
          verdict: combined.verdict || null,
          result_data: combined,
        }).catch(() => {});
        return combined;
      },
    });
    setS2File(null);
  };

  // Handle replay from scan history
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('bgScan') === '1') {
      const data = loadScanResult('bgScan_supplement');
      if (data) setResult(data);
      window.history.replaceState({}, '', window.location.pathname);
    }
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

  // Auto-trigger camera on open — skip typing screen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('bgScan') === '1' || urlParams.get('replay') === '1') return;
    const t = setTimeout(() => cam1Ref.current?.click(), 100);
    return () => clearTimeout(t);
  }, []);

  const reset = () => {
    setResult(null); setStep1Data(null); setStep(1);
    setS1File(null); setS2File(null);
  };

  if (showSupOnboarding) return (
    <AnimatePresence>
      <SupplementMiniOnboarding onComplete={handleSupOnboardingComplete} onSkip={handleSupOnboardingSkip} />
    </AnimatePresence>
  );

  // ─── Results page ───────────────────────────────────────────────────────────
  if (result) {
    return (
      <SupplementVerdictPage
        result={result}
        onBack={() => { reset(); navigate('/scanner'); }}
      />
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
  return (
    <div className="min-h-screen px-6 pt-14 pb-20">
      <input ref={cam1Ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleS1File} />
      <input ref={up1Ref} type="file" accept="image/*" className="hidden" onChange={handleS1File} />
      <button onClick={() => navigate(-1)} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-900" />
      </button>
      <div className="space-y-6">
        {isAnalyzing && <p className="text-sm text-gray-500 font-medium">{analyzingMsg || 'Identifying supplement…'}</p>}
        <p className="text-3xl font-bold text-gray-900 leading-snug">Supplement Scanner</p>
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          <button onClick={() => cam1Ref.current?.click()} className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-900 text-white text-lg font-bold active:scale-95 transition-transform mx-1" style={{ verticalAlign: 'middle' }}>Scan Supplement</button>{' '}
          by photographing the front of the bottle.
        </p>
        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Or{' '}
          <button onClick={() => up1Ref.current?.click()} className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-900 text-white text-lg font-bold active:scale-95 transition-transform mx-1" style={{ verticalAlign: 'middle' }}>Upload from Gallery</button>
        </p>
      </div>
    </div>
  );
}

function SupplementLanding({ userName, cam1Ref, up1Ref, onS1File, onBack, isLoading, loadingMessage }) {
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
        {isLoading && (
          <p className="text-sm text-gray-500 font-medium">{loadingMessage || 'Identifying supplement…'}</p>
        )}
        {lines.map((_, idx) => renderLine(displayed[idx] || '', idx))}
      </div>
    </div>
  );
}