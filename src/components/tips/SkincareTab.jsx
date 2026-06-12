import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnsplashImage from './UnsplashImage';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { invokeLLM } from '@/lib/ai';

const CATS = ['All', 'Cleanser', 'Moisturiser', 'Serum', 'SPF', 'Eye Cream', 'Toner', 'Treatment'];
const CACHE_KEY = 'tips_skincare_v2';

function getCached(key) { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); return c[key] || null; } catch { return null; } }
function setCache(key, data) { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); c[key] = data; localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {} }

function IngredientPill({ name }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #c8e6c9', cursor: 'pointer' }}>
        {name}
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="relative bg-white rounded-3xl p-6 w-full max-w-sm" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>{name}</p>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>A key skincare ingredient known for its beneficial properties in maintaining and improving skin health.</p>
              <button onClick={() => setOpen(false)} style={{ marginTop: 16, width: '100%', padding: '10px', background: '#1a2e1a', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Got it</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const SHEET_TABS = ['Results', 'How To Use', 'Ingredients'];

function ProductSheet({ product, userAllergens, onClose }) {
  const [activeTab, setActiveTab] = useState('Results');
  const score = product.compatibility_score || 0;
  const scoreColor = score >= 70 ? '#2e7d32' : score >= 40 ? '#e65100' : '#c62828';
  const allergenMatch = (userAllergens || []).filter(a =>
    (product.key_ingredients || []).some(i => i.toLowerCase().includes(a.toLowerCase()))
  );

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
          <UnsplashImage query={`${product.brand} ${product.product_name} skincare`} fallbackEmoji="✨" height={260} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />
          <button onClick={onClose} className="absolute top-12 left-5 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 2 }}>{product.brand}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{product.product_name}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{product.product_type} · {product.price_range}</p>
          </div>
        </div>

        <div style={{ padding: '16px 20px 0' }}>
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

          {/* Results tab */}
          {activeTab === 'Results' && (
            <div style={{ paddingBottom: 100 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 14, color: '#6B7280' }}>Compatibility Score</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>{score}/100</span>
              </div>
              {allergenMatch.length > 0 && (
                <div style={{ margin: '12px 0', padding: 12, background: '#fdecea', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#c62828' }}>⚠️ Allergen Warning</p>
                  <p style={{ fontSize: 12, color: '#c62828', marginTop: 4 }}>Contains ingredients matching your allergens: {allergenMatch.join(', ')}</p>
                </div>
              )}
              <div style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>✅ Benefits</p>
                {(product.positive_effects || []).map((e, i) => <p key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 4 }}>• {e}</p>)}
              </div>
              {(product.warnings || []).length > 0 && (
                <div style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#c62828', marginBottom: 8 }}>⚠️ Warnings</p>
                  {product.warnings.map((w, i) => <p key={i} style={{ fontSize: 13, color: '#c62828', lineHeight: 1.5, marginBottom: 4 }}>• {w}</p>)}
                </div>
              )}
              <div style={{ padding: '12px 0' }}>
                <p style={{ fontSize: 13, color: '#6B7280' }}>Skin type: <strong>{product.skin_type}</strong></p>
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Where to buy: <strong>{product.where_to_buy}</strong></p>
              </div>
            </div>
          )}

          {/* How To Use tab */}
          {activeTab === 'How To Use' && (
            <div style={{ paddingBottom: 100 }}>
              {[
                { label: 'Routine Timing', value: product.routine_timing },
                { label: 'Frequency', value: product.frequency },
                { label: 'Routine Order', value: product.routine_order },
                { label: "Don't Mix With", value: product.do_not_mix, warn: true },
              ].filter(x => x.value).map((item, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9BA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 14, color: item.warn ? '#c62828' : '#374151', fontWeight: item.warn ? 600 : 400 }}>{item.value}</p>
                </div>
              ))}
              {product.application_steps?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Application Steps</p>
                  {product.application_steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1a2e1a', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ingredients tab */}
          {activeTab === 'Ingredients' && (
            <div style={{ paddingBottom: 100 }}>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Tap an ingredient to learn more</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(product.key_ingredients || []).map((ing, i) => <IngredientPill key={i} name={ing} />)}
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom */}
        <div style={{ position: 'sticky', bottom: 0, background: '#fff', padding: '12px 20px 28px', borderTop: '1px solid #f0f0f0' }}>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(product.brand + ' ' + product.product_name + ' buy')}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', background: '#1a2e1a', color: '#fff', borderRadius: 16, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            <ExternalLink className="w-4 h-4" /> Where to Buy
          </a>
        </div>
    </motion.div>
  );
}

export default function SkincareTab({ profile }) {
  const [cat, setCat] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const cacheKey = `skincare_${profile?.age}_${profile?.diet_mode}_${cat}`;

  useEffect(() => {
    if (!profile?.name) return;
    const cached = getCached(cacheKey);
    if (cached) { setProducts(cached); return; }
    generate();
  }, [cat, profile?.age, profile?.diet_mode]);

  const generate = async () => {
    setLoading(true);
    setProducts([]);
    try {
      const res = await invokeLLM({
        prompt: `Generate 12 real, purchasable skincare products personalised for this user:
- Age: ${profile?.age || 'unknown'}
- Diet mode: ${profile?.diet_mode || 'standard'}
- Allergens: ${(profile?.allergens || []).join(', ') || 'none'}
- Goal: ${profile?.goal || 'maintain'}
Category filter: ${cat === 'All' ? 'all categories' : cat}

Each product must be a REAL product that actually exists from a real brand.
Return JSON with products array, each with:
brand, product_name, product_type (${cat === 'All' ? 'Cleanser/Moisturiser/Serum/SPF/Eye Cream/Toner/Treatment' : cat}), description (one line), key_ingredients (array of 5-8 real ingredient names), skin_type, price_range (in euros), where_to_buy (e.g. "Kicks, Lyko, or iHerb"), compatibility_score (0-100 based on user profile), positive_effects (array of 3 strings), warnings (array, can be empty), routine_timing (e.g. "Morning and evening"), frequency (e.g. "Daily"), routine_order (e.g. "Step 3 of 5: after toner, before moisturiser"), do_not_mix (e.g. "Avoid with retinol on same night"), application_steps (array of 3-4 steps).
Do not include products containing the user's allergens.`,
        response_json_schema: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  brand: { type: 'string' }, product_name: { type: 'string' }, product_type: { type: 'string' },
                  description: { type: 'string' }, key_ingredients: { type: 'array', items: { type: 'string' } },
                  skin_type: { type: 'string' }, price_range: { type: 'string' }, where_to_buy: { type: 'string' },
                  compatibility_score: { type: 'number' }, positive_effects: { type: 'array', items: { type: 'string' } },
                  warnings: { type: 'array', items: { type: 'string' } }, routine_timing: { type: 'string' },
                  frequency: { type: 'string' }, routine_order: { type: 'string' }, do_not_mix: { type: 'string' },
                  application_steps: { type: 'array', items: { type: 'string' } },
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
      {/* Category pills */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
            border: cat === c ? '1px solid #1a2e1a' : '1px solid rgba(0, 0, 0, 0.13)',
            background: cat === c ? '#1a2e1a' : '#fff',
            color: cat === c ? '#fff' : '#4a5568',
            fontSize: 13, fontWeight: 600, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>{c}</button>
        ))}
      </div>

      <div className="px-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{cat} Products</p>
          <button onClick={generate} style={{ fontSize: 12, color: '#1a2e1a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Refresh ↺</button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p style={{ fontSize: 14, color: '#6B7280' }}>Finding personalised products...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {products.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(p)}
                className="cursor-pointer active:scale-[0.97] transition-transform"
                style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.13)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <UnsplashImage query={`${p.brand} ${p.product_type} skincare`} fallbackEmoji="✨" height={140} />
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: 11, color: '#7b9bd1', fontWeight: 600, marginBottom: 2 }}>{p.brand}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4, lineHeight: 1.3 }}>{p.product_name}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{p.price_range}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: (p.compatibility_score || 0) >= 70 ? '#2e7d32' : '#e65100' }}>{p.compatibility_score}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <ProductSheet product={selected} userAllergens={profile?.allergens || []} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}