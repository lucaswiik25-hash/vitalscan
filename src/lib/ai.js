import { supabase } from './supabase';

/**
 * Call Claude via dev proxy (/api/ai) or Supabase edge function (production).
 * Returns { result: parsed | string }
 */
export async function analyzeWithClaude({
  prompt,
  image_url,
  image_base64,
  image_media_type,
  response_json_schema,
}) {
  const body = { prompt, image_url, image_base64, image_media_type, response_json_schema };

  if (import.meta.env.DEV) {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI request failed');
    return data;
  }

  const { data, error } = await supabase.functions.invoke('analyze-with-claude', { body });
  if (error) throw error;
  return data;
}

/** Text-only LLM call — returns parsed JSON (or string) directly. */
export async function invokeLLM(params) {
  const { result } = await analyzeWithClaude(params);
  return result;
}
