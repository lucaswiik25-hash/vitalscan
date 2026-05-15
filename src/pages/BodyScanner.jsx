import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, ImageIcon, Sparkles, ArrowLeft } from 'lucide-react';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';

const SEV_COLORS = {
  Low: { bg: '#dcfce7', text: '#16a34a' },
  Medium: { bg: '#fef9c3', text: '#ca8a04' },
  High: { bg: '#fee2e2', text: '#dc2626' },
};

const SCORE_COLOR = (s) => s >= 70 ? '#16a34a' : s >= 40 ? '#ca8a04' : '#dc2626';

export default function BodyScanner() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scanLineAnim, setScanLineAnim] = useState(0);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => base44.entities.UserProfile.list() });
  const profile = profiles[0] || {};

  useEffect(() => {
    let start = null;
    let raf;
    const animate = (ts) => {
      if (!start) start = ts;
      setScanLineAnim(((ts - start) % 4000) / 4000);
      raf = requestAnimationFrame(animate);
    };
    if (!capturedFile && !isAnalyzing) raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [capturedFile, isAnalyzing]);

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

    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a certified personal trainer and body composition specialist. Analyze this full-body photo.

User profile: Goal: ${profile.goal || 'maintain'}, Diet: ${profile.diet_mode || 'standard'}, Sex: ${profile.sex || 'unknown'}, Weight: ${profile.weight || '?'}kg.

Identify the areas that need the most work and return personalized, honest, and constructive feedback.

Return JSON with:
- overall_score: 1–100 (fitness/body composition score)
- body_type: detected body type (e.g. "Ectomorph", "Mesomorph", "Endomorph", "Lean", "Athletic", etc.)
- overall_summary: 2 sentences summarizing current physique
- areas_to_improve: array of up to 5 body areas that need the most attention. Each has:
  - area: name of the area (e.g. "Core & Belly", "Upper Chest", "Glutes", "Arms", "Lower Body", "Posture", "Overall Body Fat")
  - severity: "Low", "Medium", or "High" (how much work is needed)
  - observation: what you specifically observe
  - exercise_fix: 1-2 specific exercises to address this
  - nutrition_tip: one diet/nutrition tip tailored to their diet mode (${profile.diet_mode || 'standard'}) that helps this area
- strengths: array of up to 3 body areas or attributes that look strong or well developed
- priority_actions: array of exactly 3 actions they should start TODAY based on their goal (${profile.goal || 'maintain'})
- estimated_body_fat_range: e.g. "15–18%"

NEVER fail. Be honest but constructive. If photo quality is low, do your best with visible information.`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          body_type: { type: 'string' },
          overall_summary: { type: 'string' },
          estimated_body_fat_range: { type: 'string' },
          areas_to_improve: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                area: { type: 'string' },
                severity: { type: 'string' },
                observation: { type: 'string' },
                exercise_fix: { type: 'string' },
                nutrition_tip: { type: 'string' },
              },
            },
          },
          strengths: { type: 'array', items: { type: 'string' } },
          priority_actions: { type: 'array', items: { type: 'string' } },
        },
      },
    });

    setResult({ ...r.result, image_url: file_url });
    setIsAnalyzing(false);
  };

  const reset = () => { setResult(null); setCapturedFile(null); setPreviewUrl(null); };

  if (isAnalyzing) return <AnalyzingScreen type="food" message="Analysing your body..." />;

  if (result) {
    const scoreColor = SCORE_COLOR(result.overall_score);
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={reset} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Body Analysis</h1>
        </div>

        <div className="px-5 space-y-4">
          {/* Score */}
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Body Score</p>
                <p className="text-5xl font-extrabold mt-0.5" style={{ color: scoreColor }}>{result.overall_score}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{result.overall_summary}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground">{result.body_type}</span>
              {result.estimated_body_fat_range && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground">~{result.estimated_body_fat_range} body fat</span>
              )}
            </div>
          </div>

          {/* Priority actions */}
          {result.priority_actions?.length > 0 && (
            <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Start Today</p>
              <div className="space-y-2">
                {result.priority_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-foreground text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-foreground leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-[20px] p-4">
              <p className="text-xs font-bold text-green-700 mb-2">💪 Strengths</p>
              {result.strengths.map((s, i) => (
                <p key={i} className="text-xs text-green-700 mb-0.5">• {s}</p>
              ))}
            </div>
          )}

          {/* Areas to improve */}
          {result.areas_to_improve?.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground px-1">Areas to Work On</p>
              {result.areas_to_improve.map((a, i) => {
                const sc = SEV_COLORS[a.severity] || SEV_COLORS.Low;
                return (
                  <div key={i} className="bg-white border border-border rounded-[20px] p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{a.area}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{a.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.observation}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-bold text-gray-500 mb-0.5">Exercise</p>
                        <p className="text-xs text-gray-700">{a.exercise_fix}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-2.5">
                        <p className="text-[10px] font-bold text-blue-500 mb-0.5">Nutrition</p>
                        <p className="text-xs text-blue-700">{a.nutrition_tip}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={previewUrl} className="flex-1 w-full object-cover" alt="Body" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
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

  return (
    <div className="min-h-screen bg-white px-6 pt-14 pb-20">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <button onClick={() => navigate(-1)} className="mb-10 w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-gray-900" />
      </button>

      <div className="space-y-6">
        <p className="text-3xl font-bold text-gray-900 leading-snug">Hi {userName}.</p>

        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Here you can{' '}
          <ScanButton label="Photo Scan" onClick={() => cameraRef.current?.click()} />{' '}
          your full body to get a personalised fitness analysis.
        </p>

        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          The AI will{' '}
          <ScanButton label="Detect Areas" onClick={() => cameraRef.current?.click()} />{' '}
          you need to work on most and give you an action plan.
        </p>

        <p className="text-2xl font-semibold text-gray-900 leading-relaxed">
          Wear fitted clothing and stand in{' '}
          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-200 text-gray-700 text-lg font-bold mx-1 bg-gray-50" style={{ verticalAlign: 'middle' }}>
            natural light
          </span>{' '}
          for best results.
        </p>
      </div>

      <button onClick={() => uploadRef.current?.click()} className="mt-12 w-full text-center text-sm text-gray-400 font-medium">
        Or choose from gallery →
      </button>
    </div>
  );
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