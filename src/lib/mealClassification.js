const BREAKFAST_KEYWORDS = /oat|cereal|pancake|waffle|egg|toast|yogurt|granola|smoothie|porridge|muesli|bagel|croissant|breakfast/i;
const LUNCH_KEYWORDS = /sandwich|salad|soup|wrap|burger|pasta|rice bowl|lunch/i;
const DINNER_KEYWORDS = /steak|chicken|fish|salmon|dinner|roast|curry|stew|pizza/i;
const SNACK_KEYWORDS = /bar|chip|cookie|cracker|nut|fruit|snack|protein shake/i;

export function inferMealTypeFromTime(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return { meal_type: 'breakfast', confidence: 0.75, source: 'time' };
  if (hour >= 11 && hour < 15) return { meal_type: 'lunch', confidence: 0.75, source: 'time' };
  if (hour >= 17 && hour < 22) return { meal_type: 'dinner', confidence: 0.75, source: 'time' };
  if (hour >= 15 && hour < 17) return { meal_type: 'snack', confidence: 0.55, source: 'time' };
  return { meal_type: 'snack', confidence: 0.3, source: 'time' };
}

export function inferMealTypeFromFood(foodName) {
  const name = foodName || '';
  if (BREAKFAST_KEYWORDS.test(name)) return { meal_type: 'breakfast', confidence: 0.85, source: 'food' };
  if (LUNCH_KEYWORDS.test(name)) return { meal_type: 'lunch', confidence: 0.8, source: 'food' };
  if (DINNER_KEYWORDS.test(name)) return { meal_type: 'dinner', confidence: 0.8, source: 'food' };
  if (SNACK_KEYWORDS.test(name)) return { meal_type: 'snack', confidence: 0.7, source: 'food' };
  return null;
}

export function shouldAskMealSlot({ foodInference, timeInference, llmConfidence }) {
  if (llmConfidence >= 0.85) return false;
  if (foodInference?.confidence >= 0.8) return false;
  if (timeInference.confidence >= 0.7 && timeInference.meal_type !== 'snack') return false;
  return true;
}
