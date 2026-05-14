/**
 * Diet-aware prompt builder for all Claude API calls.
 * Every call opens with the diet preamble and asks diet-specific questions.
 */

export const DIET_LABELS = {
  appearance_mode: 'Appearance / Look Better',
  carnivore: 'Carnivore',
  keto: 'Keto',
  vegan: 'Vegan',
  gluten_free: 'Gluten Free',
  allergy_mode: 'Allergy Mode',
  intermittent_fasting: 'Intermittent Fasting',
  high_protein: 'High Protein',
  mediterranean: 'Mediterranean',
  paleo: 'Paleo',
  none: 'Standard',
  standard: 'Standard',
};

/**
 * Returns the mandatory opening line injected into EVERY Claude call.
 */
export function dietPreamble(dietMode) {
  if (!dietMode || dietMode === 'none' || dietMode === 'standard') return '';
  const label = DIET_LABELS[dietMode] || dietMode;
  return `The user's diet is: ${label}. Every single verdict, score, recommendation, and flag in your response must be 100% specific to this diet and nothing else. Do not give generic health advice. Do not mix in advice from other diets.\n\n`;
}

/**
 * Builds the full Call-2 analysis prompt for a given diet.
 * @param {string} dietMode
 * @param {object} enriched  - nutrition data from call 1
 * @param {object} userProfile
 * @param {object} [todayContext] - { sodiumToday, sugarToday, waterMl, caloriesBurned } for appearance tomorrow prediction
 */
export function buildCall2Prompt(dietMode, enriched, userProfile, todayContext = {}) {
  const pre = dietPreamble(dietMode);
  const n = `Food: "${enriched.name}". Nutrition per serving: ${enriched.calories}kcal, ${enriched.protein}g protein, ${enriched.carbs}g carbs (${enriched.fiber}g fiber → net carbs: ${Math.max(0, (enriched.carbs || 0) - (enriched.fiber || 0))}g), ${enriched.fat}g fat, ${enriched.sugar}g sugar, ${enriched.sodium}mg sodium, ${enriched.potassium || 0}mg potassium. Ingredients: ${enriched.ingredients_text || 'not provided'}.`;

  switch (dietMode) {
    case 'appearance_mode': {
      const ctx = todayContext;
      return `${pre}You are a dermatologist and appearance optimization expert.\n${n}\nUser sex: ${userProfile.sex || 'unknown'}.\n\nAnswer these SPECIFIC questions:\n1. Will this food cause facial bloating or puffiness tomorrow?\n2. Sodium content and effect on water retention specifically.\n3. Does it contain natural or added sugars that spike insulin and worsen skin clarity?\n4. Does it increase inflammation visible on the face?\n5. Does it support or damage collagen?\n6. Does it help or hurt testosterone balance?\n7. Will this food make the user look better or worse tomorrow?\n\nVerdict must be one of: Excellent, Good, Neutral, Avoid — NEVER yes/no.\nPrimary metric is Tomorrow Face Impact, NOT calories.\n\nToday's running totals: sodium=${ctx.sodiumToday || 0}mg, sugar=${ctx.sugarToday || 0}g, water=${ctx.waterMl || 0}ml, calories_burned=${ctx.caloriesBurned || 0}kcal.\nBased on ALL four combined factors, predict whether the user's face will show more or less puffiness tomorrow vs baseline. Return tomorrow_prediction as "Better", "Same", or "Worse" with a tomorrow_prediction_reason (2 sentences max, specific).\n\nReturn JSON: appearance_impact ("Excellent"/"Good"/"Neutral"/"Avoid"), appearance_reason, bloat_risk ("Low"/"Medium"/"High"), bloat_reason, skin_impact, collagen_effect, collagen_reason, hormone_effect, hormone_reason, tomorrow_face, tomorrow_prediction ("Better"/"Same"/"Worse"), tomorrow_prediction_reason, glycemic_impact ("Low"/"Medium"/"High"), glycemic_reason, health_score (1-10), processing_level. NEVER fail.`;
    }

    case 'carnivore':
      return `${pre}You are a carnivore diet expert.\n${n}\n\nAnswer these SPECIFIC questions:\n1. Is this 100% animal-based?\n2. Does it contain ANY plant ingredients — including spices, seed oils, vegetable extracts, or any non-animal additive? List each one by name.\n3. Is this processed in any way?\n\nRULE: If it contains ANY non-animal ingredient, verdict is "Not Carnivore" immediately with NO exceptions.\nDo NOT track carbs or fiber. Show only protein and fat.\n\nReturn JSON: diet_compatibility ("Carnivore Approved"/"Not Carnivore"), diet_reason, non_carnivore_ingredients (array of ingredient names that disqualify), is_processed (boolean), processing_note, health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason. NEVER fail.`;

    case 'keto': {
      const netCarbs = Math.max(0, (enriched.carbs || 0) - (enriched.fiber || 0));
      return `${pre}You are a ketogenic diet expert.\n${n}\nNet carbs per serving: ${netCarbs}g.\n\nAnswer these SPECIFIC questions:\n1. Net carbs = total carbs minus fiber = ${netCarbs}g. If this exceeds 5g, verdict is "Not Keto" immediately.\n2. Does it contain hidden sugars or high glycemic ingredients?\n3. Is the fat source clean or from seed oils?\n\nVerdict must be: "Keto Safe", "Limit", or "Not Keto".\nPrimary metric shown is NET CARBS, not calories.\n\nReturn JSON: diet_compatibility ("Keto Safe"/"Limit"/"Not Keto"), diet_reason, net_carbs (number), hidden_sugars (array of ingredient names), fat_source_quality ("Clean"/"Seed Oils"/"Mixed"), glycemic_impact ("low"/"medium"/"high"), glycemic_reason, health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason. NEVER fail.`;
    }

    case 'vegan':
      return `${pre}You are a vegan diet expert and animal product detective.\n${n}\n\nAnswer these SPECIFIC questions:\n1. Does this contain ANY animal product — including hidden ones: casein, whey, gelatin, carmine, lactose, lanolin, beeswax, L-cysteine, isinglass, rennet, shellac?\n2. If ANY animal ingredient is detected, verdict is "NOT VEGAN" immediately.\n3. Flag EVERY hidden animal ingredient specifically by name.\n4. What is the protein source quality?\n5. Does this food contribute to B12 intake?\n\nPrimary metrics: protein source quality and B12 content.\n\nReturn JSON: diet_compatibility ("Vegan Safe"/"NOT VEGAN"), diet_reason, hidden_animal_ingredients (array of found ingredient names — empty if none), protein_source_quality ("Complete"/"Incomplete"/"None"), b12_content ("Present"/"Trace"/"None"), health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason. NEVER fail.`;

    case 'gluten_free':
      return `${pre}You are a celiac disease and gluten-free diet expert. THIS IS MEDICAL NECESSITY, NOT PREFERENCE.\n${n}\n\nAnswer these SPECIFIC questions:\n1. Does this contain wheat, barley, rye, malt, or any gluten-containing ingredient?\n2. Check for HIDDEN gluten sources: modified food starch, soy sauce, maltodextrin from wheat, oats not certified gluten-free, natural flavors that may contain gluten.\n3. If ANY gluten source is detected, issue an ALLERGEN ALERT as the VERY FIRST output.\n\nVerdict: "Gluten Free Safe" or "Contains Gluten".\n\nReturn JSON: diet_compatibility ("Gluten Free Safe"/"Contains Gluten"), allergen_alert (true/false), allergen_alert_message (specific — which ingredient contains gluten), gluten_sources (array of ingredient names that contain gluten), hidden_gluten_risk (boolean), diet_reason, health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason. NEVER fail.`;

    case 'allergy_mode': {
      const allergens = (userProfile.allergens || []).join(', ') || 'none specified';
      return `${pre}You are an allergen detection expert. THIS IS LIFE OR DEATH ACCURACY.\n${n}\nThe user has flagged these allergens: ${allergens}.\n\nScan EVERY SINGLE ingredient against the user's allergen list.\n1. If ANY match is found, trigger a red ALLERGEN ALERT as the VERY FIRST result — before anything else.\n2. The alert must say EXACTLY which allergen was found and EXACTLY which ingredient contains it.\n3. NEVER bury an allergen warning below other content.\n4. If you CANNOT confirm an ingredient is safe, flag it as: "Unconfirmed — may contain [allergen]".\n5. Never guess. Be specific.\n\nReturn JSON: allergen_alert (boolean), allergen_alert_message (exact message), allergens_found (array: {allergen, ingredient, confidence: "confirmed"/"possible"}), diet_compatibility ("Safe"/"ALLERGEN DETECTED"/"Unconfirmed"), diet_reason, health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason. NEVER fail.`;
    }

    case 'intermittent_fasting':
      return `${pre}You are an intermittent fasting and metabolic expert.\n${n}\n\nAnswer these SPECIFIC questions:\n1. Is this food appropriate for BREAKING a fast without spiking insulin?\n2. Does it contain ingredients that break a fast even in small amounts — artificial sweeteners, certain oils, BCAAs, dairy, or anything with caloric or insulin response?\n3. What is the insulin response of this food?\n\nVerdict must be: "Fast-Safe", "Breaks Fast Mildly", or "Breaks Fast".\n\nReturn JSON: diet_compatibility ("Fast-Safe"/"Breaks Fast Mildly"/"Breaks Fast"), diet_reason, insulin_response ("Low"/"Moderate"/"High"), fast_breaking_ingredients (array of ingredient names that break the fast), glycemic_impact ("low"/"medium"/"high"), glycemic_reason, health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason. NEVER fail.`;

    case 'high_protein': {
      const protPer100Cal = enriched.calories > 0 ? Math.round((enriched.protein / enriched.calories) * 100 * 10) / 10 : 0;
      return `${pre}You are a sports nutrition and high-protein diet expert.\n${n}\nProtein per 100 calories: ${protPer100Cal}g.\n\nAnswer these SPECIFIC questions:\n1. What is the protein per 100 calories ratio? (${protPer100Cal}g per 100 kcal).\n2. Is this a high-quality complete protein source (contains all 9 essential amino acids)?\n3. What is the protein bioavailability (PDCAAS or DIAAS quality)?\n4. If protein per serving is under 15g, flag as "Low Protein" for this goal.\n\nPrimary metric shown is PROTEIN QUALITY SCORE, not total calories.\n\nReturn JSON: diet_compatibility ("High Protein"/"Low Protein"/"Moderate Protein"), diet_reason, protein_quality_score (1-100), is_complete_protein (boolean), bioavailability ("High"/"Medium"/"Low"), bioavailability_reason, protein_per_100cal (number), health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason. NEVER fail.`;
    }

    case 'mediterranean':
      return `${pre}You are a Mediterranean diet expert.\n${n}\n\nAnswer these SPECIFIC questions:\n1. Does this align with Mediterranean principles: olive oil, fish, vegetables, legumes, whole grains, nuts, moderate dairy?\n2. Does it contain processed ingredients, refined sugar, or seed oils that CONFLICT with Mediterranean eating?\n3. Is this food anti-inflammatory?\n\nVerdict must be: "Mediterranean Approved", "Occasional", or "Avoid".\n\nReturn JSON: diet_compatibility ("Mediterranean Approved"/"Occasional"/"Avoid"), diet_reason, anti_inflammatory (boolean), conflicting_ingredients (array of ingredient names that conflict), health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason, glycemic_impact ("low"/"medium"/"high"), glycemic_reason. NEVER fail.`;

    case 'paleo':
      return `${pre}You are a Paleo diet expert.\n${n}\n\nAnswer these SPECIFIC questions:\n1. Is EVERY ingredient something that existed before agriculture?\n2. Does it contain grains, legumes, dairy, refined sugar, seed oils, or any processed additive?\n3. Flag EVERY non-paleo ingredient by name.\n\nRULE: If ANY non-paleo ingredient exists, verdict is "Not Paleo" immediately.\n\nReturn JSON: diet_compatibility ("Paleo Approved"/"Not Paleo"), diet_reason, non_paleo_ingredients (array of ingredient names that disqualify), health_score (1-10), bloat_risk ("low"/"medium"/"high"), bloat_reason, glycemic_impact ("low"/"medium"/"high"), glycemic_reason. NEVER fail.`;

    default:
      return `${pre}You are a clinical nutritionist. ${n}\nUser's diet goal: ${dietMode}.\nReturn diet_compatibility ("yes"/"limit"/"no"), diet_reason, bloat_risk ("low"/"medium"/"high"), bloat_reason, glycemic_impact ("low"/"medium"/"high"), glycemic_reason, collagen_effect, inflammation ("Low"/"Medium"/"High"), appearance_tip, tomorrow_face, hormone_impact, hormone_note, gut_health, gut_note, processing_level ("Whole Food"/"Minimally Processed"/"Processed"/"Ultra Processed"), health_score (1-10). NEVER fail.`;
  }
}

/**
 * Schema for call 2 — wide enough to capture all diet fields
 */
export const call2Schema = {
  type: 'object',
  properties: {
    diet_compatibility: { type: 'string' },
    diet_reason: { type: 'string' },
    // appearance
    appearance_impact: { type: 'string' },
    appearance_reason: { type: 'string' },
    tomorrow_face: { type: 'string' },
    tomorrow_prediction: { type: 'string' },
    tomorrow_prediction_reason: { type: 'string' },
    collagen_effect: { type: 'string' },
    collagen_reason: { type: 'string' },
    hormone_effect: { type: 'string' },
    hormone_reason: { type: 'string' },
    hormone_impact: { type: 'string' },
    hormone_note: { type: 'string' },
    // shared
    bloat_risk: { type: 'string' },
    bloat_reason: { type: 'string' },
    glycemic_impact: { type: 'string' },
    glycemic_reason: { type: 'string' },
    health_score: { type: 'number' },
    skin_impact: { type: 'string' },
    processing_level: { type: 'string' },
    // allergy / gluten
    allergen_alert: { type: 'boolean' },
    allergen_alert_message: { type: 'string' },
    allergens_found: { type: 'array', items: { type: 'object' } },
    // diet-specific arrays
    non_carnivore_ingredients: { type: 'array', items: { type: 'string' } },
    non_paleo_ingredients: { type: 'array', items: { type: 'string' } },
    hidden_animal_ingredients: { type: 'array', items: { type: 'string' } },
    gluten_sources: { type: 'array', items: { type: 'string' } },
    fast_breaking_ingredients: { type: 'array', items: { type: 'string' } },
    conflicting_ingredients: { type: 'array', items: { type: 'string' } },
    hidden_sugars: { type: 'array', items: { type: 'string' } },
    // net carbs / protein
    net_carbs: { type: 'number' },
    protein_quality_score: { type: 'number' },
    is_complete_protein: { type: 'boolean' },
    bioavailability: { type: 'string' },
    bioavailability_reason: { type: 'string' },
    protein_per_100cal: { type: 'number' },
    // fat source
    fat_source_quality: { type: 'string' },
    // vegan
    protein_source_quality: { type: 'string' },
    b12_content: { type: 'string' },
    // insulin
    insulin_response: { type: 'string' },
    // anti-inflammatory
    anti_inflammatory: { type: 'boolean' },
    // gut / inflammation
    inflammation: { type: 'string' },
    gut_health: { type: 'string' },
    gut_note: { type: 'string' },
    appearance_tip: { type: 'string' },
    tomorrow_face_note: { type: 'string' },
    // misc
    is_processed: { type: 'boolean' },
    processing_note: { type: 'string' },
    hidden_gluten_risk: { type: 'boolean' },
    sebum_effect: { type: 'string' },
    skin_summary: { type: 'string' },
  },
};