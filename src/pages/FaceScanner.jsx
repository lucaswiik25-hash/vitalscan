import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { X, HelpCircle, ImageIcon, Sparkles, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';

const SEV_COLORS = {
  Low: { bg: '#dcfce7', text: '#16a34a' },
  Medium: { bg: '#fef9c3', text: '#ca8a04' },
  High: { bg: '#fee2e2', text: '#dc2626' },
};

const SCORE_COLOR = (s) => s >= 70 ? '#16a34a' : s >= 40 ? '#ca8a04' : '#dc2626';

export default function FaceScanner() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scanLineAnim, setScanLineAnim] = useState(0);

  const { data: profiles = [] } = useQuery({ queryKey: ['userProfile'], queryFn: () => base44.entities.UserProfile.list() });
  const { data: todayMeals = [] } = useQuery({
    queryKey: ['meals', format(new Date(), 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Meal.filter({ date: format(new Date(), 'yyyy-MM-dd'), logged: true }),
  });
  const profile = profiles[0] || {};
  const isAppearanceMode = profile.diet_mode === 'appearance_mode';

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

    const todayFoodSummary = todayMeals.length > 0
      ? todayMeals.map(m => `${m.name}: ${m.calories}kcal, ${m.sodium || 0}mg sodium, ${m.sugar || 0}g sugar`).join('; ')
      : 'No food logged today';

    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a dermatologist and nutritionist specializing in skin health and the gut-skin axis. Analyze this selfie carefully.

${isAppearanceMode ? `APPEARANCE MODE ACTIVE — The user follows an appearance-optimized diet. Today's food log: ${todayFoodSummary}. Directly connect skin findings to today's food intake where possible.` : ''}

Assess the following and return JSON:

1. overall_skin_score: 1–100 (100 = perfect skin)
2. skin_type: "Oily", "Dry", "Combination", "Normal", or "Sensitive"
3. detected_concerns: array of concerns found. Only include genuinely detected issues. Each concern has:
   - concern: one of: "Acne & Active Pimples", "Blackheads", "Whiteheads", "Facial Bloating & Puffiness", "Undereye Puffiness", "Dark Circles", "Dryness & Dehydration", "Oiliness", "Redness & Inflammation", "Uneven Skin Tone", "Large Pores", "Fine Lines"
   - severity: "Low", "Medium", or "High"
   - likely_cause: one sentence on nutritional or lifestyle cause
   - fix: one specific actionable fix
4. priority_actions: array of exactly 3 string actions the user should take TODAY
5. food_connection: (only if appearance mode) string connecting today's food to detected skin issues — e.g. "High sodium intake today likely contributing to detected puffiness"
6. overall_summary: 2-sentence summary of skin health

NEVER fail. If image quality is too low to assess a concern, skip it.`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_skin_score: { type: 'number' },
          skin_type: { type: 'string' },
          detected_concerns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                concern: { type: 'string' },
                severity: { type: 'string' },
                likely_cause: { type: 'string' },
                fix: { type: 'string' },
              },
            },
          },
          priority_actions: { type: 'array', items: { type: 'string' } },
          food_connection: { type: 'string' },
          overall_summary: { type: 'string' },
        },
      },
    });

    setResult({ ...r.result, image_url: file_url });
    setIsAnalyzing(false);
  };

  const reset = () => { setResult(null); setCapturedFile(null); setPreviewUrl(null); };

  if (isAnalyzing) return <AnalyzingScreen type="skincare" message="Analysing your skin..." />;

  if (result) {
    const scoreColor = SCORE_COLOR(result.overall_skin_score);
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={reset} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Face Analysis</h1>
        </div>

        <div className="px-5 space-y-4">
          {/* Score */}
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Skin Score</p>
                <p className="text-5xl font-extrabold mt-0.5" style={{ color: scoreColor }}>{result.overall_skin_score}</p>
                <p className="text-xs text-muted-foreground mt-1">{result.overall_summary}</p>
              </div>
              {result.image_url && (
                <img src={result.image_url} className="w-16 h-16 rounded-2xl object-cover" alt="" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Skin Type:</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-foreground">{result.skin_type}</span>
            </div>
          </div>

          {/* Food connection (appearance mode only) */}
          {isAppearanceMode && result.food_connection && (
            <div className="bg-purple-50 border border-purple-100 rounded-[20px] p-4">
              <p className="text-xs font-bold text-purple-700 mb-1">🍽️ Today's Food Connection</p>
              <p className="text-xs text-purple-600 leading-relaxed">{result.food_connection}</p>
            </div>
          )}

          {/* Priority actions */}
          {result.priority_actions?.length > 0 && (
            <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Priority Actions Today</p>
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

          {/* Detected concerns */}
          {result.detected_concerns?.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-foreground px-1">Detected Concerns ({result.detected_concerns.length})</p>
              {result.detected_concerns.map((c, i) => {
                const sc = SEV_COLORS[c.severity] || SEV_COLORS.Low;
                return (
                  <div key={i} className="bg-white border border-border rounded-[20px] p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{c.concern}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{c.severity}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Likely Cause</p>
                      <p className="text-xs text-muted-foreground">{c.likely_cause}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl px-3 py-2">
                      <p className="text-[10px] font-semibold text-green-700 mb-0.5">Fix</p>
                      <p className="text-xs text-green-700">{c.fix}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {result.detected_concerns?.length === 0 && (
            <div className="bg-green-50 border border-green-100 rounded-[20px] p-5 text-center">
              <p className="text-lg">🎉</p>
              <p className="text-sm font-bold text-green-700 mt-1">No significant concerns detected</p>
              <p className="text-xs text-green-600 mt-0.5">Your skin looks healthy!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={previewUrl} className="flex-1 w-full object-cover" alt="Selfie" />
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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="flex items-center justify-between px-5 pt-12">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Oval face frame */}
        <div className="relative mb-6" style={{ width: '55vw', height: '75vw', maxWidth: 220, maxHeight: 300 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 300" fill="none">
            <ellipse cx="110" cy="150" rx="105" ry="145" stroke="white" strokeWidth="3" strokeDasharray="12 8" />
          </svg>
          {/* Scan line */}
          <div className="absolute left-4 right-4 h-0.5 rounded-full overflow-hidden"
            style={{ top: `${scanLineAnim * 100}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
        </div>

        <p className="text-white/70 text-sm text-center px-4 mb-4">
          Take a front-facing selfie in natural lighting with no filters
        </p>

        <div className="flex items-start gap-2 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 w-full">
          <Lightbulb className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
          <p className="text-xs text-white/40">Best results in daylight, no makeup, neutral expression.</p>
        </div>

        {isAppearanceMode && (
          <div className="mt-3 flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-2xl px-4 py-2 w-full">
            <span className="text-xs">✨</span>
            <p className="text-xs text-purple-300">Appearance Mode active — today's food will be linked to your skin analysis.</p>
          </div>
        )}
      </div>

      <div className="pb-10 px-8">
        <div className="flex items-center justify-between px-4">
          <div className="w-11" />
          <button onClick={() => cameraRef.current?.click()} className="w-20 h-20 rounded-full bg-white border-4 border-white/30 active:scale-95 transition-transform shadow-lg" />
          <button onClick={() => uploadRef.current?.click()} className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white/40" />
          </button>
        </div>
      </div>
    </div>
  );
}