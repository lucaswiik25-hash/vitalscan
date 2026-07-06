import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Home, Search, Plus, Loader2, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useUserProfile } from '../hooks/useUserProfile';
import { animCard, usePageVisible } from '@/lib/animHelpers';
import { createFoodLog, listScanHistory, createScanHistory } from '@/lib/db';
import { invokeLLM } from '@/lib/ai';
import { motion } from 'framer-motion';

async function registerScan(type, productName, brand, imageUrl, safetyScore, qualityScore, verdict) {
  try {
    await createScanHistory({
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

const SCAN_PATHS = { food: '/food-scanner', skincare: '/skincare-scanner', supplement: '/supplement-scanner' };
const typeLabels = { food: 'Food', skincare: 'Skincare', supplement: 'Supplement' };

const SCANNER_TITLES = {
  food: 'Nutrition',
  skincare: 'Skincare',
  supplement: 'Supplement',
};

const SCANNER_ROUTES = {
  food: '/food-scanner',
  skincare: '/skincare-scanner',
  supplement: '/supplement-scanner',
};

// Food search (kept from original ScannerHub)
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
    try {
      const res = await invokeLLM({
        prompt: `Provide nutrition info for: "${query}". Return an array of 3 serving size options (e.g. 100g, 1 cup, 1 piece). For each: name (string, include query + serving size label), serving_label (e.g. "100g" / "1 cup"), calories, protein, carbs, fat, fiber, sugar, sodium. NEVER fail.`,
        response_json_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, serving_label: { type: 'string' }, calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' }, fiber: { type: 'number' }, sugar: { type: 'number' }, sodium: { type: 'number' } } } } } },
      });
      setResults(res.items || []);
    } catch (_) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addMeal = async (item) => {
    await createFoodLog({
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
    <div className="px-5 mt-4">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Quick food log</p>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white/70 backdrop-blur border border-white/60 rounded-2xl px-3.5 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="e.g. oats, salmon, burger..."
            inputMode="search"
            className="flex-1 text-sm focus:outline-none bg-transparent text-zinc-900 placeholder:text-zinc-400"
          />
          {query && <button onClick={() => { setQuery(''); setResults(null); }} className="text-zinc-400 text-xs">✕</button>}
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Search className="w-4 h-4 text-white" />}
        </button>
      </div>
      {results && results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((item, i) => (
            <div key={i} className="bg-white/80 backdrop-blur rounded-2xl p-4 flex items-center gap-3 border border-white/60 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{query}</p>
                <p className="text-xs text-zinc-500">{item.serving_label} · {item.calories} kcal · {item.protein}g prot</p>
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

// Recent scans section
function RecentScans() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('food');
  const touchStartX = useRef(null);

  const { data: scans = [] } = useQuery({
    queryKey: ['scanResults'],
    queryFn: () => listScanHistory({}, { sort: '-created_at', limit: 50 }),
  });

  const tabs = ['food', 'skincare', 'supplement'];
  const filtered = scans.filter(s => s.type === activeTab);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const idx = tabs.indexOf(activeTab);
    if (diff > 50 && idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
    if (diff < -50 && idx > 0) setActiveTab(tabs[idx - 1]);
    touchStartX.current = null;
  };

  const handleScanClick = (scan) => {
    const path = SCAN_PATHS[scan.type] || '/food-scanner';
    sessionStorage.setItem('replayScan', JSON.stringify({ scan, fromHistory: true }));
    navigate(path + '?replay=1');
  };

  return (
    <div className="px-5 mt-5" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <p className="text-[22px] font-[590] tracking-tight text-zinc-900 mb-3">Recent</p>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100/80 backdrop-blur rounded-full p-1 mb-3">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: activeTab === t ? 'white' : 'transparent',
              color: activeTab === t ? '#111' : '#6b7280',
              boxShadow: activeTab === t ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            }}>
            {typeLabels[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/70 backdrop-blur rounded-[20px] p-6 text-center border border-white/60">
          <Clock className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No {typeLabels[activeTab].toLowerCase()} scans yet</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          {filtered.slice(0, 4).map((scan, i) => {
            const score = scan.safety_score ?? scan.quality_score ?? null;
            const scoreColor = score === null ? '#aaa' : score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626';
            const widthPct = 100 - i * 5;
            const opacity = 1 - i * 0.12;
            return (
              <motion.button
                key={scan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleScanClick(scan)}
                className="relative flex items-center justify-between px-4 h-[70px] cursor-pointer active:scale-[0.98] transition-transform"
                style={{ width: `${widthPct}%` }}
              >
                <div className="absolute inset-0 bg-white rounded-[200px] opacity-[0.74] z-0 shadow-sm" />
                <div className="relative z-10 flex items-center gap-3">
                  {scan.image_url
                    ? <img src={scan.image_url} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt="" />
                    : <div className="w-12 h-12 rounded-2xl bg-zinc-100 shrink-0 flex items-center justify-center text-xl">
                        {activeTab === 'food' ? '🍽️' : activeTab === 'skincare' ? '🧴' : '💊'}
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-[15px] font-[590] text-zinc-800 truncate">{scan.product_name || 'Unknown'}</p>
                    {scan.brand && <p className="text-xs text-zinc-500">{scan.brand}</p>}
                  </div>
                </div>
                {score !== null && (
                  <p className="relative z-10 text-[28px] font-[590] tracking-tight mr-2" style={{ color: scoreColor }}>{score}</p>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Hero scanner card
function ScannerHero({ activeScanner, onScannerChange }) {
  const navigate = useNavigate();
  const scanners = ['food', 'skincare', 'supplement'];
  const title = SCANNER_TITLES[activeScanner];
  const touchStartX = useRef(null);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const idx = scanners.indexOf(activeScanner);
    if (diff > 50 && idx < scanners.length - 1) onScannerChange(scanners[idx + 1]);
    if (diff < -50 && idx > 0) onScannerChange(scanners[idx - 1]);
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ borderRadius: '0 0 44px 44px', minHeight: 340 }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background: dark blurred gradient */}
      <div className="absolute inset-0 z-0" style={{
        background: 'linear-gradient(160deg, #2a2a3a 0%, #1a1a2e 40%, #3a2a4a 100%)',
      }} />

      {/* Coconut water bottle image — behind glass card */}
      <div className="absolute inset-0 z-[1] flex items-end justify-center overflow-hidden">
        <img
          src="https://media.base44.com/images/public/69fd7fe9e1c61305baf8f1b9/fa53f96a8_generated_image.png"
          alt="Product"
          className="object-contain w-[65%] max-w-[240px]"
          style={{ marginBottom: -20, opacity: 0.92 }}
        />
      </div>

      {/* Liquid glass frosted card — full width, stops just above Analyse button area */}
      <div
        className="absolute z-[2]"
        style={{
          left: 0,
          right: 0,
          top: 0,
          bottom: 80, // stops above the Analyse button
          background: 'rgba(180,185,220,0.22)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: '0 0 36px 36px',
        }}
      />

      {/* Content above glass — texts & back button */}
      <div className="relative z-[10] pt-8 px-5">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="w-[42px] h-[42px] flex items-center justify-center rounded-full mb-3"
          style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M7 1L1 7L7 13M1 7H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Title */}
        <div className="mt-1">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[clamp(52px,16vw,80px)] font-[590] leading-[1.05] tracking-[-0.02em] text-white"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
          >
            {title}
          </motion.h1>
          <p className="text-[clamp(26px,8vw,40px)] font-[590] tracking-[-0.015em] text-white/90 leading-tight"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            Scanner
          </p>
        </div>
      </div>

      {/* Analyse button — above glass layer */}
      <div className="relative z-[10] px-5 pb-6 mt-2">
        <button
          onClick={() => navigate(SCANNER_ROUTES[activeScanner])}
          className="w-full h-[54px] rounded-full flex items-center justify-center font-[590] text-[18px] tracking-[-0.01em] text-zinc-900 active:scale-[0.98] transition-transform"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 40px rgba(60,60,180,0.3)',
          }}
        >
          Analyse
        </button>
      </div>

      {/* Pagination dots */}
      <div className="relative z-[10] flex justify-center gap-1.5 pb-4">
        {scanners.map((s, i) => (
          <button key={s} onClick={() => onScannerChange(s)}
            className="rounded-full transition-all"
            style={{
              width: activeScanner === s ? 20 : 8,
              height: 8,
              background: 'rgba(0,0,0,0.55)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ScannerHub() {
  const [activeScanner, setActiveScanner] = useState('food');
  const pageVisible = usePageVisible();
  const { profile } = useUserProfile();

  return (
    <div className="min-h-screen pb-28 overflow-y-auto font-[Inter,ui-sans-serif,system-ui,-apple-system,sans-serif]">
      {/* Hero scanner area */}
      <ScannerHero activeScanner={activeScanner} onScannerChange={setActiveScanner} />

      {/* Food search */}
      <div {...animCard(1, pageVisible)}>
        <FoodSearch />
      </div>

      {/* Recent scans */}
      <div {...animCard(2, pageVisible)}>
        <RecentScans />
      </div>
    </div>
  );
}