import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
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

const SCORE_COLOR = (s) => s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444';

function RatingBar({ score }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: SCORE_COLOR(score) }} />
    </div>
  );
}

function RatingsCard({ result, imageUrl, onViewDetail }) {
  const scores = [
    { label: 'Overall', score: result.overall_skin_score },
    { label: 'Potential', score: result.potential_score || Math.min(100, result.overall_skin_score + 20) },
    { label: 'Skin Quality', score: result.skin_quality_score || result.overall_skin_score },
    { label: 'Skin Clarity', score: result.skin_clarity_score || Math.max(20, result.overall_skin_score - 10) },
    { label: 'Jawline', score: result.jawline_score || result.facial_definition_score * 10 || 60 },
    { label: 'Cheekbones', score: result.cheekbone_score || result.facial_definition_score * 10 || 60 },
  ];

  return (
    <div className="rounded-[28px] overflow-hidden mx-4"
      style={{ background: '#1a1a1a', boxShadow: '0 16px 48px rgba(0,0,0,0.35)' }}>
      <p className="text-white text-center text-base font-bold pt-5 pb-3">Ratings</p>
      <div className="flex justify-center mb-4">
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20">
          {imageUrl
            ? <img src={imageUrl} className="w-full h-full object-cover object-top" alt="" />
            : <div className="w-full h-full bg-gray-700 flex items-center justify-center text-3xl">🧑</div>
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
    <div className="min-h-screen pb-10" style={{ background: 'white' }}>
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <div>
          <p className="text-xs text-gray-400">Detailed Analysis</p>
          <h1 className="text-lg font-black text-gray-900">Face Report</h1>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Skin type + summary as bullet points */}
        <motion.div {...cardAnim(0)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-700">{result.skin_type}</span>
            <span className="text-xs text-gray-400">Skin Type</span>
          </div>
          {result.overall_summary?.split(/[.!]+/).filter(s => s.trim().length > 4).map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <span className="text-gray-300 shrink-0 mt-0.5">•</span>
              <p className="text-sm text-gray-600 leading-relaxed">{s.trim()}.</p>
            </div>
          ))}
        </motion.div>

        {/* Facial structure */}
        {result.facial_structure && (
          <motion.div {...cardAnim(1)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
            <p className="text-sm font-bold text-gray-800 mb-3">Facial Structure</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Face Shape', value: result.facial_structure.face_shape },
                { label: 'Jawline', value: result.facial_structure.jawline_definition },
                { label: 'Cheekbones', value: result.facial_structure.cheekbone_visibility },
                { label: 'Definition', value: result.facial_definition_score ? `${result.facial_definition_score}/10` : null },
              ].filter(x => x.value).map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-[14px] p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5 capitalize">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Priority fixes */}
        {result.priority_actions?.length > 0 && (
          <motion.div {...cardAnim(2)} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-50">
            <p className="text-sm font-bold text-gray-800 mb-3">🎯 Top Priority Actions</p>
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

        {/* Diet connection */}
        {result.food_connection && (
          <motion.div {...cardAnim(3)} className="rounded-[20px] p-4 shadow-sm" style={{ background: '#faf5ff' }}>
            <p className="text-xs font-bold text-purple-700 mb-2">🍽️ Diet Connection</p>
            {result.food_connection.split(/[.!]+/).filter(s => s.trim().length > 4).map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="text-purple-300 shrink-0">•</span>
                <p className="text-sm text-purple-700 leading-relaxed">{s.trim()}.</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Detected concerns */}
        {result.detected_concerns?.length > 0 && (
          <motion.div {...cardAnim(4)}>
            <p className="text-sm font-bold text-gray-700 px-1 mb-2">Detected Concerns ({result.detected_concerns.length})</p>
            <div className="space-y-3">
              {result.detected_concerns.map((c, i) => {
                const sevColor = c.severity === 'Severe' || c.severity === 'High'
                  ? { bg: '#fef2f2', text: '#dc2626' }
                  : c.severity === 'Moderate' || c.severity === 'Medium'
                    ? { bg: '#fefce8', text: '#ca8a04' }
                    : { bg: '#f0fdf4', text: '#16a34a' };
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                    className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-800">{c.concern}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sevColor.bg, color: sevColor.text }}>{c.severity}</span>
                    </div>
                    {c.likely_cause && (
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-gray-300 shrink-0">•</span>
                        <p className="text-xs text-gray-500"><span className="font-semibold">Cause: </span>{c.likely_cause}</p>
                      </div>
                    )}
                    {c.actions?.length > 0 && (
                      <div className="space-y-1">
                        {c.actions.map((a, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <span className="text-gray-300 shrink-0 text-xs mt-0.5">→</span>
                            <p className="text-xs text-gray-600">{a}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {c.timeline && <p className="text-[10px] text-gray-400 mt-1.5">Timeline: {c.timeline}</p>}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Improvable vs genetic */}
        {(result.improvable?.length > 0 || result.genetic?.length > 0) && (
          <motion.div {...cardAnim(5)} className="grid grid-cols-2 gap-2">
            {result.improvable?.length > 0 && (
              <div className="bg-green-50 rounded-[20px] p-4 shadow-sm">
                <p className="text-xs font-bold text-green-700 mb-2">✅ Improvable</p>
                {result.improvable.map((s, i) => <p key={i} className="text-xs text-green-700 mb-1">• {s}</p>)}
              </div>
            )}
            {result.genetic?.length > 0 && (
              <div className="bg-gray-50 rounded-[20px] p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-600 mb-2">🧬 Genetic</p>
                {result.genetic.map((s, i) => <p key={i} className="text-xs text-gray-600 mb-1">• {s}</p>)}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function FaceScanner() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => base44.entities.UserProfile.list() });
  const { data: todayMeals = [] } = useQuery({
    queryKey: ['meals', format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Meal.filter({ date: format(new Date(), 'yyyy-MM-dd'), logged: true }),
  });
  const profile = profiles[0] || {};
  const isAppearanceMode = profile.diet_mode === 'appearance_mode';

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

    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });
    const todayFoodSummary = todayMeals.length > 0
      ? todayMeals.map(m => `${m.name}: ${m.calories}kcal, ${m.sodium || 0}mg sodium, ${m.sugar || 0}g sugar`).join('; ')
      : 'No food logged today';

    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a world-class dermatologist and facial analyst. Analyze this photo in exhaustive detail.
${isAppearanceMode ? `APPEARANCE MODE ACTIVE. Today's food log: ${todayFoodSummary}. Connect skin findings to diet where relevant.` : ''}
Return JSON:
- overall_skin_score: 1–100
- potential_score: 1–100
- skin_quality_score: 1–100
- skin_clarity_score: 1–100
- jawline_score: 1–100
- cheekbone_score: 1–100
- facial_definition_score: 1–10
- skin_type: "Oily", "Dry", "Combination", "Normal", or "Sensitive"
- overall_summary: 2 sentences
- facial_structure: { face_shape, jawline_definition ("strong"/"moderate"/"soft"), cheekbone_visibility ("high"/"moderate"/"low") }
- detected_concerns: array, each with: concern, severity ("Mild"/"Moderate"/"Severe"), likely_cause, actions (array of 3 strings), timeline
- priority_actions: array of exactly 3 strings
- improvable: array of strings
- genetic: array of strings
- food_connection: string (only if appearance mode, else null)
NEVER fail.`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_skin_score: { type: 'number' }, potential_score: { type: 'number' },
          skin_quality_score: { type: 'number' }, skin_clarity_score: { type: 'number' },
          jawline_score: { type: 'number' }, cheekbone_score: { type: 'number' },
          facial_definition_score: { type: 'number' }, skin_type: { type: 'string' },
          overall_summary: { type: 'string' }, facial_structure: { type: 'object' },
          detected_concerns: { type: 'array', items: { type: 'object' } },
          priority_actions: { type: 'array', items: { type: 'string' } },
          improvable: { type: 'array', items: { type: 'string' } },
          genetic: { type: 'array', items: { type: 'string' } },
          food_connection: { type: 'string' },
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

  if (isAnalyzing) return <AnalyzingScreen type="skincare" message="Analysing your face..." />;
  if (result && showDetail) return <DetailPage result={result} onBack={() => setShowDetail(false)} />;

  if (result) {
    return (
      <div className="min-h-screen pb-10" style={{ background: 'white' }}>
        {/* Header — app bg, not dark */}
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button onClick={reset} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-800" />
          </button>
          <p className="text-gray-900 font-bold text-lg">Face Analysis</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <RatingsCard result={result} imageUrl={result.image_url} onViewDetail={() => setShowDetail(true)} />
        </motion.div>

        <div className="px-4 mt-4 space-y-3">
          {/* Summary card — bullet points, not a wall of text */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Skin Type: <span className="text-gray-900 font-bold">{result.skin_type}</span></p>
            {result.overall_summary?.split(/[.!]+/).filter(s => s.trim().length > 4).map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="text-gray-300 shrink-0 mt-0.5">•</span>
                <p className="text-sm text-gray-600 leading-relaxed">{s.trim()}.</p>
              </div>
            ))}
          </motion.div>

          {/* Top concerns preview */}
          {result.detected_concerns?.slice(0, 3).map((c, i) => {
            const sevColor = c.severity === 'Severe' || c.severity === 'High'
              ? { bg: '#fef2f2', text: '#dc2626' }
              : c.severity === 'Moderate' ? { bg: '#fefce8', text: '#ca8a04' }
              : { bg: '#f0fdf4', text: '#16a34a' };
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
                className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-gray-800">{c.concern}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sevColor.bg, color: sevColor.text }}>{c.severity}</span>
                </div>
                {c.actions?.[0] && <p className="text-xs text-gray-500">→ {c.actions[0]}</p>}
              </motion.div>
            );
          })}

          {result.food_connection && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-[20px] p-4" style={{ background: '#faf5ff', border: '1px solid rgba(168,85,247,0.15)' }}>
              <p className="text-xs font-bold text-purple-700 mb-1">🍽️ Diet Connection</p>
              <p className="text-sm text-purple-700 leading-relaxed">{result.food_connection}</p>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
        <img src={previewUrl} className="flex-1 w-full object-cover" alt="Selfie" />
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
  return <FaceScannerLanding userName={userName} isAppearanceMode={isAppearanceMode} cameraRef={cameraRef} uploadRef={uploadRef} onFile={handleFile} onBack={() => navigate('/scanner')} />;
}

function FaceScannerLanding({ userName, isAppearanceMode, cameraRef, uploadRef, onFile, onBack }) {
  const lines = [
    `Hi ${userName}.`,
    `Here you can [Take Selfie] to get a full AI skin and face analysis.`,
    `The AI will [Rate Your Face] across skin quality, jawline, cheekbones and more.`,
    isAppearanceMode ? `Appearance Mode is active — your food log will be [connected] to your skin reading.` : `Or [Upload from Gallery] if you already have a photo.`,
  ];
  const displayed = useTypingEffect(lines, 26);

  const renderLine = (text, idx) => {
    if (!text) return null;
    if (idx === 0) return <p key={idx} className="text-3xl font-bold text-gray-900 leading-snug">{text}</p>;
    const actions = {
      '[Take Selfie]': { label: 'Take Selfie', onClick: () => cameraRef.current?.click() },
      '[Rate Your Face]': { label: 'Rate Your Face', onClick: () => cameraRef.current?.click() },
      '[connected]': { label: 'connected', onClick: () => {} },
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
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFile} />
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