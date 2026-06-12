/** Shared Anthropic API logic for Vite dev proxy and Supabase edge functions. */

export async function callAnthropic(apiKey, {
  prompt,
  image_url,
  image_base64,
  image_media_type,
  response_json_schema,
}) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const content = [];

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
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
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

  const res = await fetch('https://api.anthropic.com/v1/messages', {
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const message = await res.json();
  const text = message.content?.[0]?.text ?? '';

  if (response_json_schema) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let jsonStr = jsonMatch ? jsonMatch[0] : text;
    try {
      return { result: JSON.parse(jsonStr) };
    } catch {
      jsonStr = jsonStr
        .replace(/,\s*$/, '')
        .replace(/,\s*\]/, ']')
        .replace(/,\s*\}/, '}');
      const opens = (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length;
      const openBraces = (jsonStr.match(/\{/g) || []).length - (jsonStr.match(/\}/g) || []).length;
      jsonStr += ']'.repeat(Math.max(0, opens)) + '}'.repeat(Math.max(0, openBraces));
      return { result: JSON.parse(jsonStr) };
    }
  }

  return { result: text };
}
