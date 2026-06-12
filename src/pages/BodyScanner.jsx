import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';
import { getProfileList, uploadFile } from '@/lib/db';
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

const SCORE_COLOR = (s) => s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444';

function RatingBar({ score }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: SCORE_COLOR(score) }} />
    </div>
  );
}

function RatingsCard({ result, imageUrl, onViewDetail }) {
  const scores = [
    { label: 'Overall', score: result.overall_score },
    { label: 'Potential', score: result.potential_score || Math.min(100, result.overall_score + 18) },
    { label: 'Muscle Dev.', score: result.muscle_score || result.overall_score },
    { label: 'Body Fat', score: result.body_fat_score || Math.max(20, 100 - (result.overall_score * 0.3)) },
    { label: 'Posture', score: result.posture_score || 60 },
    { label: 'Frame', score: result.frame_score || result.overall_score },
  ];

  return (
    <div className="rounded-[28px] overflow-hidden mx-4" style={{ background: '#1a1a1a', boxShadow: '0 16px 48px rgba(0,0,0,0.35)' }}>
      <p className="text-white text-center text-base font-bold pt-5 pb-3">Ratings</p>
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20">
          {imageUrl
            ? <img src={imageUrl} className="w-full h-full object-cover object-top" alt="" />
            : <div className="w-full h-full bg-gray-700 flex items-center justify-center text-3xl">💪</div>
          }
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 pb-5">
        {scores.map(({ label, score }) => (
          <div key={label}>
            <p className="text-[11px] text-gray-400">{label}</p>
            <p className="text-3xl font-black text-white leading-tight mt-0.5">{Math.round(score)}</p>
            <RatingBar score={score} />
          </div>
        ))}
      </div>
      <button onClick={onViewDetail}
        className="w-full py-4 border-t border-white/10 flex items-center justify-center gap-2 text-white/70 text-sm font-semibold active:bg-white/5 transition-colors">
        View Full Analysis <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function DetailPage({ result, onBack }) {
  const cardAnim = (i) => ({ initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07, duration: 0.38, ease: [0.22,1,0.36,1] } });

  return (
    <div className="min-h-screen pb-10">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <div>
          <p className="text-xs text-gray-400">Detailed Analysis</p>
          <h1 className="text-lg font-black text-gray-900">Body Report</h1>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Body type + summary */}
        <motion.div {...cardAnim(0)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700">{result.body_type}</span>
            {result.estimated_body_fat_range && <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700">~{result.estimated_body_fat_range} body fat</span>}
            {result.muscle_mass_level && <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700">{result.muscle_mass_level} muscle</span>}
          </div>
          {result.overall_summary?.split(/[.!]+/).filter(s => s.trim().length > 4).map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <span className="text-gray-300 shrink-0 mt-0.5">•</span>
              <p className="text-sm text-gray-600 leading-relaxed">{s.trim()}.</p>
            </div>
          ))}
        </motion.div>

        {/* Posture */}
        {result.posture && (
          <motion.div {...cardAnim(1)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
            <p className="text-sm font-bold text-gray-800 mb-3">🧍 Posture Assessment</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Forward Head', value: result.posture.forward_head_posture ? 'Yes' : 'No', bad: result.posture.forward_head_posture },
                { label: 'Rounded Shoulders', value: result.posture.rounded_shoulders ? 'Yes' : 'No', bad: result.posture.rounded_shoulders },
                { label: 'Pelvic Tilt', value: result.posture.anterior_pelvic_tilt ? 'Yes' : 'No', bad: result.posture.anterior_pelvic_tilt },
                { label: 'Overall', value: result.posture.overall_rating, bad: result.posture.overall_rating === 'Poor' },
              ].map(({ label, value, bad }) => (
                <div key={label} className="rounded-[14px] p-3" style={{ background: bad ? '#fef2f2' : '#f0fdf4' }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: bad ? '#dc2626' : '#16a34a' }}>{value}</p>
                </div>
              ))}
            </div>
            {result.posture.fix_exercises?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Corrective Exercises</p>
                {result.posture.fix_exercises.map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <span className="text-gray-300 shrink-0">•</span>
                    <p className="text-xs text-gray-500">{ex}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Priority muscle groups */}
        {result.priority_muscle_groups?.length > 0 && (
          <motion.div {...cardAnim(2)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
            <p className="text-sm font-bold text-gray-800 mb-3">💪 Priority Muscle Groups</p>
            <div className="space-y-3">
              {result.priority_muscle_groups.map((mg, i) => (
                <div key={i} className="bg-gray-50 rounded-[16px] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <p className="text-sm font-bold text-gray-800">{mg.group}</p>
                  </div>
                  {mg.why && <div className="flex items-start gap-2 mb-1"><span className="text-gray-300 shrink-0">•</span><p className="text-xs text-gray-500">{mg.why}</p></div>}
                  {mg.exercises?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mg.exercises.map((ex, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">{ex}</span>
                      ))}
                    </div>
                  )}
                  {mg.timeline && <p className="text-[10px] text-gray-400 mt-1">Timeline: {mg.timeline}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Priority actions */}
        {result.priority_actions?.length > 0 && (
          <motion.div {...cardAnim(3)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
            <p className="text-sm font-bold text-gray-800 mb-3">🎯 Start Today</p>
            <div className="space-y-2.5">
              {result.priority_actions.map((action, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Personalised plan */}
        {result.personalised_plan?.length > 0 && (
          <motion.div {...cardAnim(4)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
            <p className="text-sm font-bold text-gray-800 mb-3">📋 Your Personalised Plan</p>
            <div className="space-y-2.5">
              {result.personalised_plan.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base">{['🎯','💪','🔥'][i] || '•'}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Strengths */}
        {result.strengths?.length > 0 && (
          <motion.div {...cardAnim(5)} className="bg-green-50 rounded-[20px] p-5 shadow-sm">
            <p className="text-sm font-bold text-green-700 mb-2">💪 Your Strengths</p>
            {result.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span className="text-green-400 shrink-0">•</span>
                <p className="text-xs text-green-700">{s}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Areas to improve */}
        {result.areas_to_improve?.length > 0 && (
          <motion.div {...cardAnim(6)}>
            <p className="text-sm font-bold text-gray-700 px-1 mb-2">Areas to Work On</p>
            <div className="space-y-3">
              {result.areas_to_improve.map((a, i) => {
                const sevColor = a.severity === 'High' ? { bg: '#fef2f2', text: '#dc2626' } : a.severity === 'Medium' ? { bg: '#fefce8', text: '#ca8a04' } : { bg: '#f0fdf4', text: '#16a34a' };
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                    className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-800">{a.area}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sevColor.bg, color: sevColor.text }}>{a.severity}</span>
                    </div>
                    {a.observation && <div className="flex items-start gap-2 mb-2"><span className="text-gray-300 shrink-0">•</span><p className="text-xs text-gray-500">{a.observation}</p></div>}
                    {a.exercise_fix && (
                      <div className="bg-gray-50 rounded-xl p-2.5 mb-1">
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">Exercise</p>
                        <p className="text-xs text-gray-700">{a.exercise_fix}</p>
                      </div>
                    )}
                    {a.nutrition_tip && (
                      <div className="bg-blue-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-bold text-blue-500 mb-0.5">Nutrition</p>
                        <p className="text-xs text-blue-700">{a.nutrition_tip}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {result.appearance_diet_connection && (
          <motion.div {...cardAnim(7)} className="rounded-[20px] p-4 shadow-sm" style={{ background: '#faf5ff' }}>
            <p className="text-xs font-bold text-purple-700 mb-2">🥗 Diet & Body Connection</p>
            {result.appearance_diet_connection.split(/[.!]+/).filter(s => s.trim().length > 4).map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="text-purple-300 shrink-0">•</span>
                <p className="text-sm text-purple-700 leading-relaxed">{s.trim()}.</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function BodyScanner() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => getProfileList() });
  const profile = profiles[0] || {};

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCapturedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const analyse = async () => {
    if (!capturedFile) return;
    setIsAnalyzing(true);
    setPreviewUrl(null);

    const { file_url } = await uploadFile({ file: capturedFile });
    const { result: r } = await analyzeWithClaude({
      image_url: file_url,
      prompt: `You are a world-class certified personal trainer, body composition specialist, and physique coach. Analyze this full-body photo in exhaustive detail.

User: Goal: ${profile.goal || 'maintain'}, Diet: ${profile.diet_mode || 'standard'}, Sex: ${profile.sex || 'unknown'}, Weight: ${profile.weight || '?'}kg.

Return JSON:
- overall_score: 1–100, potential_score: 1–100, muscle_score: 1–100, body_fat_score: 1–100, posture_score: 1–100, frame_score: 1–100
- body_type: "Ectomorph"/"Mesomorph"/"Endomorph" or combination
- muscle_mass_level: "Low"/"Moderate"/"High"/"Athletic"
- estimated_body_fat_range: e.g. "15–18%"
- overall_summary: 2 sentences
- posture: { forward_head_posture: bool, rounded_shoulders: bool, anterior_pelvic_tilt: bool, overall_rating: "Poor"/"Fair"/"Good"/"Excellent", fix_exercises: array of 2 strings }
- frame: { shoulder_to_waist_ratio, hip_width_relative, overall_frame_rating, natural_strengths }
- priority_muscle_groups: array of 3 objects, each: group, why, exercises (array of 2), weekly_sets, focus, timeline
- areas_to_improve: array of up to 5, each: area, severity ("Low"/"Medium"/"High"), observation, exercise_fix, nutrition_tip
- strengths: array of up to 3 strings
- priority_actions: array of exactly 3 strings
- personalised_plan: array of exactly 3 strings
- body_type_recommendations: string
- appearance_diet_connection: string or null

NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' }, potential_score: { type: 'number' },
          muscle_score: { type: 'number' }, body_fat_score: { type: 'number' },
          posture_score: { type: 'number' }, frame_score: { type: 'number' },
          body_type: { type: 'string' }, muscle_mass_level: { type: 'string' },
          estimated_body_fat_range: { type: 'string' }, overall_summary: { type: 'string' },
          posture: { type: 'object' }, frame: { type: 'object' },
          priority_muscle_groups: { type: 'array', items: { type: 'object' } },
          areas_to_improve: { type: 'array', items: { type: 'object' } },
          strengths: { type: 'array', items: { type: 'string' } },
          priority_actions: { type: 'array', items: { type: 'string' } },
          personalised_plan: { type: 'array', items: { type: 'string' } },
          body_type_recommendations: { type: 'string' },
          appearance_diet_connection: { type: 'string' },
        },
      },
    });

    setResult({ ...(r?.result || r || {}), image_url: file_url });
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
        } catch (_) {}
        sessionStorage.removeItem('replayScan');
      }
    }
  }, []);

  const reset = () => { setResult(null); setCapturedFile(null); setPreviewUrl(null); setShowDetail(false); };

  if (isAnalyzing) return <AnalyzingScreen type="food" message="Analysing your body..." />;
  if (result && showDetail) return <DetailPage result={result} onBack={() => setShowDetail(false)} />;

  if (result) {
    return (
      <div className="min-h-screen pb-10">
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={reset} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-800" />
          </button>
          <p className="text-gray-900 font-bold text-lg">Body Analysis</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <RatingsCard result={result} imageUrl={result.image_url} onViewDetail={() => setShowDetail(true)} />
        </motion.div>

        <div className="px-4 mt-4 space-y-3">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{result.body_type}</span>
              {result.estimated_body_fat_range && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">~{result.estimated_body_fat_range} BF</span>
              )}
            </div>
            {result.overall_summary?.split(/[.!]+/).filter(s => s.trim().length > 4).map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="text-gray-300 shrink-0 mt-0.5">•</span>
                <p className="text-sm text-gray-600 leading-relaxed">{s.trim()}.</p>
              </div>
            ))}
          </motion.div>

          {result.appearance_diet_connection && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-[20px] p-4" style={{ background: '#faf5ff', border: '1px solid rgba(168,85,247,0.15)' }}>
              <p className="text-xs font-bold text-purple-700 mb-1">🥗 Diet Connection</p>
              <p className="text-sm text-purple-700 leading-relaxed">{result.appearance_diet_connection}</p>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <button onClick={() => setShowDetail(true)}
              className="w-full py-4 rounded-[20px] bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
              View Full Detailed Report <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          <button onClick={reset} className="w-full py-3 rounded-[20px] text-gray-400 font-medium text-sm">
            Scan Again
          </button>
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={previewUrl} className="flex-1 w-full object-cover" alt="Body" />
        <div className="absolute top-0 left-0 right-0 flex items-center px-5 pt-12">
          <button onClick={() => { setCapturedFile(null); setPreviewUrl(null); }} className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-3">
          <button onClick={analyse} className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" /> Analyse
          </button>
          <button onClick={() => { setCapturedFile(null); setPreviewUrl(null); }} className="text-white/70 text-sm font-medium">Retake photo</button>
        </div>
      </div>
    );
  }

  const userName = profile.name || 'there';
  return <BodyScannerLanding userName={userName} cameraRef={cameraRef} uploadRef={uploadRef} onFile={handleFile} onBack={() => navigate('/scanner')} />;
}

function BodyScannerLanding({ userName, cameraRef, uploadRef, onFile, onBack }) {
  const lines = [
    `Hi ${userName}.`,
    `Here you can [Photo Scan] your full body to get a complete physique analysis.`,
    `The AI will [Rate Your Body] across muscle development, posture, frame and more.`,
    `Or [Upload from Gallery] if you already have a photo.`,
  ];
  const displayed = useTypingEffect(lines, 26);

  const renderLine = (text, idx) => {
    if (!text) return null;
    if (idx === 0) return <p key={idx} className="text-3xl font-bold text-gray-900 leading-snug">{text}</p>;
    const actions = {
      '[Photo Scan]': { label: 'Photo Scan', onClick: () => cameraRef.current?.click() },
      '[Rate Your Body]': { label: 'Rate Your Body', onClick: () => cameraRef.current?.click() },
      '[Upload from Gallery]': { label: 'Upload from Gallery', onClick: () => uploadRef.current?.click() },
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
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button onClick={onBack} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-900" />
      </button>
      <div className="space-y-6">
        {lines.map((_, idx) => renderLine(displayed[idx] || '', idx))}
      </div>
      <button onClick={() => uploadRef.current?.click()} className="mt-12 w-full text-center text-sm text-gray-400 font-medium">
        Or choose from gallery →
      </button>
    </div>
  );
}