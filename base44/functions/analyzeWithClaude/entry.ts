import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Anthropic from 'npm:@anthropic-ai/sdk@0.24.3';

Deno.serve(async (req) => {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
  });

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prompt, image_url, response_json_schema } = await req.json();

  const content = [];

  // Add image if provided
  if (image_url) {
    // Fetch the image and convert to base64
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
      source: {
        type: 'base64',
        media_type: contentType,
        data: base64,
      },
    });
  }

  // Add the text prompt
  let finalPrompt = prompt;
  if (response_json_schema) {
    finalPrompt += '\n\nYou MUST respond with valid JSON only. No markdown, no explanation — just raw JSON matching this schema:\n' + JSON.stringify(response_json_schema, null, 2);
  }
  content.push({ type: 'text', text: finalPrompt });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8192,
    messages: [{ role: 'user', content }],
  });

  const text = message.content[0].text;

  if (response_json_schema) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let jsonStr = jsonMatch ? jsonMatch[0] : text;
    // Attempt to fix truncated JSON by closing open arrays/objects
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (_) {
      // Try to salvage truncated JSON by trimming to last complete element
      jsonStr = jsonStr.replace(/,\s*$/, '').replace(/,\s*\]/, ']').replace(/,\s*\}/, '}');
      // Close any unclosed arrays/objects
      const opens = (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length;
      const openBraces = (jsonStr.match(/\{/g) || []).length - (jsonStr.match(/\}/g) || []).length;
      jsonStr += ']'.repeat(Math.max(0, opens)) + '}'.repeat(Math.max(0, openBraces));
      parsed = JSON.parse(jsonStr);
    }
    return Response.json({ result: parsed });
  }

  return Response.json({ result: text });
});