// Groq client — server-side only
// Key: GROQ_API_KEY (no VITE_ prefix — never exposed to browser)

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

/**
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} [maxTokens=512]
 */
export async function groqComplete(systemPrompt, userMessage, maxTokens = 512) {
  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  for (let i = 0; i < MODELS.length; i++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODELS[i],
        messages,
        temperature: 0.75,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      if (res.status === 429 && i < MODELS.length - 1) continue;
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  throw new Error('All Groq models unavailable');
}

/**
 * Chat relay — passes full history
 * @param {string} systemPrompt
 * @param {Array<{role: string, content: string}>} messages
 * @param {number} [maxTokens=1024]
 */
export async function groqChat(systemPrompt, messages, maxTokens = 1024) {
  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');

  const payload = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  for (let i = 0; i < MODELS.length; i++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODELS[i],
        messages: payload,
        temperature: 0.85,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      if (res.status === 429 && i < MODELS.length - 1) continue;
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  throw new Error('All Groq models unavailable');
}
