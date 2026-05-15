import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Home, ScanLine, Leaf, Pill, Clock, Smile, PersonStanding, Search, Plus, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';

async function registerScan(type, productName, brand, imageUrl, safetyScore, qualityScore, verdict) {
  try {
    await base44.entities.ScanResult.create({
      type,
      date: format(new Date(), 'yyyy-MM-dd'),
      image_url: imageUrl || null,
      product_name: productName || 'Unknown',
      brand: brand || null,
      safety_score: safetyScore || null,
      quality_score: qualityScore || null,
      verdict: verdict || null,
    });
  } catch (_) {}
}

export { registerScan };

// ─── Scanner card gradients & icons ───────────────────────────────────────────
const CARD_CONFIGS = {
  food:         { bg: '#1c1c1e', border: 'rgba(255,255,255,0.18)', titleColor: '#ffffff', descColor: 'rgba(255,255,255,0.6)', title: 'Food Scanner',        description: 'Scan any food or barcode for full nutrition info',      path: '/food-scanner' },
  skincare:     { bg: '#e8e8ea', border: 'rgba(0,0,0,0.10)',       titleColor: '#1a1a1a', descColor: 'rgba(0,0,0,0.5)',       title: 'Skincare Analyzer',   description: 'Analyze ingredients in any cosmetic product',           path: '/skincare-scanner' },
  supplement:   { bg: '#ffffff', border: 'rgba(0,0,0,0.20)',       titleColor: '#1a1a1a', descColor: 'rgba(0,0,0,0.5)',       title: 'Supplement Scanner',  description: 'Check quality and dosage of any supplement',           path: '/supplement-scanner' },
  face:         { bg: '#1c1c1e', border: 'rgba(255,255,255,0.18)', titleColor: '#ffffff', descColor: 'rgba(255,255,255,0.6)', title: 'Face Analyser',       description: 'AI skin & facial analysis linked to your food intake', path: '/face-scanner' },
  body:         { bg: '#e8e8ea', border: 'rgba(0,0,0,0.10)',       titleColor: '#1a1a1a', descColor: 'rgba(0,0,0,0.5)',       title: 'Body Analyser',       description: 'Find the areas you need to work on most',              path: '/body-scanner' },
  exerciseform: { bg: '#1a1a1a', border: 'rgba(255,255,255,0.12)', titleColor: '#ffffff', descColor: 'rgba(255,255,255,0.6)', title: 'Form Analyzer',       description: 'Score your exercise form and get your #1 fix cue',     path: '/exercise-form-scanner' },
};

// ─── Food search ──────────────────────────────────────────────────────────────
function FoodSearch() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addedId, setAddedId] = useState(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Provide nutrition info for: "${query}". Return an array of 3 serving size options (e.g. 100g, 1 cup, 1 piece). For each: name (string, include query + serving size label), serving_label (e.g. "100g" / "1 cup"), calories, protein, carbs, fat, fiber, sugar, sodium. NEVER fail.`,
      response_json_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, serving_label: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }, fiber: { type: 'number' }, sugar: { type: 'number' }, sodium: { type: 'number' } } } } } },
    });
    setResults(res.items || []);
    setLoading(false);
  };

  const addMeal = async (item) => {
    await base44.entities.Meal.create({
      name: item.name,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'h:mm a'),
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      sugar: item.sugar,
      sodium: item.sodium,
      source: 'manual',
      logged: true,
    });
    queryClient.invalidateQueries({ queryKey: ['meals'] });
    queryClient.invalidateQueries({ queryKey: ['allMeals'] });
    setAddedId(item.name);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="px-5 mt-5 fade-in-up-2">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Forgot to log something?</p>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-border rounded-2xl px-3.5 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. hamburger, oats, salmon..."
            className="flex-1 text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground/60"
          />
          {query && <button onClick={() => { setQuery(''); setResults(null); }} className="text-muted-foreground/40 text-xs">✕</button>}
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="w-11 h-11 rounded-2xl bg-foreground flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Search className="w-4 h-4 text-white" />}
        </button>
      </div>

      {results && results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((item, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3 fade-in-up">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{query}</p>
                <p className="text-xs text-muted-foreground">{item.serving_label} · {item.calories} kcal · {item.protein}g prot · {item.carbs}g carbs</p>
              </div>
              <button
                onClick={() => addMeal(item)}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all"
                style={{ background: addedId === item.name ? '#dcfce7' : '#1a1a1a' }}
              >
                {addedId === item.name
                  ? <Check className="w-4 h-4 text-green-600" />
                  : <Plus className="w-4 h-4 text-white" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scanner card carousel ────────────────────────────────────────────────────
function ScannerCarousel({ cardKeys }) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);
  const trackRef = useRef(null);

  const CARD_W = 275;
  const CARD_GAP = 12;
  const PEEK = 20;

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40 && active < cardKeys.length - 1) setActive(a => a + 1);
    if (diff < -40 && active > 0) setActive(a => a - 1);
    touchStartX.current = null;
  };

  return (
    <div className="mt-5 fade-in-up-1">
      <div className="px-5 mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scanners</p>
        <div className="flex gap-1.5">
          {cardKeys.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="rounded-full transition-all"
              style={{ width: i === active ? 16 : 6, height: 6, background: i === active ? '#1a1a1a' : '#d1d5db' }}
            />
          ))}
        </div>
      </div>

      {/* Overflow visible so adjacent cards peek */}
      <div
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex transition-transform duration-300 ease-out"
          style={{
            paddingLeft: PEEK,
            paddingRight: PEEK,
            gap: CARD_GAP,
            transform: `translateX(calc(${PEEK}px - ${active} * (${CARD_W}px + ${CARD_GAP}px)))`,
          }}
        >
          {cardKeys.map((key, i) => {
            const c = CARD_CONFIGS[key];
            const isActive = i === active;
            return (
              <Link
                key={key}
                to={c.path}
                onClick={(e) => { if (!isActive) { e.preventDefault(); setActive(i); } }}
                className="shrink-0 rounded-[22px] overflow-hidden relative transition-all duration-300 active:scale-[0.97]"
                style={{
                  width: CARD_W,
                  height: 320,
                  background: c.bg,
                  border: `1.5px solid ${c.border}`,
                  boxShadow: isActive ? '0 8px 28px rgba(0,0,0,0.10)' : '0 2px 8px rgba(0,0,0,0.06)',
                  opacity: isActive ? 1 : 0.6,
                  transform: isActive ? 'scale(1)' : 'scale(0.94)',
                  borderRadius: 22,
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                }}
              >
                <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                  <div>
                    <p className="text-xl font-extrabold leading-tight" style={{ color: c.titleColor }}>{c.title}</p>
                    <p className="text-sm mt-1 leading-snug" style={{ color: c.descColor }}>{c.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Recent scans ─────────────────────────────────────────────────────────────
const typeLabels = { food: 'Food', skincare: 'Skincare', supplement: 'Supplement' };

const SCAN_PATHS = { food: '/food-scanner', skincare: '/skincare-scanner', supplement: '/supplement-scanner' };

function RecentScans() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const touchStartX = useRef(null);

  const { data: scans = [] } = useQuery({
    queryKey: ['scanResults'],
    queryFn: () => base44.entities.ScanResult.list('-created_date', 50),
  });

  const tabs = ['food', 'skincare', 'supplement'];
  const filtered = scans.filter(s => s.type === tabs[activeTab]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && activeTab < tabs.length - 1) setActiveTab(t => t + 1);
    if (diff < -50 && activeTab > 0) setActiveTab(t => t - 1);
    touchStartX.current = null;
  };

  const handleScanClick = (scan) => {
    const path = SCAN_PATHS[scan.type] || '/food-scanner';
    // Store full scan including result_data so verdict page can be shown directly
    sessionStorage.setItem('replayScan', JSON.stringify({ scan, fromHistory: true }));
    navigate(path + '?replay=1');
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.8)',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
  };

  return (
    <div className="mt-6 px-5 fade-in-up-4">
      <h2 className="text-sm font-bold text-foreground mb-3">Recent Scans</h2>
      <div className="flex gap-1 mb-3 rounded-2xl p-1"
        style={{
          background: 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: activeTab === i ? 'rgba(255,255,255,0.75)' : 'transparent',
              backdropFilter: activeTab === i ? 'blur(12px)' : 'none',
              WebkitBackdropFilter: activeTab === i ? 'blur(12px)' : 'none',
              color: activeTab === i ? '#1a1a1a' : 'hsl(var(--muted-foreground))',
              boxShadow: activeTab === i ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            }}>
            {typeLabels[t]}
          </button>
        ))}
      </div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {filtered.length === 0 ? (
          <div className="rounded-[20px] p-6 text-center" style={cardStyle}>
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No {typeLabels[tabs[activeTab]].toLowerCase()} scans yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 6).map(scan => {
              const score = scan.safety_score ?? scan.quality_score ?? null;
              const scoreColor = score === null ? '#aaa' : score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';
              return (
                <button
                  key={scan.id}
                  className="w-full rounded-[20px] p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                  style={cardStyle}
                  onClick={() => handleScanClick(scan)}
                >
                  {scan.image_url
                    ? <img src={scan.image_url} className="w-14 h-14 rounded-2xl object-cover shrink-0" alt="" />
                    : <div className="w-14 h-14 rounded-2xl bg-secondary shrink-0 flex items-center justify-center text-2xl">
                        {tabs[activeTab] === 'food' ? '🍽️' : tabs[activeTab] === 'skincare' ? '🧴' : '💊'}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{scan.product_name || 'Unknown'}</p>
                    {scan.brand && <p className="text-xs text-muted-foreground">{scan.brand}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(scan.created_date), 'MMM d, h:mm a')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {score !== null && (
                      <p className="text-xl font-extrabold" style={{ color: scoreColor }}>{score}</p>
                    )}
                    {scan.verdict && <p className="text-[10px] capitalize mt-0.5" style={{ color: scoreColor }}>{scan.verdict}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ScannerHub() {
  const navigate = useNavigate();

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles[0] || {};
  const isAppearanceMode = profile.diet_mode === 'appearance_mode';

  const cardKeys = isAppearanceMode
    ? ['food', 'skincare', 'supplement', 'face', 'body', 'exerciseform']
    : ['food', 'skincare', 'supplement', 'body', 'exerciseform'];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Home className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-lg font-bold text-foreground">Scanner</span>
        <div className="w-10" />
      </div>

      {/* Food search bar */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0 }}>
        <FoodSearch />
      </motion.div>

      {/* Scanner cards carousel */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}>
        <ScannerCarousel cardKeys={cardKeys} />
      </motion.div>

      {/* Recent scans */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}>
        <RecentScans />
      </motion.div>
    </div>
  );
}