import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import UnsplashImage from './UnsplashImage';
import SuccessModal from '../shared/SuccessModal';
import { X, Loader2, Bookmark, Apple } from 'lucide-react';

const SAVED_RECIPES_KEY = 'saved_recipes_v1';
function getSavedRecipes() {
  try { return JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || '[]'); } catch { return []; }
}
function saveRecipe(recipe) {
  const saved = getSavedRecipes();
  if (!saved.some(r => r.name === recipe.name)) {
    localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify([recipe, ...saved]));
  }
}
function isRecipeSaved(name) {
  return getSavedRecipes().some(r => r.name === name);
}

const CATS = [
  { key: 'all', emoji: '🌟', label: 'Special' },
  { key: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { key: 'lunch', emoji: '🥗', label: 'Lunch' },
  { key: 'dinner', emoji: '🍽️', label: 'Dinner' },
  { key: 'snack', emoji: '🍎', label: 'Snack' },
];

const CACHE_KEY = 'tips_recipes_cache_v2';
function getCachedRecipes(profileKey) {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); return c[profileKey] || null; } catch { return null; }
}
function cacheRecipes(profileKey, data) {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); c[profileKey] = data; localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

function RecipeFullPage({ item, onClose, profile }) {
  const queryClient = useQueryClient();
  const [logging, setLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saved, setSaved] = useState(isRecipeSaved(item.name));

  const logRecipeAsMeal = async () => {
    setLogging(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const meal_type = item.cat || 'lunch';
    await base44.entities.Meal.create({
      name: item.name,
      date: today,
      time: format(new Date(), 'h:mm a'),
      meal_type,
      calories: Number(item.macros?.calories) || 0,
      protein: Number(item.macros?.protein) || 0,
      carbs: Number(item.macros?.carbs) || 0,
      fat: Number(item.macros?.fat) || 0,
      logged: true,
      source: 'recipe',
    });
    queryClient.invalidateQueries({ queryKey: ['meals'] });
    queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
    queryClient.invalidateQueries({ queryKey: ['allMeals'] });
    setLogging(false);
    setShowSuccess(true);
  };

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
        <UnsplashImage query={item.name} fallbackEmoji={item.emoji || '🍽️'} height={260} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)' }} />
        <div className="absolute top-12 left-5 right-5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => { saveRecipe(item); setSaved(true); }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: saved ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
          >
            <Bookmark className="w-5 h-5" style={{ color: saved ? '#1a2e1a' : 'white', fill: saved ? '#1a2e1a' : 'none' }} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p style={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{item.name}</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{item.desc}</p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(item.tags || []).map((t, i) => (
            <span key={i} style={{ background: '#1a2e1a', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{t}</span>
          ))}
        </div>

        {/* Macros */}
        {item.macros && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0, 0, 0, 0.13)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Macros</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[['Kcal', item.macros.calories], ['Protein', `${item.macros.protein}g`], ['Carbs', `${item.macros.carbs}g`], ['Fat', `${item.macros.fat}g`]].map(([l, v]) => (
                <div key={l} style={{ background: '#F2F4F8', borderRadius: 12, padding: 10, textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{v}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        {item.ingredients?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0, 0, 0, 0.13)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Ingredients</p>
            {item.ingredients.map((ing, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < item.ingredients.length - 1 ? '1px solid #f5f5f5' : 'none', fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#1a2e1a', fontWeight: 700 }}>•</span>{ing}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {item.instructions?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(0, 0, 0, 0.13)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Instructions</p>
            {item.instructions.map((step, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < item.instructions.length - 1 ? '1px solid #f5f5f5' : 'none', fontSize: 14, color: '#374151', display: 'flex', gap: 12 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#1a2e1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {item.personalisation_note && (
          <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 14, border: '1px solid #bbf7d0' }}>
            <p style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>✅ Personalised for you</p>
            <p style={{ fontSize: 13, color: '#166534', marginTop: 4, lineHeight: 1.5 }}>{item.personalisation_note}</p>
          </div>
        )}

        <button
          onClick={logRecipeAsMeal}
          disabled={logging}
          className="w-full h-14 rounded-2xl bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 sticky bottom-4"
        >
          {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Apple className="w-4 h-4" />}
          {logging ? 'Logging...' : 'Log as Meal'}
        </button>
      </div>

      {showSuccess && (
        <SuccessModal
          title="Meal Logged!"
          message={`${item.name} has been added to your ${item.cat || 'meal'} slot.`}
          onClose={() => { setShowSuccess(false); onClose(); }}
        />
      )}
    </motion.div>
  );
}

export default function RecipesTab({ profile }) {
  const [cat, setCat] = useState('all');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState(getSavedRecipes());

  const profileKey = `${profile?.goal}_${profile?.diet_mode}_${cat}`;

  useEffect(() => {
    if (!profile?.name) return;
    const cached = getCachedRecipes(profileKey);
    if (cached) { setRecipes(cached); return; }
    generateRecipes();
  }, [cat, profile?.goal, profile?.diet_mode]);

  const generateRecipes = async () => {
    setLoading(true);
    setRecipes([]);
    const catLabel = CATS.find(c => c.key === cat)?.label || 'all';
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 6 ${catLabel === 'Special' ? 'personalised' : catLabel.toLowerCase()} recipes for this user:
- Diet mode: ${profile?.diet_mode || 'standard'}
- Goal: ${profile?.goal || 'maintain'}
- Allergens: ${(profile?.allergens || []).join(', ') || 'none'}
- Calorie target: ${profile?.calorie_target || 2000} kcal/day
- Protein target: ${profile?.protein_target || 150}g/day
- Age: ${profile?.age || 'unknown'}, Weight: ${profile?.weight || 'unknown'}kg

Rules:
- Every single recipe must comply 100% with the user's diet mode
- If high_protein or gain_muscle goal: every recipe must exceed 30g protein
- If lose_weight goal: every recipe must be under ${Math.round((profile?.calorie_target || 2000) / 4)} kcal
- Zero recipes may contain any of the user's allergens
- Do not generate generic recipes — make them specific to this exact profile
- Category filter: ${catLabel === 'Special' ? 'any category' : catLabel}

Return JSON with recipes array, each with: name, desc, emoji, cat (breakfast/lunch/dinner/snack), tags (array of 3: time, difficulty, kcal), ingredients (array of strings with amounts), instructions (array of steps), macros (calories, protein, carbs, fat), personalisation_note (one sentence why this fits this user).`,
        response_json_schema: {
          type: 'object',
          properties: {
            recipes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' }, desc: { type: 'string' }, emoji: { type: 'string' },
                  cat: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
                  ingredients: { type: 'array', items: { type: 'string' } },
                  instructions: { type: 'array', items: { type: 'string' } },
                  macros: { type: 'object', properties: { calories: { type: 'number' }, protein: { type: 'number' }, carbs: { type: 'number' }, fat: { type: 'number' } } },
                  personalisation_note: { type: 'string' },
                }
              }
            }
          }
        }
      });
      const data = res?.recipes || [];
      setRecipes(data);
      cacheRecipes(profileKey, data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Category pills */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {CATS.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: cat === c.key ? '#1a2e1a' : '#FFFFFF',
            borderRadius: 14, padding: '10px 16px', minWidth: 64,
            border: cat === c.key ? '1px solid #1a2e1a' : '1px solid rgba(0, 0, 0, 0.13)',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0,
          }}>
            <span style={{ fontSize: 20 }}>{c.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: cat === c.key ? '#fff' : '#4a5568', whiteSpace: 'nowrap' }}>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="px-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
            {showSaved ? 'Saved Recipes' : `${CATS.find(c => c.key === cat)?.label || 'All'} Recipes`}
          </p>
          <div className="flex gap-3">
            {savedRecipes.length > 0 && (
              <button onClick={() => setShowSaved(!showSaved)} style={{ fontSize: 12, color: '#1a2e1a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                {showSaved ? 'All' : `Saved (${savedRecipes.length})`}
              </button>
            )}
            <button onClick={generateRecipes} style={{ fontSize: 12, color: '#1a2e1a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              Refresh ↺
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p style={{ fontSize: 14, color: '#6B7280' }}>Generating personalised recipes...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(showSaved ? savedRecipes : recipes).map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(r)}
                className="cursor-pointer active:scale-[0.97] transition-transform"
                style={{ background: '#FFF', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.13)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <UnsplashImage query={r.name} fallbackEmoji={r.emoji || '🍽️'} height={140} />
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.3 }}>{r.name}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(r.tags || []).map((t, j) => (
                      <span key={j} style={{ background: '#F2F4F8', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 500, color: '#4a5568' }}>{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <RecipeFullPage
            item={selected}
            profile={profile}
            onClose={() => { setSelected(null); setSavedRecipes(getSavedRecipes()); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}