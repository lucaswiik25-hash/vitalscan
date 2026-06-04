import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { key: 'recipes', label: 'Recipes', emoji: '🍽️' },
  { key: 'skincare', label: 'Skincare', emoji: '✨' },
  { key: 'supplements', label: 'Supplements', emoji: '💊' },
];

const RECIPES = [
  { id: 'r1', name: 'Morning Pancakes', emoji: '🥞', desc: 'Fluffy pancakes with berries and maple syrup.', tags: ['1h', 'Easy', '300 kcal'], cat: 'breakfast', ingredients: ['Flour', 'Eggs', 'Milk', 'Baking powder', 'Maple syrup'], instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Cook on griddle', 'Serve with syrup'], macros: { calories: 300, protein: 8, carbs: 45, fat: 10 } },
  { id: 'r2', name: 'Fresh Tofu Salad', emoji: '🥗', desc: 'Crispy tofu with sesame-ginger dressing.', tags: ['1h', 'Medium', '470 kcal'], cat: 'lunch', ingredients: ['Tofu', 'Mixed greens', 'Cucumber', 'Carrot', 'Sesame dressing'], instructions: ['Press tofu', 'Chop vegetables', 'Pan-fry tofu', 'Toss with dressing'], macros: { calories: 470, protein: 22, carbs: 28, fat: 32 } },
  { id: 'r3', name: 'Grilled Salmon Bowl', emoji: '🍣', desc: 'Omega-rich salmon with quinoa and avocado.', tags: ['45min', 'Medium', '520 kcal'], cat: 'dinner', ingredients: ['Salmon', 'Quinoa', 'Avocado', 'Lemon', 'Herbs'], instructions: ['Cook quinoa', 'Season salmon', 'Grill salmon', 'Assemble bowl'], macros: { calories: 520, protein: 35, carbs: 42, fat: 24 } },
  { id: 'r4', name: 'Protein Smoothie', emoji: '🥤', desc: 'Banana, peanut butter and protein powder.', tags: ['5min', 'Easy', '380 kcal'], cat: 'snack', ingredients: ['Banana', 'Protein powder', 'Peanut butter', 'Oat milk', 'Ice'], instructions: ['Add all to blender', 'Blend until smooth', 'Pour and enjoy'], macros: { calories: 380, protein: 30, carbs: 38, fat: 14 } },
  { id: 'r5', name: 'Chicken Stir-Fry', emoji: '🍜', desc: 'Lean chicken with colorful vegetables.', tags: ['20min', 'Easy', '420 kcal'], cat: 'dinner', ingredients: ['Chicken breast', 'Broccoli', 'Bell peppers', 'Soy sauce', 'Ginger'], instructions: ['Slice chicken', 'Chop vegetables', 'Stir-fry chicken', 'Add sauce and veggies'], macros: { calories: 420, protein: 40, carbs: 25, fat: 18 } },
  { id: 'r6', name: 'Greek Yogurt Parfait', emoji: '🍨', desc: 'Layered yogurt with granola and berries.', tags: ['10min', 'Easy', '280 kcal'], cat: 'breakfast', ingredients: ['Greek yogurt', 'Granola', 'Mixed berries', 'Honey', 'Chia seeds'], instructions: ['Layer yogurt', 'Add granola', 'Top with berries', 'Drizzle honey'], macros: { calories: 280, protein: 18, carbs: 35, fat: 8 } },
];

const SKINCARE = [
  { id: 's1', name: 'Sodium & Puffiness', emoji: '🧂', desc: 'High sodium leads to water retention and morning puffiness.', tags: ['Diet Impact', 'Hydration'], detail: 'When you consume excess sodium, your body holds onto water to maintain balance. This often shows up as puffiness around the eyes and face. To reduce: drink extra water, use a cold jade roller, and apply caffeine eye cream.' },
  { id: 's2', name: 'Sugar & Glycation', emoji: '🍭', desc: 'High sugar triggers glycation, inflammation and acne.', tags: ['Diet Impact', 'Anti-Aging'], detail: 'Sugar molecules attach to collagen fibers causing glycation, making skin stiff and prone to wrinkles. It also spikes insulin increasing oil production and acne. Swap refined sugar for berries and dark chocolate.' },
  { id: 's3', name: 'Morning Routine', emoji: '🌅', desc: 'Gentle cleanser, vitamin C serum, moisturizer, SPF 30+.', tags: ['Morning', 'Daily'], detail: '1) Gentle cleanser. 2) Vitamin C serum for brightening. 3) Hyaluronic acid moisturizer. 4) SPF 30+ — non-negotiable even on cloudy days.' },
  { id: 's4', name: 'Evening Repair', emoji: '🌙', desc: 'Double cleanse, retinol, peptide moisturizer, eye cream.', tags: ['Evening', 'Anti-Aging'], detail: '1) Oil cleanser. 2) Water-based cleanser. 3) Retinol (start 0.3%, 2x/week). 4) Niacinamide serum. 5) Rich moisturizer with ceramides. 6) Eye cream.' },
  { id: 's5', name: 'Niacinamide', emoji: '💧', desc: 'Vitamin B3 minimizes pores, controls oil, brightens tone.', tags: ['Ingredient', 'Brightening'], detail: 'At 5–10% concentration reduces sebum, minimizes pores, strengthens skin barrier, and fades hyperpigmentation. Safe morning and night.' },
  { id: 's6', name: 'Retinol Guide', emoji: '🕐', desc: 'Gold standard for anti-aging. Start low, go slow.', tags: ['Anti-Aging', 'Careful'], detail: 'Start with 0.3% twice weekly, gradually increase to nightly. Expect dryness/peeling initially. Never use with AHAs same night. Avoid during pregnancy.' },
];

const SUPPLEMENTS = [
  { id: 'su1', name: 'Vitamin D3', emoji: '☀️', desc: 'Essential for bone health, immunity and mood. Most people are deficient.', tags: ['Essential', '$8/mo'], dose: '2000–4000 IU', timing: 'Morning with food', detail: 'Vitamin D3 is the most bioavailable form. Deficiency linked to fatigue, weak immunity, and poor bone density. Best taken in the morning with a fat-containing meal.' },
  { id: 'su2', name: 'Omega-3 Fish Oil', emoji: '🐟', desc: 'EPA/DHA for heart health, brain and reducing inflammation.', tags: ['Essential', '$12/mo'], dose: '1000–2000mg EPA+DHA', timing: 'With meals', detail: 'Look for EPA+DHA combined 1000–2000mg. Benefits: reduced inflammation, improved mood, cardiovascular protection. Take with meals to prevent fishy burps.' },
  { id: 'su3', name: 'Creatine Monohydrate', emoji: '🏋️', desc: 'Most researched supplement for strength and cognitive performance.', tags: ['Performance', '$5/mo'], dose: '3–5g daily', timing: 'Anytime, consistent', detail: 'Loading: 20g/day for 5–7 days, then 3–5g/day maintenance. Increases phosphocreatine stores improving ATP regeneration. Also improves memory.' },
  { id: 'su4', name: 'Magnesium Glycinate', emoji: '😴', desc: 'Calming mineral that improves sleep, recovery and anxiety.', tags: ['Sleep', 'Recovery'], dose: '200–400mg', timing: '30 min before bed', detail: 'Most bioavailable and least laxative form. Activates GABA receptors promoting relaxation and deeper sleep. Aids muscle recovery and reduces cramps.' },
  { id: 'su5', name: 'Whey Protein', emoji: '💪', desc: 'Fast-absorbing complete protein. Ideal post-workout.', tags: ['Performance', '$25/mo'], dose: '20–30g serving', timing: 'Post-workout', detail: 'Whey isolate has 90%+ protein with minimal lactose. 20–30g post-workout optimizes muscle protein synthesis.' },
  { id: 'su6', name: 'Calcium + Iron ⚠️', emoji: '⚠️', desc: 'DO NOT take together — they cancel each other out.', tags: ['Avoid', 'Warning'], dose: 'N/A', timing: 'Separate by 4+ hours', detail: 'Calcium and iron compete for the same intestinal transporters. Taking together reduces absorption of both by up to 50%. Space at least 4 hours apart.', isAvoid: true },
];

const RECIPE_CATS = [
  { key: 'all', emoji: '🌟', label: 'Special' },
  { key: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { key: 'lunch', emoji: '🥗', label: 'Lunch' },
  { key: 'dinner', emoji: '🍽️', label: 'Dinner' },
  { key: 'snack', emoji: '🍎', label: 'Snack' },
];

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.07)';

function Card({ item, onClick, isAvoid }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(item)}
      className="cursor-pointer active:scale-[0.97] transition-transform"
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: CARD_SHADOW,
        borderLeft: isAvoid ? '4px solid #EF4444' : 'none',
      }}
    >
      <div style={{ height: 140, background: 'linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
        {item.emoji}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: isAvoid ? '#DC2626' : '#111827', lineHeight: 1.3, marginBottom: 4 }}>{item.name}</p>
        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>{item.desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(item.tags || []).map((t, i) => (
            <span key={i} style={{ background: '#F2F4F8', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 500, color: '#4a5568' }}>{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Sheet({ item, onClose }) {
  if (!item) return null;
  const isRecipe = !!item.ingredients;
  const isSupplement = !!item.dose;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <motion.div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="relative w-full max-w-lg mx-auto bg-white overflow-y-auto"
        style={{ borderRadius: '28px 28px 0 0', maxHeight: '85vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', zIndex: 10 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{item.name}</p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5', border: 'none', fontSize: 18, color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ height: 180, background: 'linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, marginBottom: 16 }}>{item.emoji}</div>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 16 }}>{item.desc}</p>

          {isRecipe && (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 10 }}>Macros</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {[['Kcal', item.macros.calories], ['Protein', `${item.macros.protein}g`], ['Carbs', `${item.macros.carbs}g`], ['Fat', `${item.macros.fat}g`]].map(([l, v]) => (
                  <div key={l} style={{ background: '#F2F4F8', borderRadius: 12, padding: 10, textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{v}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{l}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', textTransform: 'uppercase', marginBottom: 8 }}>Ingredients</p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
                {item.ingredients.map((ing, i) => (
                  <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#1a2e1a', fontWeight: 700 }}>•</span>{ing}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', textTransform: 'uppercase', marginBottom: 8 }}>Instructions</p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
                {item.instructions.map((step, i) => (
                  <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 14, color: '#6B7280', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#1a2e1a', fontWeight: 700 }}>•</span><span><strong>Step {i + 1}:</strong> {step}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {isSupplement && (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', textTransform: 'uppercase', marginBottom: 8 }}>Dosage & Timing</p>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}><strong>Dose:</strong> {item.dose}<br /><strong>Best time:</strong> {item.timing}</p>
              <div style={{ background: '#fffbeb', borderLeft: '3px solid #f59e0b', padding: '10px 12px', borderRadius: '0 8px 8px 0', fontSize: 12, color: '#92400e', marginBottom: 16, fontWeight: 500 }}>
                ⚠️ Always consult a doctor before starting a new supplement
              </div>
            </>
          )}

          {!isRecipe && (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', textTransform: 'uppercase', marginBottom: 8 }}>The Science</p>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{item.detail}</p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Tips() {
  const [tab, setTab] = useState('recipes');
  const [recipeCat, setRecipeCat] = useState('all');
  const [sheet, setSheet] = useState(null);

  const filteredRecipes = recipeCat === 'all' ? RECIPES : RECIPES.filter(r => r.cat === recipeCat);

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F2F4F8' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 800, color: '#1a2e1a', lineHeight: 1.1, marginBottom: 4 }}>
          {tab === 'recipes' ? 'Discover Your Perfect Meal' : tab === 'skincare' ? 'Your Skin, Your Routine' : 'Optimise From Within'}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280' }}>
          {tab === 'recipes' ? 'Tailored to your diet and goals' : tab === 'skincare' ? 'Tips based on your diet and habits' : 'Supplement guidance for your goals'}
        </p>
      </div>

      {/* Tab bar */}
      <div className="px-5 mb-4">
        <div style={{ display: 'flex', gap: 4, background: '#FFFFFF', borderRadius: 20, padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: tab === t.key ? '#1a2e1a' : 'transparent',
                color: tab === t.key ? '#fff' : '#6B7280',
                fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {/* RECIPES */}
          {tab === 'recipes' && (
            <div>
              {/* Category pills */}
              <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
                {RECIPE_CATS.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setRecipeCat(c.key)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      background: recipeCat === c.key ? '#1a2e1a' : '#FFFFFF',
                      borderRadius: 14, padding: '10px 16px', minWidth: 64,
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: recipeCat === c.key ? '#fff' : '#4a5568', whiteSpace: 'nowrap' }}>{c.label}</span>
                  </button>
                ))}
              </div>
              <div className="px-5">
                <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                  {recipeCat === 'all' ? 'All Recipes' : RECIPE_CATS.find(c => c.key === recipeCat)?.label}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {filteredRecipes.map(r => <Card key={r.id} item={r} onClick={setSheet} />)}
                </div>
              </div>
            </div>
          )}

          {/* SKINCARE */}
          {tab === 'skincare' && (
            <div className="px-5">
              <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Based on What You Ate</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {SKINCARE.slice(0, 4).map(s => <Card key={s.id} item={s} onClick={setSheet} />)}
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Ingredient Spotlight</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {SKINCARE.slice(4).map(s => <Card key={s.id} item={s} onClick={setSheet} />)}
              </div>
            </div>
          )}

          {/* SUPPLEMENTS */}
          {tab === 'supplements' && (
            <div className="px-5">
              <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Recommended For You</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {SUPPLEMENTS.slice(0, 4).map(s => <Card key={s.id} item={s} onClick={setSheet} isAvoid={s.isAvoid} />)}
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>What to Avoid</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {SUPPLEMENTS.slice(5).map(s => <Card key={s.id} item={s} onClick={setSheet} isAvoid={s.isAvoid} />)}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {sheet && <Sheet item={sheet} onClose={() => setSheet(null)} />}
      </AnimatePresence>
    </div>
  );
}