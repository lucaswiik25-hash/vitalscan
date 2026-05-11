import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, ScanLine, Leaf, Pill, Clock, Smile, PersonStanding, Search, Plus, Loader2, Check } from 'lucide-react';
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
  food: { gradient: ['#FF8C42', '#FF4F6E'], emoji: '🥩', title: 'Food Scanner', description: 'Scan any food or barcode for full nutrition info', path: '/food-scanner' },
  skincare: { gradient: ['#C084FC', '#EC4899'], emoji: '🧴', title: 'Skincare Analyzer', description: 'Analyze ingredients in any cosmetic product', path: '/skincare-scanner' },
  supplement: { gradient: ['#38BDF8', '#818CF8'], emoji: '💊', title: 'Supplement Scanner', description: 'Check quality and dosage of any supplement', path: '/supplement-scanner' },
  face: { gradient: ['#D946EF', '#F97316'], emoji: '🪞', title: 'Face Analyser', description: 'AI skin & facial analysis linked to your food intake', path: '/face-scanner' },
  body: { gradient: ['#10B981', '#0EA5E9'], emoji: '🏃', title: 'Body Analyser', description: 'Find the areas you need to work on most', path: '/body-scanner' },
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

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40 && active < cardKeys.length - 1) setActive(a => a + 1);
    if (diff < -40 && active > 0) setActive(a => a - 1);
    touchStartX.current = null;
  };

  const card = CARD_CONFIGS[cardKeys[active]];

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

      <div
        className="px-5"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Link to={card.path} key={cardKeys[active]}
          className="block rounded-[28px] p-6 shadow-lg active:scale-[0.98] transition-transform overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${card.gradient[0]}, ${card.gradient[1]})`, minHeight: 180 }}
        >
          {/* Big background emoji */}
          <div className="absolute right-4 bottom-2 text-[90px] opacity-20 select-none pointer-events-none leading-none">
            {card.emoji}
          </div>
          <div className="relative z-10">
            <span className="text-4xl">{card.emoji}</span>
            <h3 className="text-2xl font-extrabold text-white mt-3 leading-tight">{card.title}</h3>
            <p className="text-sm text-white/75 mt-1 leading-snug max-w-[70%]">{card.description}</p>
            <div className="mt-5 inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-full px-4 py-1.5">
              <span className="text-xs font-bold text-white">Open Scanner</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Adjacent card previews */}
      <div className="px-5 mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {cardKeys.map((key, i) => {
          if (i === active) return null;
          const c = CARD_CONFIGS[key];
          return (
            <button key={key} onClick={() => setActive(i)}
              className="shrink-0 flex items-center gap-2.5 rounded-2xl px-4 py-3 border border-border bg-white shadow-sm active:scale-95 transition-transform"
            >
              <span className="text-xl">{c.emoji}</span>
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">{c.title.replace(' Scanner', '').replace(' Analyzer', '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent scans ─────────────────────────────────────────────────────────────
const typeLabels = { food: 'Food', skincare: 'Skincare', supplement: 'Supplement' };

function RecentScans() {
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

  return (
    <div className="mt-6 px-5 fade-in-up-4">
      <h2 className="text-sm font-bold text-foreground mb-3">Recent Scans</h2>
      <div className="flex gap-1 mb-3 bg-secondary rounded-2xl p-1">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: activeTab === i ? 'white' : 'transparent', color: activeTab === i ? '#1a1a1a' : 'hsl(var(--muted-foreground))' }}>
            {typeLabels[t]}
          </button>
        ))}
      </div>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-[20px] p-6 text-center shadow-sm">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No {typeLabels[tabs[activeTab]].toLowerCase()} scans yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 6).map(scan => (
              <div key={scan.id} className="bg-white border border-border rounded-[20px] p-4 shadow-sm flex items-center gap-3">
                {scan.image_url
                  ? <img src={scan.image_url} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                  : <div className="w-12 h-12 rounded-xl bg-secondary shrink-0 flex items-center justify-center text-xl">
                      {tabs[activeTab] === 'food' ? '🍽️' : tabs[activeTab] === 'skincare' ? '🧴' : '💊'}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{scan.product_name || 'Unknown'}</p>
                  {scan.brand && <p className="text-xs text-muted-foreground">{scan.brand}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(scan.created_date), 'MMM d, h:mm a')}</p>
                </div>
                <div className="text-right shrink-0">
                  {scan.safety_score != null && (
                    <p className="text-sm font-bold" style={{ color: scan.safety_score >= 70 ? '#16a34a' : scan.safety_score >= 40 ? '#ca8a04' : '#dc2626' }}>
                      {scan.safety_score}
                    </p>
                  )}
                  {scan.verdict && <p className="text-[10px] text-muted-foreground capitalize">{scan.verdict}</p>}
                </div>
              </div>
            ))}
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
    ? ['food', 'skincare', 'supplement', 'face', 'body']
    : ['food', 'skincare', 'supplement', 'body'];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2 fade-in-up">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-lg font-bold text-foreground">Scanner</span>
        <div className="w-10" />
      </div>

      {/* Food search bar */}
      <FoodSearch />

      {/* Scanner cards carousel */}
      <ScannerCarousel cardKeys={cardKeys} />

      {/* Recent scans */}
      <RecentScans />
    </div>
  );
}