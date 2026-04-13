import { groqChat } from './_lib/groq.js';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });

const getUser = async (supabase, req) => {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  return error ? null : user;
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return json({ error: 'Server configuration error' }, 500);

  const supabase = createClient(supabaseUrl, supabaseKey);
  const user = await getUser(supabase, req);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { message, history = [], systemInstruction } = body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return json({ error: 'message is required' }, 400);
  }

  // Cap history to last 20 messages to avoid token bloat
  const cappedHistory = (Array.isArray(history) ? history : [])
    .slice(-20)
    .map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: String(h.parts?.[0]?.text ?? h.content ?? ''),
    }))
    .filter(h => h.content.trim());

  cappedHistory.push({ role: 'user', content: message.trim() });

  const system = systemInstruction || `Você é o ZYRON Coach, um personal trainer de IA de elite.
Seja direto, motivador, técnico, sem enrolação. Máximo 3 parágrafos.
Idioma: português brasileiro. Use emojis esportivos com moderação.`;

  try {
    const reply = await groqChat(system, cappedHistory, 1024);
    return json({ ok: true, reply });
  } catch (err) {
    console.error('[ai/chat]', err.message);
    return json({ error: 'AI unavailable', details: err.message }, 503);
  }
}
