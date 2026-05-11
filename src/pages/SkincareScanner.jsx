import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { X, HelpCircle, ImageIcon, Shield, XCircle, Lightbulb, Sparkles } from 'lucide-react';
import AnalyzingScreen from '../components/scanner/AnalyzingScreen';

const SAFETY_COLORS = {
  safe: { bg: '#dcfce7', text: '#16a34a', label: 'Safe' },
  caution: { bg: '#fef9c3', text: '#ca8a04', label: 'Caution' },
  avoid: { bg: '#fee2e2', text: '#dc2626', label: 'Avoid' },
};

export default function SkincareScanner() {
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);
  const [capturedFile, setCapturedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [scanLineAnim, setScanLineAnim] = useState(0);

  // Slow scan line — 4 seconds per cycle
  useEffect(() => {
    let start = null;
    let raf;
    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % 4000;
      setScanLineAnim(elapsed / 4000);
      raf = requestAnimationFrame(animate);
    };
    if (!capturedFile && !isAnalyzing) {
      raf = requestAnimationFrame(animate);
    }
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
    setPreviewUrl(null); // hide preview, show analyzing screen

    const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedFile });

    const { data: r } = await base44.functions.invoke('analyzeWithClaude', {
      image_url: file_url,
      prompt: `You are a cosmetic dermatologist and ingredient toxicologist. Analyze this skincare/cosmetic product image.

First identify the product, then read EVERY ingredient visible. Evaluate each for the appropriate product type (rinse-off vs leave-on).

Return JSON with: brand, product_name, product_type, safety_score (1-100), verdict ("recommended"/"use with caution"/"avoid"), verdict_reason, skin_type_suitability, eye_area_safe (boolean), pregnancy_safe (boolean), pregnancy_note, long_term_summary, top_beneficial (array of 3 strings), top_concerning (array of 3 strings), ingredients (array with: name, inci_name, skin_effect, safety_rating ("Safe"/"Caution"/"Avoid"), is_irritant, is_allergen, is_comedogenic, comedogenic_rating 0-5, is_hormone_disruptor, hormone_concern, has_fragrance, is_drying_alcohol, is_active_beneficial). NEVER fail.`,
      response_json_schema: { type: 'object', properties: { brand: { type: 'string' }, product_name: { type: 'string' }, product_type: { type: 'string' }, safety_score: { type: 'number' }, verdict: { type: 'string' }, verdict_reason: { type: 'string' }, skin_type_suitability: { type: 'string' }, eye_area_safe: { type: 'boolean' }, pregnancy_safe: { type: 'boolean' }, pregnancy_note: { type: 'string' }, long_term_summary: { type: 'string' }, top_beneficial: { type: 'array', items: { type: 'string' } }, top_concerning: { type: 'array', items: { type: 'string' } }, ingredients: { type: 'array', items: { type: 'object' } } } },
    });
    const res = r.result;
    setResult(res);
    base44.entities.ScanResult.create({
      type: 'skincare',
      date: new Date().toISOString().split('T')[0],
      image_url: file_url,
      product_name: res.product_name,
      brand: res.brand || null,
      safety_score: res.safety_score || null,
      verdict: res.verdict || null,
    }).catch(() => {});
    setIsAnalyzing(false);
  };

  // Analyzing screen
  if (isAnalyzing) {
    return <AnalyzingScreen type="skincare" message="Reading ingredients & analysing safety..." />;
  }

  // Results
  if (result) {
    const sc = result.safety_score >= 70 ? '#16a34a' : result.safety_score >= 40 ? '#ca8a04' : '#dc2626';
    const verdictStyle = result.verdict === 'recommended'
      ? { bg: '#dcfce7', color: '#16a34a', icon: Shield, label: 'Recommended' }
      : result.verdict === 'use with caution'
        ? { bg: '#fef9c3', color: '#ca8a04', icon: Shield, label: 'Use With Caution' }
        : { bg: '#fee2e2', color: '#dc2626', icon: XCircle, label: 'Avoid' };
    const VIcon = verdictStyle.icon;
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4">
          <button onClick={() => { setResult(null); setCapturedFile(null); setPreviewUrl(null); }}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Skincare Analysis</h1>
        </div>
        <div className="px-5 space-y-4 pb-16">
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">{result.brand} · {result.product_type}</p>
                <h2 className="text-lg font-bold text-foreground mt-0.5">{result.product_name}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Safety Score</p>
                <p className="text-3xl font-extrabold" style={{ color: sc }}>{result.safety_score}</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: verdictStyle.bg, color: verdictStyle.color }}>
              <VIcon className="w-4 h-4" />{verdictStyle.label}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{result.verdict_reason}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Skin Type', value: result.skin_type_suitability || '—' },
              { label: 'Eye Area Safe', value: result.eye_area_safe ? '✓ Yes' : '✗ No', color: result.eye_area_safe ? '#16a34a' : '#dc2626' },
              { label: 'Pregnancy Safe', value: result.pregnancy_safe ? '✓ Yes' : '✗ No', color: result.pregnancy_safe ? '#16a34a' : '#dc2626' },
              { label: 'Ingredients', value: `${result.ingredients?.length || 0} analyzed` },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-border rounded-[20px] p-3 shadow-sm">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-xs font-bold mt-0.5" style={{ color: color || 'hsl(var(--foreground))' }}>{value}</p>
              </div>
            ))}
          </div>
          {(result.top_beneficial?.length > 0 || result.top_concerning?.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {result.top_beneficial?.length > 0 && (
                <div className="bg-green-50 border border-green-100 rounded-[20px] p-4">
                  <p className="text-xs font-bold text-green-700 mb-2">✓ Top Beneficial</p>
                  {result.top_beneficial.map(b => <p key={b} className="text-[10px] text-green-600 mb-0.5">• {b}</p>)}
                </div>
              )}
              {result.top_concerning?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-[20px] p-4">
                  <p className="text-xs font-bold text-red-700 mb-2">⚠ Top Concerns</p>
                  {result.top_concerning.map(c => <p key={c} className="text-[10px] text-red-600 mb-0.5">• {c}</p>)}
                </div>
              )}
            </div>
          )}
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-2">Long-term Effects</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.long_term_summary}</p>
          </div>
          <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Full Ingredient List ({result.ingredients?.length || 0})</h3>
            <div className="space-y-3">
              {(result.ingredients || []).map((ing, i) => {
                const s = SAFETY_COLORS[(ing.safety_rating || '').toLowerCase()] || SAFETY_COLORS.safe;
                const flags = [
                  ing.is_irritant && 'Irritant', ing.is_allergen && 'Allergen',
                  ing.is_comedogenic && `Comedogenic ${ing.comedogenic_rating > 0 ? `(${ing.comedogenic_rating}/5)` : ''}`,
                  ing.is_hormone_disruptor && `Hormone Disruptor${ing.hormone_concern ? `: ${ing.hormone_concern}` : ''}`,
                  ing.has_fragrance && 'Fragrance', ing.is_drying_alcohol && 'Drying Alcohol',
                  ing.is_active_beneficial && '✓ Active Ingredient',
                ].filter(Boolean);
                return (
                  <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{ing.name}</p>
                        {ing.inci_name && ing.inci_name !== ing.name && <p className="text-[9px] text-muted-foreground/60">{ing.inci_name}</p>}
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.text }}>{s.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{ing.skin_effect}</p>
                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {flags.map(f => (
                          <span key={f} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: f.includes('✓') ? '#dcfce7' : f.includes('Hormone') || f.includes('Drying') ? '#fee2e2' : '#f3f4f6', color: f.includes('✓') ? '#16a34a' : f.includes('Hormone') || f.includes('Drying') ? '#dc2626' : '#555' }}>{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Photo preview screen
  if (previewUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <img src={previewUrl} className="flex-1 w-full object-cover" alt="Captured" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
          <button onClick={() => { setCapturedFile(null); setPreviewUrl(null); }}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="w-8 h-1 rounded-full bg-white/40" />
          <button className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-3">
          <button onClick={analyse}
            className="w-full h-14 rounded-full bg-white text-gray-900 font-semibold text-base flex items-center justify-center gap-2 shadow-lg">
            <Sparkles className="w-5 h-5" />
            Analyse
          </button>
          <button onClick={() => { setCapturedFile(null); setPreviewUrl(null); }}
            className="text-white/70 text-sm font-medium">
            Retake photo
          </button>
        </div>
      </div>
    );
  }

  // Camera UI — black background
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
        <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Tall rectangular frame — white corners */}
        <div className="relative mb-5" style={{ width: '65vw', aspectRatio: '3/4' }}>
          {[
            'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl',
            'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl',
            'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl',
            'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-10 h-10 border-white ${cls}`} />
          ))}
          {/* Scan line — white, slow */}
          <div
            className="absolute left-2 right-2 h-0.5 rounded-full"
            style={{
              top: `${scanLineAnim * 100}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
            }}
          />
        </div>

        <p className="text-white/50 text-sm text-center px-4 mb-4">
          Photograph the ingredient list on any skincare or cosmetic product
        </p>

        {/* Tip card */}
        <div className="flex items-start gap-2 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 w-full">
          <Lightbulb className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
          <p className="text-xs text-white/40">Tip — make sure all ingredients text is visible and in focus for best results.</p>
        </div>
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