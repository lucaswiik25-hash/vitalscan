/**
 * Base44 AI shim — replaces old Supabase ai.js
 * Routes all AI calls through base44.functions.invoke('analyzeWithClaude')
 */
import { base44 } from '@/api/base44Client';
import { parseApiResponse } from './parseApiResponse';

export async function analyzeWithClaude({ prompt, image_url, response_json_schema }) {
  const rraw = await base44.functions.invoke('analyzeWithClaude', {
    prompt,
    image_url,
    response_json_schema,
  });
  const result = parseApiResponse(rraw);
  return { result };
}

export async function invokeLLM(params) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: params.prompt,
    response_json_schema: params.response_json_schema,
    file_urls: params.image_url ? [params.image_url] : undefined,
  });
  return res;
}