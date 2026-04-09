const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

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

const getGroqApiKey = () =>
  readEnv('GROQ_API_KEY')
  || readEnv('VITE_GROQ_API_KEY');

const buildGeminiUrl = (model = GEMINI_MODEL) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getGeminiApiKey()}`;

const getResponseText = (payload) => (
  payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('\n')
    .trim()
) || '';

const getGroqText = (payload) =>
  payload?.choices?.[0]?.message?.content?.trim() || '';

async function generateGroqText(
  prompt,
  {
    temperature = 0.55,
    maxOutputTokens = 220,
  } = {},
) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const messages = [
    {
      role: 'system',
      content: 'Siga estritamente o formato pedido pelo usuario e use portugues brasileiro quando a instrucao estiver em portugues.',
    },
    {
      role: 'user',
      content: String(prompt || ''),
    },
  ];

  for (const model of GROQ_MODELS) {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxOutputTokens,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 429) {
        continue;
      }

      throw new Error(
        payload?.error?.message
        || payload?.message
        || `Groq HTTP ${response.status}`,
      );
    }

    const text = getGroqText(payload);
    if (text) {
      return text;
    }
  }

  throw new Error('All Groq models unavailable');
}

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

export const buildCoachPrompt = (
  summary,
  {
    question = '',
    intentLabel = '',
    draftAnswer = '',
    draftReasoning = [],
    preferredAction = '',
  } = {},
) => `Voce e um coach fitness de alta performance. Analise somente os dados reais abaixo:

${summary}

${question ? `Pergunta do usuario: ${question}` : ''}
${intentLabel ? `Intencao validada: ${intentLabel}` : ''}
${draftAnswer ? `Resposta base para manter especificidade: ${draftAnswer}` : ''}
${draftReasoning?.length ? `Raciocinio base: ${draftReasoning.join(' | ')}` : ''}
${preferredAction ? `Acao preferida quando fizer sentido: ${preferredAction}` : ''}

Regras:
- responda somente sobre treino, recuperacao, evolucao, frequencia ou proxima sessao
- cite o ultimo treino pelo nome quando existir
- cite o padrao do usuario: frequencia, comparacao com a semana passada e tempo desde o ultimo treino
- a recomendacao precisa ser concreta para a proxima sessao
- evite frases genericas como "descanse", "continue assim" ou "mantenha consistencia"
- se faltar dado, diga isso e oriente a proxima acao
- nunca invente dado
- use apenas os dados enviados
- no maximo 3 linhas
- cada linha deve ser curta e objetiva
- entregue exatamente 3 linhas neste formato:
Resposta: ...
Raciocinio: item 1 | item 2
Acao: ...`;

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
    return generateGroqText(prompt, {
      temperature,
      maxOutputTokens,
    });
  }

  try {
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
  } catch (error) {
    if (!getGroqApiKey()) {
      throw error;
    }

    return generateGroqText(prompt, {
      temperature,
      maxOutputTokens,
    });
  }
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

export async function requestCoachAnalysis(summary, options = {}) {
  return generateGeminiText(buildCoachPrompt(summary, options), {
    temperature: 0.35,
    maxOutputTokens: 180,
  });
}
