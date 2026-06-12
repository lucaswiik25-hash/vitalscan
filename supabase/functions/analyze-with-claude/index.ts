import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, image_url, image_base64, image_media_type, response_json_schema } = await req.json();
    const content: Array<Record<string, unknown>> = [];

    if (image_base64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: image_media_type || 'image/jpeg',
          data: image_base64,
        },
      });
    } else if (image_url) {
      const imgRes = await fetch(image_url);
      const imgBuffer = await imgRes.arrayBuffer();
      const uint8 = new Uint8Array(imgBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: contentType, data: base64 },
      });
    }

    let finalPrompt = prompt;
    if (response_json_schema) {
      finalPrompt +=
        '\n\nYou MUST respond with valid JSON only. No markdown, no explanation — just raw JSON matching this schema:\n' +
        JSON.stringify(response_json_schema, null, 2);
    }
    content.push({ type: 'text', text: finalPrompt });

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${err}`);
    }

    const message = await anthropicRes.json();
    const text = message.content?.[0]?.text ?? '';

    if (response_json_schema) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let jsonStr = jsonMatch ? jsonMatch[0] : text;
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        jsonStr = jsonStr
          .replace(/,\s*$/, '')
          .replace(/,\s*\]/, ']')
          .replace(/,\s*\}/, '}');
        const opens = (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length;
        const openBraces = (jsonStr.match(/\{/g) || []).length - (jsonStr.match(/\}/g) || []).length;
        jsonStr += ']'.repeat(Math.max(0, opens)) + '}'.repeat(Math.max(0, openBraces));
        parsed = JSON.parse(jsonStr);
      }
      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
