import { createClient } from '@supabase/supabase-js';
import { requestCoachAnalysis } from '../../src/lib/gemini.js';

export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const VALID_CONTEXTS = ['workout', 'progress', 'recovery'];
const WORKOUT_ORDER_FIELDS = ['ended_at', 'completed_at', 'created_at', 'started_at'];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS,
    },
  });

const isMissingResourceError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return (
    error?.code === '42P01'
    || error?.code === '42703'
    || error?.code === 'PGRST204'
    || error?.code === 'PGRST205'
    || message.includes('could not find')
    || message.includes('column')
    || message.includes('schema cache')
  );
};

const getUser = async (supabase, req) => {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;

  const token = auth.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) return null;
  return user;
};

const getWorkoutTimestamp = (workout) =>
  workout?.ended_at
  || workout?.completed_at
  || workout?.created_at
  || workout?.started_at
  || null;

const getWorkoutDurationMinutes = (workout) => {
  const durationSeconds = Number(workout?.duration_seconds || 0);
  if (durationSeconds > 0) {
    return Math.round(durationSeconds / 60);
  }

  const durationMinutes = Number(workout?.duration_minutes || 0);
  if (durationMinutes > 0) {
    return Math.round(durationMinutes);
  }

  if (workout?.started_at && workout?.ended_at) {
    const diff = new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime();
    if (diff > 0) {
      return Math.round(diff / 60000);
    }
  }

  return 0;
};

const formatDate = (value) => {
  if (!value) return 'sem registro';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
};

const formatCheckin = (checkin) => {
  if (!checkin) return 'Sem check-ins recentes';

  const duration = Number(checkin.duration_minutes || 0);
  const date = formatDate(checkin.started_at_utc || checkin.created_at);
  return `${duration} min em ${date}`;
};

const sortByDateDesc = (rows = []) =>
  [...rows].sort((left, right) => {
    const leftTime = new Date(getWorkoutTimestamp(left) || 0).getTime();
    const rightTime = new Date(getWorkoutTimestamp(right) || 0).getTime();
    return rightTime - leftTime;
  });

const fetchRecentWorkouts = async (supabase, userId) => {
  for (const field of WORKOUT_ORDER_FIELDS) {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order(field, { ascending: false })
      .limit(30);

    if (!error) {
      return data || [];
    }

    if (!isMissingResourceError(error)) {
      throw error;
    }
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .limit(30);

  if (error) {
    if (isMissingResourceError(error)) return [];
    throw error;
  }

  return sortByDateDesc(data || []);
};

const fetchRecentCheckins = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('gym_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('started_at_utc', { ascending: false })
    .limit(5);

  if (error) {
    if (isMissingResourceError(error)) return [];
    throw error;
  }

  return data || [];
};

const fetchRecentPrs = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('exercise_prs')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    if (isMissingResourceError(error)) return [];
    throw error;
  }

  return data || [];
};

const toWorkoutLabel = (workout) => {
  if (!workout) return 'Nenhum treino recente';

  const title = workout.workout_name || `Treino ${workout.workout_key || ''}`.trim() || 'Treino';
  const date = formatDate(getWorkoutTimestamp(workout));
  const duration = getWorkoutDurationMinutes(workout);

  if (!duration) {
    return `${title} em ${date}`;
  }

  return `${title} em ${date} (${duration} min)`;
};

const getTrend = (workouts) => {
  const durations = workouts
    .slice(0, 6)
    .map(getWorkoutDurationMinutes)
    .filter((value) => value > 0);

  if (durations.length < 2) {
    return workouts.length >= 2 ? 'subindo' : 'caindo';
  }

  const midpoint = Math.max(1, Math.floor(durations.length / 2));
  const recent = durations.slice(0, midpoint);
  const previous = durations.slice(midpoint);

  if (!previous.length) {
    return recent[0] >= 45 ? 'subindo' : 'caindo';
  }

  const recentAverage = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAverage = previous.reduce((sum, value) => sum + value, 0) / previous.length;

  return recentAverage >= previousAverage ? 'subindo' : 'caindo';
};

const buildSummary = ({ context, workouts, checkins, prs }) => {
  const recentWorkouts = sortByDateDesc(workouts).slice(0, 7);
  const lastWorkout = recentWorkouts[0] || null;
  const averageDuration = recentWorkouts.length
    ? Math.round(
      recentWorkouts.reduce((sum, workout) => sum + getWorkoutDurationMinutes(workout), 0) / recentWorkouts.length,
    )
    : 0;

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const weeklyDays = new Set(
    workouts
      .filter((workout) => {
        const timestamp = getWorkoutTimestamp(workout);
        return timestamp && new Date(timestamp) >= weekStart;
      })
      .map((workout) => new Date(getWorkoutTimestamp(workout)).toISOString().slice(0, 10)),
  ).size;

  const trend = getTrend(recentWorkouts);
  const checkinSummary = checkins.length
    ? checkins.slice(0, 3).map(formatCheckin).join(', ')
    : 'Sem check-ins recentes';
  const prSummary = prs.length
    ? prs
      .slice(0, 3)
      .map((pr) => `${pr.exercise_id}: ${Number(pr.max_load || 0)}kg`)
      .join(', ')
    : 'Nenhum PR recente';

  const contextLine = {
    workout: 'Foco do pedido: qualidade do treino atual.',
    progress: 'Foco do pedido: progresso e evolucao de carga.',
    recovery: 'Foco do pedido: recuperacao e capacidade de voltar bem.',
  }[context];

  return {
    summaryText: [
      contextLine,
      `Ultimos 7 treinos analisados: ${recentWorkouts.length}`,
      `Dias treinados na semana: ${weeklyDays}`,
      `Media de duracao: ${averageDuration} min`,
      `Ultimo treino: ${toWorkoutLabel(lastWorkout)}`,
      `Tendencia: ${trend}`,
      `Ultimos check-ins: ${checkinSummary}`,
      `PRs: ${prSummary}`,
    ].join('\n'),
    insights: [
      `Dias treinados: ${weeklyDays}`,
      `Media de duracao: ${averageDuration} min`,
      `Ultimo treino: ${toWorkoutLabel(lastWorkout)}`,
      `Tendencia: ${trend}`,
    ],
    metrics: {
      context,
      recentWorkoutCount: recentWorkouts.length,
      weeklyDays,
      averageDuration,
      lastWorkoutLabel: toWorkoutLabel(lastWorkout),
      trend,
      latestCheckinLabel: checkins[0] ? formatCheckin(checkins[0]) : 'Sem check-ins recentes',
      hasPrs: prs.length > 0,
    },
  };
};

const buildCoachFallback = ({ context, metrics }) => {
  const durationLine = metrics.averageDuration > 0
    ? `media de ${metrics.averageDuration} min`
    : 'duracao ainda curta no historico';

  const analysis = metrics.recentWorkoutCount > 0
    ? `Analise: voce treinou ${metrics.weeklyDays} dia(s) na semana, com ${durationLine}, e sua tendencia esta ${metrics.trend}.`
    : 'Analise: ainda nao encontrei treinos recentes suficientes para uma leitura completa.';

  const recommendationByContext = {
    workout: metrics.recentWorkoutCount > 0
      ? `Recomendacao: repita o nivel do ultimo treino (${metrics.lastWorkoutLabel}) com execucao limpa e mais 1 serie forte no exercicio principal.`
      : 'Recomendacao: registre o proximo treino completo para eu calibrar volume, duracao e intensidade.',
    progress: metrics.hasPrs
      ? `Recomendacao: mantenha a progressao de carga com pequenos aumentos e proteja a tecnica nas series finais.`
      : 'Recomendacao: atualize cargas reais nos proximos treinos para liberar uma leitura melhor de progresso.',
    recovery: metrics.weeklyDays >= 4
      ? `Recomendacao: segure a intensidade por 24h, priorize sono e entre no proximo treino apenas se a energia voltar bem.`
      : `Recomendacao: voce pode seguir com o proximo treino, mas preserve pausas consistentes e ritmo controlado.`,
  };

  const motivation = metrics.recentWorkoutCount > 0
    ? 'Motivacao: seu historico ja mostra consistencia real; agora transforme isso em repeticao forte.'
    : 'Motivacao: o primeiro registro bem feito ja abre uma leitura muito mais precisa para voce.';

  return {
    message: [analysis, recommendationByContext[context], motivation].join('\n'),
    suggestions: [recommendationByContext[context].replace(/^Recomendacao:\s*/i, '')],
  };
};

const normalizeCoachMessage = (raw) => {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  const sections = {
    analysis: '',
    recommendation: '',
    motivation: '',
  };

  for (const line of lines) {
    const normalized = line
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized.startsWith('analise:')) {
      sections.analysis = line.split(':').slice(1).join(':').trim();
      continue;
    }

    if (normalized.startsWith('recomendacao:')) {
      sections.recommendation = line.split(':').slice(1).join(':').trim();
      continue;
    }

    if (normalized.startsWith('motivacao:')) {
      sections.motivation = line.split(':').slice(1).join(':').trim();
      continue;
    }

    if (!sections.analysis) {
      sections.analysis = line;
    } else if (!sections.recommendation) {
      sections.recommendation = line;
    } else if (!sections.motivation) {
      sections.motivation = line;
    }
  }

  return sections;
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: 'Server configuration error' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const user = await getUser(supabase, req);

  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const context = body?.context || 'workout';
  if (!VALID_CONTEXTS.includes(context)) {
    return json({ error: `context must be one of: ${VALID_CONTEXTS.join(', ')}` }, 400);
  }

  try {
    const [workouts, checkins, prs] = await Promise.all([
      fetchRecentWorkouts(supabase, user.id),
      fetchRecentCheckins(supabase, user.id),
      fetchRecentPrs(supabase, user.id),
    ]);

    const { summaryText, insights, metrics } = buildSummary({
      context,
      workouts,
      checkins,
      prs,
    });

    try {
      const rawMessage = await requestCoachAnalysis(summaryText);
      const normalized = normalizeCoachMessage(rawMessage);
      const message = [
        normalized.analysis,
        normalized.recommendation,
        normalized.motivation,
      ]
        .filter(Boolean)
        .join('\n');

      return json({
        message,
        insights,
        suggestions: [
          normalized.recommendation,
          normalized.motivation,
        ].filter(Boolean),
      });
    } catch (error) {
      console.error('[ai/coach]', error);
      const fallback = buildCoachFallback({ context, metrics });

      return json({
        message: fallback.message,
        insights,
        suggestions: fallback.suggestions,
      });
    }
  } catch (error) {
    console.error('[ai/coach]', error);
    return json({ error: 'AI unavailable' }, 503);
  }
}
