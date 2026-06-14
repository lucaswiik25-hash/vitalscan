import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, ArrowLeft, CheckCircle, AlertTriangle, XCircle, Zap, Search, Camera, ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useScanJob, loadScanResult } from '@/lib/ScanJobContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfileList, uploadFile } from '@/lib/db';
import { analyzeWithClaude } from '@/lib/ai';

const ALL_EXERCISES = [
  // A
  'Arnold Press', 'Ab Wheel Rollout',
  // B
  'Back Squat', 'Barbell Row', 'Bench Press', 'Bulgarian Split Squat', 'Bicep Curl',
  // C
  'Cable Fly', 'Cable Row', 'Chin-up', 'Clean & Jerk', 'Close-Grip Bench Press',
  // D
  'Deadlift', 'Deficit Deadlift', 'Dumbbell Lateral Raise', 'Dumbbell Press', 'Dips',
  // F
  'Face Pull', 'Front Squat', "Farmer's Walk", 'Floor Press',
  // G
  'Goblet Squat', 'Good Morning',
  // H
  'Hack Squat', 'Hammer Curl', 'Hanging Leg Raise', 'Hip Thrust',
  // I
  'Incline Bench Press', 'Incline Dumbbell Curl',
  // J
  'Jefferson Curl', 'Jump Squat',
  // K
  'Kettlebell Swing', 'Kroc Row',
  // L
  'Landmine Press', 'Lat Pulldown', 'Leg Curl', 'Leg Extension', 'Leg Press', 'Lunge',
  // M
  'Military Press', 'Muscle-up',
  // N
  'Nordic Curl',
  // O
  'Overhead Press', 'Overhead Squat',
  // P
  'Pause Squat', 'Pendlay Row', 'Pistol Squat', 'Plank', 'Preacher Curl', 'Pull-up', 'Push Press', 'Push-up',
  // R
  'RDL (Romanian Deadlift)', 'Ring Dip', 'Ring Row', 'Row',
  // S
  'Safety Bar Squat', 'Seated Row', 'Shoulder Press', 'Side Lateral Raise', 'Single-Leg Deadlift', 'Snatch', 'Squat', 'Sumo Deadlift',
  // T
  'T-Bar Row', 'Tricep Pushdown', 'Turkish Get-up',
  // U
  'Upright Row',
  // W
  'Weighted Pull-up', 'Wide-Grip Pull-up',
  // Z
  'Zercher Squat',
];

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

function ExerciseLanding({ userName, selectedExercise, onSelectExercise, onStartAnalysing, onBack }) {
  const [search, setSearch] = useState('');

  const lines = [
    `Hi ${userName}.`,
    `Select an exercise, then photograph yourself at the key position.`,
    `Claude will score your form and tell you exactly what to fix.`,
  ];
  const displayed = useTypingEffect(lines, 26);

  const filtered = search.trim()
    ? ALL_EXERCISES.filter(e => e.toLowerCase().includes(search.toLowerCase()))
    : ALL_EXERCISES;

  // Group by first letter
  const grouped = {};
  filtered.forEach(ex => {
    const letter = ex[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(ex);
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed header */}
      <div className="px-6 pt-14 pb-4 shrink-0">
        <button onClick={onBack} className="mb-6 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <div className="space-y-2 mb-5">
          {lines.map((_, idx) => {
            const text = displayed[idx] || '';
            if (!text) return null;
            if (idx === 0) return <p key={idx} className="text-3xl font-bold text-gray-900 leading-snug">{text}</p>;
            return <p key={idx} className="text-base text-gray-500 leading-relaxed">{text}</p>;
          })}
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 shadow-sm mb-2">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercise..."
            className="flex-1 text-sm focus:outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-400 text-xs">✕</button>}
        </div>
      </div>

      {/* Scrollable exercise list */}
      <div className="flex-1 overflow-y-auto px-6 pb-40">
        {Object.entries(grouped).map(([letter, exercises]) => (
          <div key={letter} className="mb-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{letter}</p>
            <div className="grid grid-cols-2 gap-2">
              {exercises.map(ex => (
                <button
                  key={ex}
                  onClick={() => onSelectExercise(ex)}
                  className="py-3 px-4 rounded-[16px] text-sm font-semibold text-left transition-all active:scale-95"
                  style={{
                    background: selectedExercise === ex ? '#1a1a1a' : '#f4f4f5',
                    color: selectedExercise === ex ? '#ffffff' : '#1a1a1a',
                    border: selectedExercise === ex ? '1.5px solid #1a1a1a' : '1.5px solid transparent',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">No exercises found for "{search}"</p>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <AnimatePresence>
        {selectedExercise && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4"
            style={{ background: 'linear-gradient(to top, white 70%, transparent)', zIndex: 40 }}
          >
            <div className="flex gap-3">
              <button
                onClick={() => onStartAnalysing('camera')}
                className="flex-1 h-14 rounded-2xl bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Camera className="w-5 h-5" /> Take Photo
              </button>
              <button
                onClick={() => onStartAnalysing('gallery')}
                className="h-14 px-5 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Analysing: <span className="font-bold text-gray-700">{selectedExercise}</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExerciseFormScanner() {
  const navigate = useNavigate();
  const { runBackgroundAnalysis } = useScanJob();
  const camRef = useRef(null);
  const upRef = useRef(null);

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => getProfileList(),
  });
  const userName = profiles[0]?.name || 'there';

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const handleStartAnalysing = (mode) => {
    if (mode === 'camera') camRef.current?.click();
    else upRef.current?.click();
  };

  const analyse = async () => {
    if (!file || !selectedExercise) return;
    const snapshot = { file, exercise: selectedExercise };
    setPreview(null);
    setFile(null);

    runBackgroundAnalysis({
      label: 'Analyzing your form…',
      resultKey: 'bgScan_exercise_form',
      viewPath: '/exercise-form-scanner',
      navigateAway: () => navigate('/scanner'),
      task: async () => {
        const { file_url } = await uploadFile({ file: snapshot.file });
        const raw = await analyzeWithClaude({
          image_url: file_url,
          prompt: `You are an elite strength and conditioning coach with expertise in biomechanics. The user is performing a ${snapshot.exercise}.

Analyze this image of their form carefully. Look at joint alignment, spine position, foot placement, depth, bar path (if applicable), and any compensation patterns.

Return JSON with:
- form_score: number 1-100 (100 = perfect competition-level form)
- verdict: "excellent" | "good" | "needs_work" | "poor"
- what_is_correct: array of 3-4 strings describing what they are doing well
- what_needs_fixing: array of 3-4 strings describing specific form faults
- top_cue: a single short coaching cue (max 12 words) — the #1 most impactful thing to fix RIGHT NOW
- top_cue_why: 1 sentence explaining why this cue matters most
- injury_risk: "low" | "medium" | "high"
- injury_risk_note: brief note on injury risk if medium or high

NEVER fail. If form is not clearly visible, make your best assessment and note low confidence.`,
          response_json_schema: {
            type: 'object',
            properties: {
              form_score: { type: 'number' },
              verdict: { type: 'string' },
              what_is_correct: { type: 'array', items: { type: 'string' } },
              what_needs_fixing: { type: 'array', items: { type: 'string' } },
              top_cue: { type: 'string' },
              top_cue_why: { type: 'string' },
              injury_risk: { type: 'string' },
              injury_risk_note: { type: 'string' },
            },
          },
        });
        const res = raw.data?.result || raw.data || {};
        return { ...res, image_url: file_url, exercise: snapshot.exercise };
      },
    });
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('bgScan') === '1') {
      const data = loadScanResult('bgScan_exercise_form');
      if (data) setResult(data);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const reset = () => {
    setResult(null);
    setPreview(null);
    setFile(null);
    setSelectedExercise(null);
  };

  if (result) {
    const score = result.form_score || 0;
    const scoreColor = score >= 75 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626';
    const verdictLabel =
      result.verdict === 'excellent' ? 'Excellent Form' :
      result.verdict === 'good' ? 'Good Form' :
      result.verdict === 'needs_work' ? 'Needs Work' : 'Poor Form';
    const VIcon =
      result.verdict === 'excellent' || result.verdict === 'good' ? CheckCircle :
      result.verdict === 'needs_work' ? AlertTriangle : XCircle;
    const riskColor = result.injury_risk === 'low' ? '#16a34a' : result.injury_risk === 'medium' ? '#ca8a04' : '#dc2626';

    return (
      <div className="min-h-screen pb-10">
        <div className="px-5 pt-12 pb-3 flex items-center justify-between">
          <button onClick={() => { reset(); navigate('/scanner'); }} className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Scanner
          </button>
        </div>

        <div className="px-5 mb-4">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">AI ANALYSIS</p>
          <h1 className="text-2xl font-black text-gray-900">Form Analyzer</h1>
          <p className="text-sm text-gray-400 mt-0.5">{result.exercise} · One-shot analysis</p>
          <div className="flex gap-1.5 mt-3">
            <div className="h-1.5 flex-1 rounded-full bg-green-400" />
            <div className="h-1.5 flex-1 rounded-full bg-green-400" />
          </div>
        </div>

        <div className="px-4 space-y-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-[20px] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Form Score</p>
                <p className="text-5xl font-black leading-none" style={{ color: scoreColor }}>{score}</p>
                <p className="text-xs text-gray-400 mt-0.5">out of 100</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-gray-900">{result.exercise}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <VIcon className="w-3.5 h-3.5" style={{ color: scoreColor }} />
                  <span className="text-xs font-bold" style={{ color: scoreColor }}>{verdictLabel}</span>
                </div>
                <div className="flex items-center gap-1 justify-end mt-1.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Injury risk: </span>
                  <span className="text-[10px] font-bold capitalize" style={{ color: riskColor }}>{result.injury_risk}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="rounded-[20px] p-5 shadow-sm" style={{ background: '#1a1a1a' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Top Fix Right Now</p>
            </div>
            <p className="text-lg font-black text-white leading-snug">"{result.top_cue}"</p>
            {result.top_cue_why && <p className="text-xs text-white/60 mt-2 leading-relaxed">{result.top_cue_why}</p>}
          </motion.div>

          {result.injury_risk_note && result.injury_risk !== 'low' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="rounded-[20px] p-4 shadow-sm flex items-start gap-3"
              style={{ background: result.injury_risk === 'high' ? '#fef2f2' : '#fefce8' }}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: riskColor }} />
              <p className="text-xs leading-relaxed" style={{ color: riskColor }}>{result.injury_risk_note}</p>
            </motion.div>
          )}

          {result.what_is_correct?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="bg-white rounded-[20px] p-4 shadow-sm">
              <p className="text-sm font-bold text-green-700 mb-2">✅ What's Correct</p>
              {result.what_is_correct.map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span className="text-green-400 shrink-0 mt-0.5">•</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </motion.div>
          )}

          {result.what_needs_fixing?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="bg-white rounded-[20px] p-4 shadow-sm">
              <p className="text-sm font-bold text-red-600 mb-2">⚠️ What Needs Fixing</p>
              {result.what_needs_fixing.map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span className="text-red-400 shrink-0 mt-0.5">•</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </motion.div>
          )}

          <button onClick={() => { reset(); navigate('/scanner'); }}
            className="w-full py-4 rounded-[20px] bg-white shadow-sm text-sm font-semibold text-gray-700 text-center">
            Analyse Another
          </button>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={preview} className="flex-1 w-full object-cover" alt="Captured" />
        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-12">
          <button onClick={() => { setFile(null); setPreview(null); }}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-3">
          {selectedExercise && (
            <div className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
              <span className="text-white/90 text-sm font-semibold">{selectedExercise}</span>
            </div>
          )}
          <button onClick={analyse} disabled={!selectedExercise}
            className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
            <Sparkles className="w-5 h-5" /> Analyse Form
          </button>
          <button onClick={() => { setFile(null); setPreview(null); }} className="text-white/70 text-sm font-medium">
            Retake photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={upRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <ExerciseLanding
        userName={userName}
        selectedExercise={selectedExercise}
        onSelectExercise={setSelectedExercise}
        onStartAnalysing={handleStartAnalysing}
        onBack={() => navigate('/scanner')}
      />
    </>
  );
}