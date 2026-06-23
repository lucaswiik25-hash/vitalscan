import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const DIET_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard',
    subtitle: 'No restrictions',
    description: 'Meal planner generates any foods. Scanner gives no diet-specific warnings.',
    color: '#6CC5A0',
  },
  {
    id: 'calorie_deficit',
    label: 'Calorie Deficit',
    subtitle: 'Weight loss focus',
    description: 'Reduces daily calories by 300–500 below maintenance. Scanner flags calorie-dense foods.',
    color: '#f97316',
  },
  {
    id: 'high_protein',
    label: 'High Protein',
    subtitle: '2g protein per kg',
    description: 'Scanner flags foods under 20g protein per 100 calories. Shopping list weighted toward protein sources.',
    color: '#ef4444',
  },
  {
    id: 'keto',
    label: 'Ketogenic',
    subtitle: 'Under 30g carbs/day',
    description: 'Scanner flags any food over 5g net carbs per serving with LIMIT or NO verdict.',
    color: '#8b5cf6',
  },
  {
    id: 'carnivore',
    label: 'Carnivore',
    subtitle: 'Animal products only',
    description: 'Scanner gives NO verdict to any plant-based food. Only meat, fish, eggs, and animal fats.',
    color: '#b45309',
  },
  {
    id: 'vegan',
    label: 'Vegan',
    subtitle: 'No animal products',
    description: 'Scanner flags hidden animal ingredients like casein, whey, gelatin, carmine, lactose.',
    color: '#22c55e',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    subtitle: 'No meat or fish',
    description: 'Dairy and eggs allowed. Scanner flags meat and fish ingredients.',
    color: '#84cc16',
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    subtitle: 'No meat, fish ok',
    description: 'Scanner flags only meat ingredients. Fish and seafood as main protein sources.',
    color: '#06b6d4',
  },
  {
    id: 'gluten_free',
    label: 'Gluten Free',
    subtitle: 'No gluten sources',
    description: 'Scanner flags wheat, barley, rye, malt, and hidden sources like soy sauce and modified starch.',
    color: '#eab308',
  },
  {
    id: 'dairy_free',
    label: 'Dairy Free',
    subtitle: 'No dairy products',
    description: 'Scanner flags all dairy including hidden casein, whey, lactose, ghee, lactalbumin.',
    color: '#f59e0b',
  },
  {
    id: 'paleo',
    label: 'Paleo',
    subtitle: 'Whole foods only',
    description: 'No processed foods, grains, legumes, dairy, or refined sugar. Whole food meals only.',
    color: '#a16207',
  },
  {
    id: 'mediterranean',
    label: 'Mediterranean',
    subtitle: 'Balanced whole diet',
    description: 'Emphasizes olive oil, fish, vegetables, legumes, whole grains, nuts.',
    color: '#0ea5e9',
  },
  {
    id: 'intermittent_fasting',
    label: 'Intermittent Fasting',
    subtitle: '16/8 eating window',
    description: 'Meal planner only schedules meals within your 8-hour eating window.',
    color: '#6366f1',
  },
  {
    id: 'low_sodium',
    label: 'Low Sodium',
    subtitle: 'Under 1500mg/day',
    description: 'Scanner flags any food over 400mg sodium per serving with red indicator.',
    color: '#14b8a6',
  },
  {
    id: 'low_sugar',
    label: 'Low Sugar',
    subtitle: 'Under 25g sugar/day',
    description: 'Scanner flags any food over 10g sugar per serving. Meal planner avoids added sugars.',
    color: '#ec4899',
  },
  {
    id: 'appearance_mode',
    label: '✦ Appearance Mode',
    subtitle: 'Look your best — inside out',
    description: 'The entire app shifts focus to facial clarity, reduced puffiness, sharp definition, and hormonal balance. Every meal, scan, and recommendation is built around making you look better. Food scanner shows Appearance Impact instead of macros. Meal planner builds anti-inflammatory, low-sodium, collagen-supporting days. Shopping list prioritises skin-clarity foods.',
    color: '#d946ef',
  },
];

const ALLERGEN_OPTIONS = [
  // Food allergens
  { id: 'milk', label: 'Milk / Dairy', category: 'Food' },
  { id: 'eggs', label: 'Eggs', category: 'Food' },
  { id: 'peanuts', label: 'Peanuts', category: 'Food' },
  { id: 'tree_nuts', label: 'Tree Nuts', category: 'Food' },
  { id: 'wheat', label: 'Wheat / Gluten', category: 'Food' },
  { id: 'soy', label: 'Soy', category: 'Food' },
  { id: 'fish', label: 'Fish', category: 'Food' },
  { id: 'shellfish', label: 'Shellfish', category: 'Food' },
  { id: 'sesame', label: 'Sesame', category: 'Food' },
  { id: 'mustard', label: 'Mustard', category: 'Food' },
  { id: 'celery', label: 'Celery', category: 'Food' },
  { id: 'lupin', label: 'Lupin', category: 'Food' },
  { id: 'molluscs', label: 'Molluscs', category: 'Food' },
  { id: 'sulphites', label: 'Sulphites / SO₂', category: 'Food' },
  // Intolerances
  { id: 'lactose', label: 'Lactose', category: 'Intolerance' },
  { id: 'fructose', label: 'Fructose', category: 'Intolerance' },
  { id: 'histamine', label: 'Histamine', category: 'Intolerance' },
  { id: 'fodmap', label: 'FODMAPs', category: 'Intolerance' },
  { id: 'nightshades', label: 'Nightshades', category: 'Intolerance' },
  { id: 'caffeine', label: 'Caffeine', category: 'Intolerance' },
  // E-additives
  { id: 'artificial_colors', label: 'Artificial Colors (E1xx)', category: 'Additives' },
  { id: 'artificial_preservatives', label: 'Preservatives (E2xx)', category: 'Additives' },
  { id: 'antioxidants_e3xx', label: 'Antioxidants (E3xx)', category: 'Additives' },
  { id: 'emulsifiers', label: 'Emulsifiers (E4xx)', category: 'Additives' },
  { id: 'flavor_enhancers', label: 'Flavor Enhancers / MSG (E6xx)', category: 'Additives' },
  { id: 'sweeteners', label: 'Sweeteners (E9xx)', category: 'Additives' },
  { id: 'titanium_dioxide', label: 'Titanium Dioxide (E171)', category: 'Additives' },
  { id: 'carrageenan', label: 'Carrageenan (E407)', category: 'Additives' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState('input'); // 'input' | 'analyzing' | 'diet' | 'allergens' | 'review'
  const [parsedProfile, setParsedProfile] = useState(null);
  const [selectedDiet, setSelectedDiet] = useState('standard');
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  const toggleAllergen = (id) => {
    setSelectedAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const analyzeProfile = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setStep('analyzing');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the following user description and extract their profile data for a nutrition/health tracking app. The user wrote:

"${text}"

Extract: name, age, weight (in kg), height (in cm), sex (male/female/other), activity level (sedentary/lightly_active/moderately_active/very_active/extra_active), goal (lose_weight/maintain/gain_muscle/lean_bulk), diet mode (none/vegan/vegetarian/keto/gluten_free/paleo/mediterranean), any food preferences or allergies.

Then calculate:
- Daily calorie target using Mifflin-St Jeor equation with their activity multiplier and goal adjustment
- Protein target (typically 1.6-2.2g per kg body weight based on activity)
- Fat target (about 25-30% of calories / 9)
- Carbs target (remaining calories / 4)
- Water target in ml (about 35ml per kg body weight adjusted for activity)

If any info is missing, make reasonable assumptions for a healthy individual.`,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          weight: { type: 'number' },
          height: { type: 'number' },
          sex: { type: 'string' },
          activity_level: { type: 'string' },
          goal: { type: 'string' },
          diet_mode: { type: 'string' },
          preferences: { type: 'string' },
          allergens: { type: 'array', items: { type: 'string' } },
          calorie_target: { type: 'number' },
          protein_target: { type: 'number' },
          carbs_target: { type: 'number' },
          fat_target: { type: 'number' },
          water_target_ml: { type: 'number' },
        },
      },
    });

    setParsedProfile(result);
    setStep('diet');
    setIsAnalyzing(false);
  };

  const saveProfile = async () => {
    setIsAnalyzing(true);
    // Delete existing profiles before creating a new one
    const existing = await base44.entities.UserProfile.list();
    for (const p of existing) {
      await base44.entities.UserProfile.delete(p.id);
    }
    await base44.entities.UserProfile.create({
      ...parsedProfile,
      diet_mode: selectedDiet,
      allergens: selectedAllergens,
      fiber_target: 30,
      sugar_target: selectedDiet === 'low_sugar' ? 25 : 50,
      sodium_target: selectedDiet === 'low_sodium' ? 1500 : 2300,
      streak: 1,
      last_active_date: new Date().toISOString().split('T')[0],
      onboarding_complete: true,
      appearance_mode: selectedDiet === 'appearance_mode',
    });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setIsAnalyzing(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 pt-16 pb-6">
        <span className="text-2xl font-bold text-foreground">Scanly</span>

        {step === 'input' && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground mt-6">Tell us about yourself</h1>
            <p className="text-muted-foreground mt-2">Write freely — our AI will understand your goals, body metrics, and preferences.</p>
          </>
        )}
        {step === 'diet' && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground mt-6">Choose your diet</h1>
            <p className="text-muted-foreground mt-2">This shapes your scanner verdicts, meal plans, and shopping lists.</p>
          </>
        )}
        {step === 'allergens' && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground mt-6">Allergens & Intolerances</h1>
            <p className="text-muted-foreground mt-2">Select everything you're allergic or sensitive to. The scanner will flag these in every product.</p>
          </>
        )}
        {step === 'review' && (
          <>
            <h1 className="text-3xl font-extrabold text-foreground mt-6">All set!</h1>
            <p className="text-muted-foreground mt-2">Here's your personalized plan.</p>
          </>
        )}
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        {step === 'input' && (
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. My name is Lucas, I'm 68kg, 16 years old, I train 5-6 times a week. I want to gain muscle..."
              className="min-h-[200px] text-base rounded-[20px] border-border bg-white p-4 resize-none focus:ring-1 focus:ring-foreground"
            />
            <Button
              onClick={analyzeProfile}
              disabled={!text.trim()}
              className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base gap-2 hover:bg-foreground/90"
            >
              <Sparkles className="w-5 h-5" />
              Analyze with AI
            </Button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-foreground animate-spin" />
            </div>
            <p className="text-lg font-semibold text-foreground">Analyzing your profile...</p>
            <p className="text-sm text-muted-foreground mt-1">Setting up your personalized plan</p>
          </div>
        )}

        {step === 'diet' && (
          <div className="space-y-3 pb-32">
            {DIET_OPTIONS.map((diet) => {
              const isSelected = selectedDiet === diet.id;
              return (
                <button
                  key={diet.id}
                  onClick={() => setSelectedDiet(diet.id)}
                  className="w-full text-left border rounded-[20px] p-4 transition-all active:scale-[0.98]"
                  style={{
                    background: isSelected ? `${diet.color}14` : 'white',
                    borderColor: isSelected ? diet.color : 'hsl(var(--border))',
                    borderWidth: isSelected ? 2 : 1,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: diet.color }} />
                      <div>
                        <p className="text-sm font-bold text-foreground">{diet.label}</p>
                        <p className="text-xs text-muted-foreground">{diet.subtitle}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: diet.color }}>
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <p className="text-xs text-muted-foreground mt-2 ml-6">{diet.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {step === 'allergens' && (
          <div className="space-y-5 pb-32">
            {['Food', 'Intolerance', 'Additives'].map(cat => (
              <div key={cat}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.filter(a => a.category === cat).map(a => {
                    const selected = selectedAllergens.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAllergen(a.id)}
                        className="px-3 py-1.5 rounded-full text-sm font-semibold border transition-all"
                        style={{
                          background: selected ? '#1a1a1a' : 'white',
                          color: selected ? 'white' : 'hsl(var(--foreground))',
                          borderColor: selected ? '#1a1a1a' : 'hsl(var(--border))',
                        }}
                      >
                        {selected && <span className="mr-1">✓</span>}{a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {selectedAllergens.length === 0 && (
              <p className="text-xs text-muted-foreground">You can skip this if you have no known allergens.</p>
            )}
          </div>
        )}

        {step === 'review' && parsedProfile && (
          <motion.div
            className="space-y-4 pb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4">Your Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', parsedProfile.name],
                  ['Age', parsedProfile.age],
                  ['Weight', `${parsedProfile.weight} kg`],
                  ['Height', `${parsedProfile.height} cm`],
                  ['Sex', parsedProfile.sex],
                  ['Activity', parsedProfile.activity_level?.replace(/_/g, ' ')],
                  ['Goal', parsedProfile.goal?.replace(/_/g, ' ')],
                  ['Diet', DIET_OPTIONS.find(d => d.id === selectedDiet)?.label || selectedDiet],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4">Daily Targets</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Calories', `${parsedProfile.calorie_target} kcal`],
                  ['Protein', `${parsedProfile.protein_target}g`],
                  ['Carbs', `${parsedProfile.carbs_target}g`],
                  ['Fat', `${parsedProfile.fat_target}g`],
                  ['Water', `${parsedProfile.water_target_ml} ml`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={saveProfile}
              disabled={isAnalyzing}
              className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Let's go <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom CTA for diet and allergens steps */}
      {(step === 'diet' || step === 'allergens') && (
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-4 bg-gradient-to-t from-background to-transparent">
          <Button
            onClick={() => step === 'diet' ? setStep('allergens') : setStep('review')}
            className="w-full h-14 rounded-2xl bg-foreground text-white font-semibold text-base gap-2"
          >
            {step === 'allergens' && selectedAllergens.length === 0 ? 'Skip' : 'Continue'} <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}