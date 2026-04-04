/**
 * ZYRON Coach — Groq AI Integration
 * Groq offers Llama 3.3-70B for free: https://console.groq.com
 * Free tier: 30 req/min, 14,400 req/day
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback chain — todos grátis no Groq
const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

/**
 * Build the system prompt with the user's live context.
 */
export function buildSystemPrompt(user, prHistory, workoutData) {
  const today = new Date().getDay();
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const todayWorkout = workoutData?.[today];

  const topPRs = Object.entries(prHistory || {})
    .slice(0, 8)
    .map(([id, load]) => `  • ${id}: ${load}kg`)
    .join('\n') || '  Nenhum PR registrado ainda.';

  return `Você é o ZYRON Coach, um personal trainer de IA de elite integrado ao app ZYRON.

Seu estilo: direto, motivador, técnico, sem enrolação. Foco absoluto em resultados.
Idioma: português brasileiro. Use emojis esportivos com moderação (⚡💪🔥).
Respostas curtas e objetivas. Máximo 3 parágrafos, salvo quando o atleta pedir detalhes.

## Perfil do Atleta
- Nome: ${user?.name || 'Atleta'}
- Peso: ${user?.weight || '?'}kg
- Objetivo: ${user?.goal || 'Hipertrofia'}
- Nível: ${user?.level || 'Intermediário'}

## Sessão de Hoje (${dayNames[today]})
- Treino: ${todayWorkout?.title || 'Descanso'}
- Foco: ${todayWorkout?.focus || '-'}
- Exercícios: ${todayWorkout?.exercises?.map(e => e.name).join(', ') || 'Nenhum'}
${todayWorkout?.cardio ? `- Cardio: ${todayWorkout.cardio}` : ''}

## Diretrizes Técnicas (ZYRON 5x)
- Descanso: 90s para multiarticulares (compostos) e 60s para isolados.
- Progressão: Aumentar carga progressivamente ao atingir o máximo de reps com boa execução.
- Cardio: Esteira pós-treino (exceto na quarta-feira, onde é feito ANTES do treino de perna).
- Intensidade: Foco em falha controlada e cadência perfeita.

## Melhores Marcas (PRs)
${topPRs}

## Diretrizes de Resposta
- Nunca invente fatos ou exercícios inexistentes.
- Se não souber, seja honesto.
- Mantenha o atleta motivado e focado.
- Slogan: Forje Sua Evolução. ⚡`;
}

/**
 * Send a message using Groq API (OpenAI-compatible format).
 * Falls back through model list on rate limit.
 */
export async function sendMessageToGemini(history, userMessage, systemInstruction) {
  if (!GROQ_API_KEY) {
    throw new Error('VITE_GROQ_API_KEY não configurada no .env — obtenha em console.groq.com');
  }

  // Convert history format to OpenAI messages format
  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts?.[0]?.text ?? h.content ?? ''
    })),
    { role: 'user', content: userMessage }
  ];

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    try {
      console.log(`[ZYRON Coach] Usando Groq/${model}`);

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.85,
          max_tokens: 1024,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        const is429 = res.status === 429;
        if (is429 && i < MODELS.length - 1) {
          console.log(`[ZYRON Coach] Rate limit em ${model}, tentando próximo...`);
          continue;
        }
        throw new Error(err.message || String(err));
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? 'Sem resposta.';

    } catch (err) {
      if (i === MODELS.length - 1) throw err;
    }
  }

  throw new Error('Todos os modelos estão indisponíveis. Tente novamente em instantes.');
}
