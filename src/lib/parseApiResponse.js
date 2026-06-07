/** Normalize Base44 / Claude API responses into a plain result object. */
export function parseApiResponse(raw) {
  if (!raw) return {};
  if (raw.data?.result && typeof raw.data.result === 'object') return raw.data.result;
  if (raw.result && typeof raw.result === 'object') return raw.result;
  if (raw.data && typeof raw.data === 'object') {
    const d = raw.data;
    if (d.ingredients || d.verdict || d.product_name || d.safety_score || d.quality_score || d.name) return d;
  }
  if (raw.ingredients || raw.verdict || raw.product_name || raw.name) return raw;
  return {};
}
