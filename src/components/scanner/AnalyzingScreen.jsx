import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FOOD_FACTS = [
  { emoji: '🍫', title: 'Dark Chocolate & Health', fact: '70%+ dark chocolate is rich in flavonoids that improve blood flow, lower blood pressure, and boost brain function. Just 1–2 squares daily can have measurable cardiovascular benefits.' },
  { emoji: '🥑', title: 'Avocado\'s Secret Power', fact: 'Avocados contain more potassium than bananas. This mineral is essential for blood pressure regulation and heart health. They also boost absorption of fat-soluble vitamins from other foods.' },
  { emoji: '🐟', title: 'Omega-3 & Your Brain', fact: 'Fatty fish like salmon contain DHA, a type of omega-3 that makes up 40% of the polyunsaturated fatty acids in your brain. Low DHA is linked to depression and cognitive decline.' },
  { emoji: '🥦', title: 'Broccoli: A Superfood', fact: 'One cup of broccoli delivers more than 100% of your daily vitamin C and K needs. It also contains sulforaphane, a compound shown to have anti-cancer properties in multiple studies.' },
  { emoji: '🫐', title: 'Blueberries & Memory', fact: 'The antioxidants in blueberries cross the blood-brain barrier and directly protect brain cells. Regular consumption has been linked to delaying brain aging by up to 2.5 years.' },
  { emoji: '🥚', title: 'Eggs: Complete Nutrition', fact: 'Eggs contain all 9 essential amino acids making them a "complete" protein. The yolk contains choline, critical for brain health, that 90% of Americans don\'t get enough of.' },
  { emoji: '🥩', title: 'Protein & Satiety', fact: 'Protein is the most filling macronutrient — it reduces the hunger hormone ghrelin and boosts satiety hormones. A high-protein meal can reduce calorie intake at the next meal by up to 400 calories.' },
  { emoji: '🫛', title: 'Fiber & Gut Health', fact: 'Soluble fiber acts as a prebiotic, feeding beneficial gut bacteria. A diverse gut microbiome is linked to better immunity, mood regulation, and even lower risk of obesity.' },
  { emoji: '🧄', title: 'Garlic\'s Medicine', fact: 'Allicin in garlic has been shown to lower LDL cholesterol by 10–15% and blood pressure significantly. Ancient civilizations used garlic as medicine long before modern science confirmed it.' },
  { emoji: '🍵', title: 'Green Tea Compounds', fact: 'Green tea contains EGCG (epigallocatechin gallate), one of the most powerful antioxidants known. It boosts metabolism, protects brain cells, and has shown anti-tumor properties in research.' },
  { emoji: '🌰', title: 'Nuts & Heart Health', fact: 'Eating a handful of nuts (30g) 5 times per week is associated with a 35% lower risk of heart disease. Walnuts are especially powerful, containing plant-based omega-3 fatty acids.' },
  { emoji: '🥗', title: 'Raw vs Cooked', fact: 'Cooking tomatoes increases lycopene availability by up to 35%. But raw broccoli retains more sulforaphane. The "best" way to eat food depends on which nutrients you\'re after.' },
  { emoji: '🍯', title: 'Glycemic Index', fact: 'Pure honey has a lower glycemic index than white sugar, meaning it raises blood sugar more slowly. Raw honey also contains antioxidants and trace enzymes absent from refined sugar.' },
  { emoji: '💧', title: 'Hydration & Metabolism', fact: 'Drinking 500ml of water increases metabolic rate by 30% for about 30–40 minutes. Cold water has a slightly larger effect as the body uses energy to warm it.' },
  { emoji: '🌿', title: 'Herbs as Medicine', fact: 'Turmeric\'s active compound curcumin is a potent anti-inflammatory, but it needs black pepper (piperine) to be absorbed. Piperine increases curcumin absorption by 2000%.' },
];

const SKINCARE_FACTS = [
  { emoji: '☀️', title: 'SPF: The #1 Anti-Aging', fact: 'SPF is the single most effective anti-aging skincare product available. UV radiation causes up to 80% of visible skin aging. Daily SPF 30+ prevents collagen breakdown and dark spots.' },
  { emoji: '💧', title: 'Hyaluronic Acid Magic', fact: 'One molecule of hyaluronic acid can hold 1000x its weight in water. It occurs naturally in skin but levels drop with age. Topical application plumps skin and reduces the appearance of fine lines.' },
  { emoji: '🔬', title: 'Retinol: The Gold Standard', fact: 'Retinol (Vitamin A) is one of the most studied skincare ingredients. It increases cell turnover, stimulates collagen production, and is clinically proven to reduce wrinkles and hyperpigmentation.' },
  { emoji: '🧴', title: 'Fragrance & Irritation', fact: 'Fragrance is the #1 cause of contact dermatitis in skincare. Even "natural" fragrances contain dozens of potential allergens. Fragrance-free is always safer for sensitive or reactive skin.' },
  { emoji: '🌙', title: 'Skin Repairs at Night', fact: 'Skin cell regeneration peaks between 11pm–midnight. Blood flow to skin increases during sleep, and growth hormone released at night accelerates tissue repair. Night creams work with this rhythm.' },
  { emoji: '🍊', title: 'Vitamin C & Collagen', fact: 'Vitamin C is essential for collagen synthesis — without it, collagen cannot form. It also neutralizes free radicals from UV exposure. Look for L-ascorbic acid at 10–20% concentration for efficacy.' },
  { emoji: '🫧', title: 'Over-Cleansing Damage', fact: 'Washing your face more than twice daily strips the skin barrier. This triggers excess oil production as the skin tries to compensate. Most people need only a gentle cleanser once or twice daily.' },
  { emoji: '🧬', title: 'Ceramides & Barrier', fact: 'Ceramides make up 50% of the skin\'s outer protective layer. They prevent moisture loss and block environmental pollutants. Products with ceramides help restore compromised skin barriers.' },
  { emoji: '🌡️', title: 'Hot Water & Skin', fact: 'Hot showers and face washing strip the skin of natural oils and lipids. Lukewarm water is ideal. Studies show consistent hot water exposure weakens the skin barrier over time.' },
  { emoji: '🥤', title: 'Comedogenic Ratings', fact: 'Coconut oil rates 4/5 on the comedogenic scale, meaning it clogs pores for many people despite its popularity. Always patch-test oils and check comedogenic ratings before applying to acne-prone skin.' },
  { emoji: '🌊', title: 'Niacinamide Benefits', fact: 'Niacinamide (Vitamin B3) is one of the most versatile skincare ingredients. It regulates oil production, fades hyperpigmentation, strengthens the skin barrier, and reduces pore appearance — all in one.' },
  { emoji: '🧪', title: 'AHA vs BHA', fact: 'AHAs (like glycolic acid) work on the skin surface to exfoliate dead cells. BHAs (like salicylic acid) are oil-soluble and penetrate pores. Oily/acne-prone skin benefits more from BHAs.' },
  { emoji: '💊', title: 'Parabens Debate', fact: 'Parabens are among the most studied preservatives in cosmetics. While they\'ve been found in breast tissue, current evidence doesn\'t confirm they cause harm at cosmetic concentrations. The debate continues.' },
  { emoji: '✨', title: 'Peptides & Aging', fact: 'Peptides are short chains of amino acids that signal skin to produce more collagen. Unlike retinol, they cause no irritation, making them ideal for sensitive skin seeking anti-aging benefits.' },
];

const SUPPLEMENT_FACTS = [
  { emoji: '🌞', title: 'Vitamin D Deficiency', fact: 'Over 1 billion people worldwide are vitamin D deficient. It\'s nearly impossible to get enough from food alone. Deficiency is linked to depression, weakened immunity, and higher risk of multiple cancers.' },
  { emoji: '🧠', title: 'Magnesium & Sleep', fact: 'Magnesium regulates GABA receptors, the main calming neurotransmitter in the brain. Magnesium glycinate is the most bioavailable form for promoting sleep and reducing anxiety without causing drowsiness next day.' },
  { emoji: '🐟', title: 'Omega-3 Forms Matter', fact: 'Fish oil in triglyceride form is absorbed 70% better than the ethyl ester form. Many cheaper fish oils use ethyl esters. Look for "re-esterified triglycerides" on the label for best absorption.' },
  { emoji: '💊', title: 'Bioavailability is Everything', fact: 'Magnesium oxide — the most common form — is only 4% absorbed. Magnesium citrate is 90% absorbed. The form of a supplement can make the difference between results and expensive urine.' },
  { emoji: '🦴', title: 'Vitamin K2 & Calcium', fact: 'Vitamin K2 (MK-7 form) directs calcium into bones and teeth instead of arteries. Many people take calcium and vitamin D but skip K2 — without it, supplemental calcium may actually calcify arteries.' },
  { emoji: '🌿', title: 'Ashwagandha Evidence', fact: 'Ashwagandha (KSM-66 extract) is one of the few adaptogens with strong clinical evidence. Studies show it reduces cortisol by 28%, improves strength, and significantly reduces anxiety scores.' },
  { emoji: '🔬', title: 'Creatine: Most Studied', fact: 'Creatine monohydrate is the most researched performance supplement in history with over 500 published studies. It\'s proven safe, effective for strength and muscle, and emerging research suggests cognitive benefits too.' },
  { emoji: '⚡', title: 'B12 & Energy', fact: 'Vitamin B12 is essential for red blood cell production and nerve function. Vegans and vegetarians are at high risk of deficiency. Methylcobalamin is better retained in the body than cyanocobalamin.' },
  { emoji: '🦠', title: 'Probiotics & Strains', fact: 'Not all probiotics are equal — specific strains target specific issues. Lactobacillus rhamnosus GG is proven for diarrhea, while Bifidobacterium longum helps with anxiety. The strain number matters.' },
  { emoji: '🌊', title: 'Zinc & Immunity', fact: 'Zinc is required for over 300 enzymatic reactions. It\'s one of the few supplements shown to reduce cold duration when taken within 24 hours of symptom onset. Zinc bisglycinate is the gentlest on the stomach.' },
  { emoji: '💪', title: 'Protein Timing', fact: 'The "anabolic window" — the idea that protein must be consumed immediately post-workout — is largely a myth. Total daily protein intake matters far more than timing for muscle protein synthesis.' },
  { emoji: '🧬', title: 'CoQ10 & Statins', fact: 'Statin medications deplete CoQ10, an antioxidant critical for cellular energy production. Many doctors don\'t mention this. People on statins often benefit significantly from CoQ10 supplementation (ubiquinol form).' },
  { emoji: '🍄', title: 'Lion\'s Mane & Brain', fact: 'Lion\'s Mane mushroom contains hericenones and erinacines that stimulate Nerve Growth Factor (NGF) production. Clinical studies show improvements in mild cognitive impairment and reduced anxiety and depression.' },
  { emoji: '🌙', title: 'Melatonin Dosing', fact: 'Most melatonin supplements are dramatically overdosed. Research shows 0.3–0.5mg is physiologically ideal — the same amount your body naturally produces. High doses (5–10mg) can disrupt your natural melatonin rhythm.' },
];

function getFactsForType(type) {
  if (type === 'skincare') return SKINCARE_FACTS;
  if (type === 'supplement') return SUPPLEMENT_FACTS;
  return FOOD_FACTS;
}

export default function AnalyzingScreen({ type = 'food', message = 'Analysing...' }) {
  const [cardIndex, setCardIndex] = useState(0);
  const facts = getFactsForType(type);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    const next = (idx + facts.length) % facts.length;
    setCardIndex(next);
    // Reset auto-advance timer
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCardIndex(prev => (prev + 1) % facts.length);
    }, 10000);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCardIndex(prev => (prev + 1) % facts.length);
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, [facts.length]);

  const card = facts[cardIndex];

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center px-6">
      {/* Three-dot pulse loader */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-gray-900"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>

      <p className="text-base font-semibold text-gray-800 mb-1">{message}</p>
      <p className="text-xs text-gray-400 mb-10">This may take a moment</p>

      {/* Flashcard */}
      <div className="w-full max-w-sm">
        <div
          key={cardIndex}
          className="bg-gray-50 border border-gray-100 rounded-[24px] p-5 shadow-sm"
          style={{ animation: 'slideUp 0.4s cubic-bezier(0.4,0,0.2,1) both' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{card.title}</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{card.fact}</p>
        </div>

        {/* Navigation arrows + dots */}
        <div className="flex items-center justify-between mt-4 px-2">
          <button
            onClick={() => goTo(cardIndex - 1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex gap-1">
            {facts.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === cardIndex ? 16 : 6,
                  height: 6,
                  background: i === cardIndex ? '#1a1a1a' : '#d1d5db',
                }}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(cardIndex + 1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}