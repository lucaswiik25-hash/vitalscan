/** Normalize Claude API responses into a plain result object. */
export function parseApiResponse(raw) {
  if (!raw) return {};
  if (raw.result != null) {
    return typeof raw.result === 'object' ? raw.result : { text: raw.result };
  }
  if (raw.data?.result != null) {
    return typeof raw.data.result === 'object' ? raw.data.result : { text: raw.data.result };
  }
  if (raw.data && typeof raw.data === 'object') {
    const d = raw.data;
    if (d.ingredients || d.verdict || d.product_name || d.safety_score || d.quality_score || d.name) return d;
  }
  if (typeof raw === 'object') {
    const keys = ['name', 'meal_type', 'ingredients', 'verdict', 'product_name', 'barcode_number',
      'diet_compatibility', 'calories', 'summary', 'insights', 'deficiencies', 'health_score'];
    if (keys.some((k) => k in raw)) return raw;
  }
  return {};
}
