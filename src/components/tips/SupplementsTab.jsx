import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import UnsplashImage from './UnsplashImage';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { format, subDays } from 'date-fns';

const CATS = ['All', 'Protein', 'Creatine', 'Vitamins', 'Minerals', 'Pre-Workout', 'Recovery', 'Sleep', 'Focus'];
const CACHE_KEY = 'tips_supplements_v2';

function getCached(key) { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); return c[key] || null; } catch { return null; } }
function setCache(key, data) { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); c[key] = data; localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {} }

function IngredientPill({ name, amount }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #c8e6c9', cursor: 'pointer' }}>
        {name}{amount ? ` · ${amount}` : ''}
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="relative bg-white rounded-3xl p-6 w-full max-w-sm" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4 }}>{name}</p>
              {amount && <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Dose: {amount}</p>}
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>An active supplement ingredient. {amount ? `This product provides ${amount} per serving.` : ''} Always check with a healthcare provider before use.</p>
              <button onClick={() => setOpen(false)} style={{ marginTop: 16, width: '100%', padding: '10px', background: '#1a2e1a', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Got it</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const SHEET_TABS = ['Results', 'How To Take', 'Ingredients'];

function SupplementSheet({ product, userAllergens, onClose }) {
  const [activeTab, setActiveTab] = useState('Results');
  const score = product.goal_match_score || 0;
  const scoreColor = score >= 70 ? '#2e7d32' : score >= 40 ? '#e65100' : '#c62828';
  const allergenMatch = (userAllergens || []).filter(a =>
    (product.active_ingredients || []).some(i => (i.name || i).toLowerCase().includes(a.toLowerCase()))
  );

  const evidenceColor = (level) => level === 'Strong' ? '#2e7d32' : level === 'Moderate' ? '#e65100' : '#9BA3AF';

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: '#F2F4F8' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >
        {/* Hero image */}
        <div style={{ position: 'relative', height: 260 }}>
          <UnsplashImage query={`${product.brand} ${product.supplement_type} supplement`} fallbackEmoji="💊" height={260} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />
          <button onClick={onClose} className="absolute top-12 left-5 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 2 }}>{product.brand}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{product.product_name}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{product.supplement_type} · {product.price_range}</p>
          </div>
        </div>

        <div style={{ padding: '16px 20px 0', background: '#F2F4F8' }}>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{product.description}</p>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
            {SHEET_TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, paddingBottom: 12, fontSize: 13, fontWeight: activeTab === t ? 600 : 400, color: activeTab === t ? '#1a1a1a' : '#bbb', border: 'none', background: 'none', cursor: 'pointer', position: 'relative' }}>
                {t}
                {activeTab === t && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#1a1a1a', borderRadius: 2 }} />}
              </button>
            ))}
          </div>

          {activeTab === 'Results' && (
            <div style={{ paddingBottom: 100, background: '#F2F4F8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 14, color: '#6B7280' }}>Goal Match Score</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>{score}/100</span>
              </div>
              {allergenMatch.length > 0 && (
                <div style={{ margin: '12px 0', padding: 12, background: '#fdecea', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#c62828' }}>⚠️ Allergen Warning</p>
                  <p style={{ fontSize: 12, color: '#c62828', marginTop: 4 }}>May contain ingredients matching your allergens: {allergenMatch.join(', ')}</p>
                </div>
              )}
              {(product.positive_effects || []).length > 0 && (
                <div style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>✅ Benefits</p>
                  {product.positive_effects.map((e, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p style={{ fontSize: 13, color: '#374151', flex: 1 }}>• {typeof e === 'string' ? e : e.effect}</p>
                      {e.evidence && <span style={{ fontSize: 11, fontWeight: 700, color: evidenceColor(e.evidence), marginLeft: 8, flexShrink: 0 }}>{e.evidence}</span>}
                    </div>
                  ))}
                </div>
              )}
              {(product.contraindications || []).length > 0 && (
                <div style={{ padding: '12px 0' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#c62828', marginBottom: 8 }}>⚠️ Contraindications</p>
                  {product.contraindications.map((c, i) => <p key={i} style={{ fontSize: 13, color: '#c62828', marginBottom: 4 }}>• {c}</p>)}
                </div>
              )}
              <div style={{ padding: '12px 0', borderTop: '1px solid #f5f5f5' }}>
                <p style={{ fontSize: 13, color: '#6B7280' }}>Where to buy: <strong>{product.where_to_buy}</strong></p>
              </div>
            </div>
          )}

          {activeTab === 'How To Take' && (
            <div style={{ paddingBottom: 100 }}>
              {[
                { label: 'Timing', value: product.timing },
                { label: 'Method', value: product.method },
                { label: 'Cycling Protocol', value: product.cycling_protocol },
                { label: 'Stack With', value: product.stack_with, good: true },
                { label: 'Avoid Combining With', value: product.avoid_combining, warn: true },
                { label: 'Results Timeline', value: product.results_timeline },
              ].filter(x => x.value).map((item, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9BA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 14, color: item.warn ? '#c62828' : item.good ? '#2e7d32' : '#374151', fontWeight: (item.warn || item.good) ? 600 : 400 }}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Ingredients' && (
            <div style={{ paddingBottom: 100 }}>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Tap an ingredient to learn more</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(product.active_ingredients || []).map((ing, i) => (
                  <IngredientPill key={i} name={typeof ing === 'string' ? ing : ing.name} amount={ing.amount} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: '#fff', padding: '12px 20px 28px', borderTop: '1px solid #f0f0f0' }}>
          <a
            href={`https://www.iherb.com/search?kw=${encodeURIComponent(product.brand + ' ' + product.product_name)}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', background: '#1a2e1a', color: '#fff', borderRadius: 16, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            <ExternalLink className="w-4 h-4" /> Buy Now on iHerb
          </a>
        </div>
    </motion.div>
  );
}

export default function SupplementsTab({ profile }) {
  const [cat, setCat] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const cacheKey = `supp_${profile?.goal}_${profile?.activity_level}_${cat}`;

  useEffect(() => {
    if (!profile?.name) return;
    const cached = getCached(cacheKey);
    if (cached) { setProducts(cached); return; }
    generate();
  }, [cat, profile?.goal, profile?.activity_level]);

  const generate = async () => {
    setLoading(true);
    setProducts([]);
    try {
      // Fetch last 7 days of meals for nutritional gap analysis
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      let recentMeals = [];
      try {
        recentMeals = await base44.entities.Meal.filter({ logged: true });
        recentMeals = recentMeals.filter(m => m.date >= sevenDaysAgo);
      } catch {}

      const avgProtein = recentMeals.length > 0 ? Math.round(recentMeals.reduce((s, m) => s + (m.protein || 0), 0) / 7) : 0;
      const avgCalories = recentMeals.length > 0 ? Math.round(recentMeals.reduce((s, m) => s + (m.calories || 0), 0) / 7) : 0;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 12 real, purchasable supplement products personalised for this user in Finland:
- Goal: ${profile?.goal || 'maintain'}
- Diet mode: ${profile?.diet_mode || 'standard'}
- Age: ${profile?.age || 'unknown'}, Weight: ${profile?.weight || 'unknown'}kg
- Activity level: ${profile?.activity_level || 'moderately_active'}
- Allergens: ${(profile?.allergens || []).join(', ') || 'none'}
- Avg protein last 7 days: ${avgProtein}g/day (target: ${profile?.protein_target || 150}g)
- Avg calories last 7 days: ${avgCalories} kcal/day (target: ${profile?.calorie_target || 2000})
Category filter: ${cat === 'All' ? 'all supplement types' : cat}

Each must be a REAL supplement that actually exists from a real brand.
Do NOT include products containing the user's allergens.
Return JSON with products array, each with:
brand, product_name, supplement_type (${cat === 'All' ? 'Protein/Creatine/Vitamins/Minerals/Pre-Workout/Recovery/Sleep/Focus' : cat}), description (one line benefit), active_ingredients (array of objects with name and amount), price_range (euros), where_to_buy (e.g. "Life, iHerb, or Gymshark"), goal_match_score (0-100), positive_effects (array of objects with effect and evidence: "Strong"/"Moderate"/"Weak"), contraindications (array, can be empty), timing (e.g. "30 min before workout"), method (how to take), cycling_protocol (e.g. "Continuous" or "8 weeks on 4 off"), stack_with (e.g. "Pairs well with Magnesium"), avoid_combining (e.g. "Do not take with calcium"), results_timeline (e.g. "2-4 weeks for initial effects").`,
        response_json_schema: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  brand: { type: 'string' }, product_name: { type: 'string' }, supplement_type: { type: 'string' },
                  description: { type: 'string' }, active_ingredients: { type: 'array', items: { type: 'object' } },
                  price_range: { type: 'string' }, where_to_buy: { type: 'string' },
                  goal_match_score: { type: 'number' }, positive_effects: { type: 'array', items: { type: 'object' } },
                  contraindications: { type: 'array', items: { type: 'string' } },
                  timing: { type: 'string' }, method: { type: 'string' }, cycling_protocol: { type: 'string' },
                  stack_with: { type: 'string' }, avoid_combining: { type: 'string' }, results_timeline: { type: 'string' },
                }
              }
            }
          }
        }
      });
      const data = res?.products || [];
      setProducts(data);
      setCache(cacheKey, data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: cat === c ? '#1a2e1a' : '#fff',
            color: cat === c ? '#fff' : '#4a5568',
            fontSize: 13, fontWeight: 600, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>{c}</button>
        ))}
      </div>

      <div className="px-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{cat} Supplements</p>
          <button onClick={generate} style={{ fontSize: 12, color: '#1a2e1a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Refresh ↺</button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p style={{ fontSize: 14, color: '#6B7280' }}>Finding personalised supplements...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {products.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(p)}
                className="cursor-pointer active:scale-[0.97] transition-transform"
                style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <UnsplashImage query={`${p.supplement_type || 'supplement'} bottle`} fallbackEmoji="💊" height={140} />
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: 11, color: '#7b9bd1', fontWeight: 600, marginBottom: 2 }}>{p.brand}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4, lineHeight: 1.3 }}>{p.product_name}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{p.price_range}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: (p.goal_match_score || 0) >= 70 ? '#2e7d32' : '#e65100' }}>{p.goal_match_score}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <SupplementSheet product={selected} userAllergens={profile?.allergens || []} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}