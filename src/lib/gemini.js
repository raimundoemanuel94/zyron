const GEMINI_MODEL = 'gemini-2.0-flash';

const readEnv = (key) => {
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }

  try {
    return import.meta?.env?.[key];
  } catch {
    return undefined;
  }
};

const getGeminiApiKey = () =>
  readEnv('GEMINI_API_KEY')
  || readEnv('VITE_GEMINI_API_KEY');

const buildGeminiUrl = (model = GEMINI_MODEL) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getGeminiApiKey()}`;

const getResponseText = (payload) => (
  payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('\n')
    .trim()
) || '';

export function buildSystemPrompt(profile, metrics, prHistory, workoutData) {
  const today = new Date().getDay();
  const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  const todayWorkout = workoutData?.[today];

  const topPRs = Object.entries(prHistory || {})
    .slice(0, 8)
    .map(([id, load]) => `- ${id}: ${load}kg`)
    .join('\n') || '- Nenhum PR registrado ainda.';

  return `Voce e o ZYRON Coach, um personal trainer de IA integrado ao app ZYRON.

Seu estilo: direto, motivador, tecnico e objetivo.
Idioma: portugues brasileiro.
Respostas curtas e objetivas.

Perfil do atleta:
- Nome: ${profile?.name || 'Atleta'}
- Peso: ${profile?.bio?.weightKg || '?'}kg
- Altura: ${profile?.bio?.heightCm || '?'}cm
- Objetivo: ${profile?.goals?.target || 'Hipertrofia'}
- Nivel: ${profile?.goals?.level || 'Intermediario'}

Metas oficiais:
- Agua: ${metrics?.waterGoalLiters || '?'}L
- Proteina: ${metrics?.proteinGoalG || '?'}g
- Calorias: ${metrics?.caloriesGoalKcal || '?'} kcal

Treino de hoje (${dayNames[today]}):
- Treino: ${todayWorkout?.title || 'Descanso'}
- Foco: ${todayWorkout?.focus || '-'}
- Exercicios: ${todayWorkout?.exercises?.map((exercise) => exercise.name).join(', ') || 'Nenhum'}

Melhores marcas:
${topPRs}`;
}

export const buildCoachPrompt = (summary) => `Voce e um coach fitness. Analise os dados:

${summary}

Responda com:
- analise curta
- recomendacao pratica
- tom motivador

Regras:
- maximo 5 linhas
- nada generico
- use apenas os dados enviados
- entregue exatamente 3 linhas:
Analise: ...
Recomendacao: ...
Motivacao: ...`;

export async function generateGeminiText(
  prompt,
  {
    model = GEMINI_MODEL,
    temperature = 0.55,
    maxOutputTokens = 220,
  } = {},
) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(buildGeminiUrl(model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: String(prompt || '') }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.error?.message
      || payload?.message
      || `Gemini HTTP ${response.status}`,
    );
  }

  const text = getResponseText(payload);
  if (!text) {
    throw new Error('Empty Gemini response');
  }

  return text;
}

export async function sendMessageToGemini(history = [], userMessage = '', systemInstruction = '') {
  const historyBlock = Array.isArray(history)
    ? history
      .map((item) => {
        const role = item?.role === 'model' ? 'assistant' : 'user';
        const text = item?.parts?.[0]?.text ?? item?.content ?? '';
        return `${role}: ${text}`;
      })
      .filter(Boolean)
      .join('\n')
    : '';

  const prompt = [
    systemInstruction ? `Instrucoes:\n${systemInstruction}` : '',
    historyBlock ? `Historico:\n${historyBlock}` : '',
    userMessage ? `Mensagem:\n${userMessage}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return generateGeminiText(prompt, {
    temperature: 0.7,
    maxOutputTokens: 512,
  });
}

export async function requestCoachAnalysis(summary) {
  return generateGeminiText(buildCoachPrompt(summary), {
    temperature: 0.45,
    maxOutputTokens: 220,
  });
}
