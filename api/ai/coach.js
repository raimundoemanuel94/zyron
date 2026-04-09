import { createClient } from '@supabase/supabase-js';
import { requestCoachAnalysis } from '../../src/lib/gemini.js';

export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const VALID_CONTEXTS = ['workout', 'progress', 'recovery', 'question'];
const WORKOUT_ORDER_FIELDS = ['ended_at', 'completed_at', 'created_at', 'started_at'];
const DAY_MS = 86400000;
const PERSONAL_TARGET_MIN = 3;
const PERSONAL_TARGET_MAX = 5;
const QUESTION_MAX_LENGTH = 120;

const KNOWN_WORKOUTS = {
  0: { title: 'Descanso Ativo', focus: 'Recuperacao' },
  1: { title: 'Peito + Triceps', focus: 'Hipertrofia - Empurre' },
  2: { title: 'Costas + Biceps', focus: 'Hipertrofia - Puxe' },
  3: { title: 'Pernas', focus: 'Membros Inferiores' },
  4: { title: 'Ombro', focus: 'Hipertrofia - Deltoides' },
  5: { title: 'Biceps + Triceps', focus: 'Bracos e Definicao' },
  6: { title: 'Descanso Ativo', focus: 'Recuperacao' },
};

const GENERIC_PATTERNS = [
  'continue assim',
  'mantenha consistencia',
  'mantenha a consistencia',
  'descanse hoje',
  'apenas descanse',
  'hidrate se',
  'hidrate-se',
  'durma bem',
  'sem exageros',
];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS,
    },
  });

const normalizeText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const containsAny = (value, tokens = []) => {
  const normalized = normalizeText(value);
  return tokens.some((token) => normalized.includes(token));
};

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

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

const toPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const getKnownWorkoutMeta = (workout) => {
  const key = String(workout?.workout_key ?? '').trim();
  return KNOWN_WORKOUTS[key] || null;
};

const hasWorkoutSignal = (workout) => Boolean(
  workout
  && (
    workout?.workout_name
    || workout?.workout_key !== undefined
    || getWorkoutTimestamp(workout)
    || toPositiveNumber(workout?.duration_minutes)
    || toPositiveNumber(workout?.duration_seconds)
  ),
);

const getWorkoutDurationMinutes = (workout) => {
  if (!workout) return 0;

  const durationMinutes = toPositiveNumber(workout.duration_minutes);
  if (durationMinutes > 0) {
    return Math.max(1, Math.round(durationMinutes));
  }

  if (workout.started_at && workout.ended_at) {
    const diffMs = new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime();
    if (diffMs > 0) {
      return Math.max(1, Math.round(diffMs / 60000));
    }
  }

  const durationSeconds = toPositiveNumber(workout.duration_seconds);
  if (durationSeconds > 0) {
    return Math.max(1, Math.round(durationSeconds / 60));
  }

  return hasWorkoutSignal(workout) ? 1 : 0;
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

const getWorkoutTitle = (workout) => {
  if (!workout) return 'Nenhum treino recente';

  const explicitTitle = String(workout.workout_name || '').trim();
  if (explicitTitle) return explicitTitle;

  const knownWorkout = getKnownWorkoutMeta(workout);
  if (knownWorkout?.title) return knownWorkout.title;

  const workoutKey = String(workout.workout_key || '').trim();
  return workoutKey ? `Treino ${workoutKey}` : 'Treino';
};

const getWorkoutBucket = (value) => {
  const normalized = normalizeText(value);

  if (!normalized) return 'generic';
  if (normalized.includes('perna') || normalized.includes('inferior') || normalized.includes('gluteo')) return 'lower';
  if (normalized.includes('peito') || normalized.includes('triceps') || normalized.includes('empurre')) return 'push';
  if (normalized.includes('costa') || normalized.includes('biceps') || normalized.includes('puxe')) return 'pull';
  if (normalized.includes('ombro') || normalized.includes('deltoide')) return 'shoulders';
  if (normalized.includes('braco')) return 'arms';
  if (normalized.includes('recuper')) return 'recovery';
  return 'generic';
};

const inferFocusFromTitle = (title) => {
  const bucket = getWorkoutBucket(title);

  if (bucket === 'lower') return 'Membros Inferiores';
  if (bucket === 'push') return 'Superior - Empurre';
  if (bucket === 'pull') return 'Superior - Puxe';
  if (bucket === 'shoulders') return 'Deltoides';
  if (bucket === 'arms') return 'Bracos';
  if (bucket === 'recovery') return 'Recuperacao';
  return 'Treino Geral';
};

const getWorkoutFocus = (workout) => {
  const knownWorkout = getKnownWorkoutMeta(workout);
  if (knownWorkout?.focus) return knownWorkout.focus;

  return inferFocusFromTitle(getWorkoutTitle(workout));
};

const sortByDateDesc = (rows = []) =>
  [...rows].sort((left, right) => {
    const leftTime = new Date(getWorkoutTimestamp(left) || 0).getTime();
    const rightTime = new Date(getWorkoutTimestamp(right) || 0).getTime();
    return rightTime - leftTime;
  });

const toDayKey = (value) => {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDayDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const countDistinctWorkoutDays = (workouts, startInclusive, endExclusive) => {
  const keys = new Set();

  workouts.forEach((workout) => {
    const timestamp = getWorkoutTimestamp(workout);
    if (!timestamp) return;

    const date = new Date(timestamp);
    if (date >= startInclusive && date < endExclusive) {
      keys.add(toDayKey(timestamp));
    }
  });

  return keys.size;
};

const getFrequencyStatus = (current, target) => {
  if (current >= target) return 'bom';
  if (current === Math.max(1, target - 1)) return 'quase no alvo';
  return 'abaixo do alvo';
};

const getWeeklyComparison = (current, previous) => {
  if (current === 0 && previous === 0) {
    return {
      short: 'ainda sem base recente de comparacao',
      long: 'sem treinos nas ultimas duas semanas',
    };
  }

  if (previous === 0) {
    return {
      short: `abriu ${current}x nesta janela sem base da semana passada`,
      long: `sem base fechada da semana passada; abriu ${current} treino(s) agora`,
    };
  }

  if (current > previous) {
    return {
      short: `subiu em relacao a semana passada (${previous}x)`,
      long: `subiu de ${previous}x para ${current}x`,
    };
  }

  if (current < previous) {
    return {
      short: `caiu em relacao a semana passada (${previous}x)`,
      long: `caiu de ${previous}x para ${current}x`,
    };
  }

  return {
    short: `manteve o ritmo da semana passada (${previous}x)`,
    long: `repetiu ${current}x nas duas janelas`,
  };
};

const getTimeSinceLastWorkout = (workout) => {
  if (!workout) {
    return {
      days: null,
      label: 'sem registro recente',
    };
  }

  const diffMs = Date.now() - new Date(getWorkoutTimestamp(workout)).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / DAY_MS));

  if (diffDays === 0) {
    return { days: 0, label: 'hoje' };
  }

  if (diffDays === 1) {
    return { days: 1, label: '1 dia' };
  }

  return {
    days: diffDays,
    label: `${diffDays} dias`,
  };
};

const getAverageGapDays = (workouts) => {
  const recent = workouts.slice(0, 5);
  if (recent.length < 2) return null;

  const gaps = [];
  for (let index = 0; index < recent.length - 1; index += 1) {
    const current = new Date(getWorkoutTimestamp(recent[index])).getTime();
    const previous = new Date(getWorkoutTimestamp(recent[index + 1])).getTime();
    const gapDays = Math.round((current - previous) / DAY_MS);

    if (gapDays > 0) {
      gaps.push(gapDays);
    }
  }

  if (!gaps.length) return null;
  return Math.round(gaps.reduce((sum, value) => sum + value, 0) / gaps.length);
};

const getRecentPatternSummary = (workouts, averageGapDays) => {
  const recent = workouts.slice(0, 5);
  if (!recent.length) {
    return 'Sem padrao suficiente ainda.';
  }

  const titleCounts = new Map();
  recent.forEach((workout) => {
    const title = getWorkoutTitle(workout);
    titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
  });

  const [topTitle = '', topCount = 0] = [...titleCounts.entries()]
    .sort((left, right) => right[1] - left[1])[0] || [];

  if (topCount > 1 && averageGapDays) {
    return `${topTitle} apareceu ${topCount}x nos ultimos ${recent.length} treinos, com ritmo medio de ${averageGapDays} dia(s) entre sessoes.`;
  }

  const titles = recent.slice(0, 3).map(getWorkoutTitle);
  if (averageGapDays) {
    return `ritmo medio de ${averageGapDays} dia(s) entre sessoes, alternando ${titles.join(' -> ')}.`;
  }

  return `ultimos treinos: ${titles.join(' -> ')}.`;
};

const getTrend = (workouts) => {
  const durations = workouts
    .slice(0, 6)
    .map(getWorkoutDurationMinutes)
    .filter((value) => value > 0);

  if (durations.length < 2) {
    return workouts.length >= 2 ? 'subindo' : 'estavel';
  }

  const midpoint = Math.max(1, Math.floor(durations.length / 2));
  const recent = durations.slice(0, midpoint);
  const previous = durations.slice(midpoint);

  if (!previous.length) {
    return 'estavel';
  }

  const recentAverage = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAverage = previous.reduce((sum, value) => sum + value, 0) / previous.length;

  if (Math.abs(recentAverage - previousAverage) < 4) {
    return 'estavel';
  }

  return recentAverage > previousAverage ? 'subindo' : 'caindo';
};

const classifyCoachQuestion = (question = '') => {
  const normalized = normalizeText(question);

  if (!normalized) {
    return {
      valid: false,
      intent: 'off_topic',
      label: 'Pergunta fora do foco',
      effectiveContext: 'workout',
    };
  }

  const offTopicTokens = [
    'dieta',
    'nutricao',
    'suplement',
    'financa',
    'dinheiro',
    'relacion',
    'trabalho',
    'playlist',
    'musica',
    'filme',
  ];

  if (containsAny(normalized, offTopicTokens)) {
    return {
      valid: false,
      intent: 'off_topic',
      label: 'Pergunta fora do foco',
      effectiveContext: 'workout',
    };
  }

  const allowedTokens = [
    'treino',
    'treinar',
    'recuper',
    'descans',
    'evolu',
    'progres',
    'frequenc',
    'sessao',
    'carga',
    'serie',
    'ajust',
    'hoje',
    'amanha',
    'proximo',
    'proxima',
  ];

  if (!containsAny(normalized, allowedTokens)) {
    return {
      valid: false,
      intent: 'off_topic',
      label: 'Pergunta fora do foco',
      effectiveContext: 'workout',
    };
  }

  if (containsAny(normalized, ['descans', 'recuper', 'cansad', 'fadiga', 'sono'])) {
    return {
      valid: true,
      intent: 'rest_today',
      label: 'Descanso hoje',
      effectiveContext: 'recovery',
    };
  }

  if (containsAny(normalized, ['frequenc', 'ritmo', 'constancia', 'consistencia', 'quantas vezes'])) {
    return {
      valid: true,
      intent: 'frequency_check',
      label: 'Frequencia atual',
      effectiveContext: 'progress',
    };
  }

  if (containsAny(normalized, ['evolu', 'progres', 'carga', 'recorde', 'melhorei'])) {
    return {
      valid: true,
      intent: 'progress_status',
      label: 'Evolucao atual',
      effectiveContext: 'progress',
    };
  }

  if (containsAny(normalized, ['ajust', 'proximo treino', 'proxima sessao', 'sessao seguinte'])) {
    return {
      valid: true,
      intent: 'next_adjustment',
      label: 'Ajuste na proxima sessao',
      effectiveContext: 'workout',
    };
  }

  if (containsAny(normalized, ['treinar hoje', 'faco hoje', 'faço hoje', 'que treino hoje', 'o que treinar hoje'])) {
    return {
      valid: true,
      intent: 'workout_today',
      label: 'Treino de hoje',
      effectiveContext: 'workout',
    };
  }

  if (containsAny(normalized, ['treino', 'treinar', 'sessao', 'hoje'])) {
    return {
      valid: true,
      intent: 'workout_today',
      label: 'Treino de hoje',
      effectiveContext: 'workout',
    };
  }

  return {
    valid: false,
    intent: 'off_topic',
    label: 'Pergunta fora do foco',
    effectiveContext: 'workout',
  };
};

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

  const title = getWorkoutTitle(workout);
  const date = formatDate(getWorkoutTimestamp(workout));
  const duration = getWorkoutDurationMinutes(workout);

  return `${title} em ${date} (${duration} min)`;
};

const getNextSessionLabel = (metrics) => {
  if (!metrics.recentWorkoutCount) return 'o proximo treino util';

  switch (metrics.lastWorkoutBucket) {
    case 'lower':
      return metrics.daysSinceLastWorkout === 0 ? 'descanso ativo ou superior leve' : 'superior leve';
    case 'push':
      return 'puxada de superior';
    case 'pull':
      return 'empurre de superior';
    case 'shoulders':
      return 'pernas ou puxada de superior';
    case 'arms':
      return 'pernas ou empurre de superior';
    case 'recovery':
      return 'sessao principal do ciclo';
    default:
      return metrics.daysSinceLastWorkout >= 2
        ? `retorno progressivo em ${metrics.lastWorkoutTitle.toLowerCase()}`
        : 'sessao complementar ao ultimo treino';
  }
};

const buildQuestionAction = ({ questionMeta, metrics }) => {
  switch (questionMeta?.intent) {
    case 'workout_today':
      if (metrics.daysSinceLastWorkout === 0) {
        return `use descanso ativo agora e volte amanha com ${metrics.nextSessionLabel}`;
      }
      return `hoje entre em ${metrics.nextSessionLabel} com 2 series de aproximacao antes da carga principal`;
    case 'rest_today':
      if (metrics.daysSinceLastWorkout === 0) {
        return `fique no descanso ativo hoje e reabra amanha com ${metrics.nextSessionLabel}`;
      }
      if (metrics.daysSinceLastWorkout >= 2 && metrics.weeklyDays < metrics.personalTargetFrequency) {
        return `nao feche descanso hoje; faca ${metrics.nextSessionLabel} com carga controlada`;
      }
      return `se descansar hoje, volte amanha com ${metrics.nextSessionLabel} e sem falha nas primeiras series`;
    case 'progress_status':
      if (metrics.trend === 'subindo') {
        return `mantenha progressao de carga em ${metrics.lastWorkoutTitle} e suba so se a ultima serie sair limpa`;
      }
      return `repita ${metrics.lastWorkoutTitle} buscando 1 a 2 reps extras antes de subir carga`;
    case 'frequency_check':
      if (metrics.weeklyDays < metrics.personalTargetFrequency) {
        return `encaixe mais ${metrics.personalTargetFrequency - metrics.weeklyDays} sessao(oes) nesta janela para voltar ao seu padrao`;
      }
      return 'mantenha a cadencia atual e preserve o mesmo intervalo entre sessoes';
    case 'next_adjustment':
      if (metrics.lastWorkoutBucket === 'lower') {
        return 'no proximo treino, alivie pernas e entre em superior com tecnica limpa';
      }
      return `no proximo ${metrics.lastWorkoutTitle}, faca 2 series de aproximacao e suba carga so se a ultima serie sair limpa`;
    default:
      return '';
  }
};

const buildPrimarySuggestion = ({ context, metrics }) => {
  const lastTitle = metrics.lastWorkoutTitle !== 'Nenhum treino recente'
    ? metrics.lastWorkoutTitle.toLowerCase()
    : 'proximo treino';

  if (context === 'recovery') {
    if (metrics.lastWorkoutBucket === 'lower') {
      return 'amanha faca treino leve de superior e preserve pernas sem falha';
    }

    if (metrics.daysSinceLastWorkout >= 2) {
      return `volte hoje com carga controlada no primeiro bloco de ${lastTitle}`;
    }

    if (metrics.lastWorkoutBucket === 'push') {
      return 'amanha faca puxada leve de superior com tecnica limpa';
    }

    if (metrics.lastWorkoutBucket === 'pull') {
      return 'amanha faca empurre leve de superior sem levar a falha';
    }

    return 'retorne com carga progressiva no proximo treino util, sem cortar aquecimento';
  }

  if (context === 'progress') {
    if (metrics.trend === 'subindo') {
      return `retorne com carga progressiva no proximo treino de ${lastTitle} se a tecnica seguir limpa`;
    }

    if (metrics.weeklyDays < metrics.personalTargetFrequency) {
      return `encaixe mais 1 sessao nesta janela e repita ${lastTitle} sem cortar series principais`;
    }

    return `repita ${lastTitle} com a mesma base e busque 1 a 2 reps extras antes de subir carga`;
  }

  if (metrics.daysSinceLastWorkout >= 3) {
    return `volte hoje e use 2 series de aproximacao antes da carga principal de ${lastTitle}`;
  }

  if (metrics.lastWorkoutBucket === 'lower') {
    return 'amanha faca treino leve de superior para alternar o estimulo';
  }

  if (metrics.lastWorkoutBucket === 'push') {
    return 'no proximo treino, entre em puxada de superior com carga progressiva e pausa curta';
  }

  if (metrics.lastWorkoutBucket === 'pull') {
    return 'no proximo treino, volte para empurre de superior com carga progressiva e tecnica limpa';
  }

  return `retorne com carga progressiva no proximo treino de ${lastTitle}`;
};

const buildSupportSuggestion = (metrics) => {
  if (metrics.weeklyDays < metrics.personalTargetFrequency) {
    const missingSessions = metrics.personalTargetFrequency - metrics.weeklyDays;
    return `feche ${metrics.personalTargetFrequency}x na janela atual com mais ${missingSessions} sessao(oes) para retomar seu padrao`;
  }

  if (metrics.averageDuration > 0) {
    return `mantenha as proximas sessoes perto de ${metrics.averageDuration} min para sustentar o ritmo atual`;
  }

  return 'registre inicio e fim do treino para refinar a leitura das proximas sessoes';
};

const buildSmartSuggestions = ({ context, questionMeta, metrics }) => {
  const suggestions = [
    buildQuestionAction({ questionMeta, metrics }),
    buildPrimarySuggestion({ context: questionMeta?.effectiveContext || context, metrics }),
    buildSupportSuggestion(metrics),
  ].filter(Boolean);

  return [...new Set(suggestions)].slice(0, 2);
};

const buildSummary = ({ context, questionMeta, workouts, checkins, prs }) => {
  const trackedWorkouts = sortByDateDesc(workouts).filter(hasWorkoutSignal);
  const recentWorkouts = trackedWorkouts.slice(0, 7);
  const lastWorkout = recentWorkouts[0] || null;
  const averageDuration = recentWorkouts.length
    ? Math.round(
      recentWorkouts.reduce((sum, workout) => sum + getWorkoutDurationMinutes(workout), 0) / recentWorkouts.length,
    )
    : 0;

  const todayStart = startOfDayDaysAgo(0);
  const tomorrowStart = addDays(todayStart, 1);
  const currentWeekStart = startOfDayDaysAgo(6);
  const previousWeekStart = startOfDayDaysAgo(13);
  const thirdWeekStart = startOfDayDaysAgo(20);

  const weeklyDays = countDistinctWorkoutDays(trackedWorkouts, currentWeekStart, tomorrowStart);
  const previousWeekDays = countDistinctWorkoutDays(trackedWorkouts, previousWeekStart, currentWeekStart);
  const thirdWeekDays = countDistinctWorkoutDays(trackedWorkouts, thirdWeekStart, previousWeekStart);

  const targetSamples = [weeklyDays, previousWeekDays, thirdWeekDays].filter((value) => value > 0);
  const personalTargetFrequency = targetSamples.length
    ? clamp(
      Math.round(targetSamples.reduce((sum, value) => sum + value, 0) / targetSamples.length),
      PERSONAL_TARGET_MIN,
      PERSONAL_TARGET_MAX,
    )
    : 4;

  const frequencyStatus = getFrequencyStatus(weeklyDays, personalTargetFrequency);
  const comparison = getWeeklyComparison(weeklyDays, previousWeekDays);
  const timeSinceLastWorkout = getTimeSinceLastWorkout(lastWorkout);
  const averageGapDays = getAverageGapDays(recentWorkouts);
  const trend = getTrend(recentWorkouts);
  const lastWorkoutTitle = getWorkoutTitle(lastWorkout);
  const lastWorkoutFocus = getWorkoutFocus(lastWorkout);
  const lastWorkoutBucket = getWorkoutBucket(`${lastWorkoutTitle} ${lastWorkoutFocus}`);
  const patternSummary = getRecentPatternSummary(recentWorkouts, averageGapDays);
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
    workout: 'Foco do pedido: qualidade e encaixe do proximo treino.',
    progress: 'Foco do pedido: progresso, frequencia e evolucao de carga.',
    recovery: 'Foco do pedido: recuperacao e melhor momento para voltar.',
  }[context];

  const metrics = {
    context,
    recentWorkoutCount: recentWorkouts.length,
    weeklyDays,
    previousWeekDays,
    personalTargetFrequency,
    frequencyStatus,
    comparisonShort: comparison.short,
    comparisonLong: comparison.long,
    averageDuration,
    trend,
    lastWorkoutTitle,
    lastWorkoutFocus,
    lastWorkoutBucket,
    lastWorkoutLabel: toWorkoutLabel(lastWorkout),
    timeSinceLastWorkoutLabel: timeSinceLastWorkout.label,
    daysSinceLastWorkout: timeSinceLastWorkout.days,
    latestCheckinLabel: checkins[0] ? formatCheckin(checkins[0]) : 'Sem check-ins recentes',
    hasPrs: prs.length > 0,
    patternSummary,
  };

  metrics.nextSessionLabel = getNextSessionLabel(metrics);

  const suggestions = buildSmartSuggestions({ context, questionMeta, metrics });

  return {
    summaryText: [
      contextLine,
      questionMeta?.valid ? `Pergunta validada: ${questionMeta.label}` : '',
      `Ultimo treino: ${lastWorkoutTitle} | foco ${lastWorkoutFocus}`,
      `Tempo desde o ultimo treino: ${timeSinceLastWorkout.label}`,
      `Frequencia atual: ${weeklyDays}x | meta pessoal: ${personalTargetFrequency}x | semana passada: ${previousWeekDays}x`,
      `Comparacao semanal: ${comparison.long}`,
      `Media de duracao real: ${averageDuration} min`,
      `Tendencia de duracao: ${trend}`,
      `Padrao recente: ${patternSummary}`,
      `Ultimos check-ins: ${checkinSummary}`,
      `PRs: ${prSummary}`,
      `Sugestao concreta preferida: ${suggestions[0] || 'Sem sugestao suficiente ainda.'}`,
    ].filter(Boolean).join('\n'),
    suggestions,
    metrics,
  };
};

const buildReasoning = ({ metrics, questionMeta }) => {
  const reasoning = [
    `Frequencia atual ${metrics.weeklyDays}x vs ${metrics.previousWeekDays}x na semana passada.`,
    metrics.recentWorkoutCount
      ? `Ultimo treino ${metrics.lastWorkoutTitle} ha ${metrics.timeSinceLastWorkoutLabel}.`
      : 'Ainda sem historico recente suficiente.',
    questionMeta?.effectiveContext === 'recovery' && metrics.latestCheckinLabel !== 'Sem check-ins recentes'
      ? `Check-in recente: ${metrics.latestCheckinLabel}.`
      : metrics.averageDuration > 0
        ? `Media de ${metrics.averageDuration} min com tendencia ${metrics.trend}.`
        : `Padrao recente: ${metrics.patternSummary}`,
  ].filter(Boolean);

  if ((questionMeta?.effectiveContext === 'progress' || questionMeta?.intent === 'progress_status') && metrics.hasPrs) {
    reasoning.push('Ha PRs recentes registrados no historico.');
  }

  return [...new Set(reasoning)].slice(0, 3);
};

const deriveConfidence = ({ metrics, questionMeta }) => {
  let score = 0;

  if (metrics.recentWorkoutCount >= 3) score += 2;
  else if (metrics.recentWorkoutCount >= 1) score += 1;

  if (metrics.averageDuration > 0) score += 1;
  if (metrics.daysSinceLastWorkout !== null) score += 1;
  if (metrics.previousWeekDays > 0) score += 1;

  if ((questionMeta?.effectiveContext === 'progress' || questionMeta?.intent === 'progress_status') && metrics.hasPrs) {
    score += 1;
  }

  if (questionMeta?.effectiveContext === 'recovery' && metrics.latestCheckinLabel !== 'Sem check-ins recentes') {
    score += 1;
  }

  if (score >= 5) return 'alta';
  if (score >= 3) return 'media';
  return 'baixa';
};

const buildOffTopicResponse = () => {
  const answer = 'Posso responder so sobre treino, recuperacao, evolucao, frequencia e proxima sessao.';
  const reasoning = ['Pergunta fora do foco operacional do coach atual.'];
  const action = 'Reescreva, por exemplo: "o que ajustar no proximo treino?"';

  return {
    answer,
    reasoning,
    action,
    confidence: 'baixa',
  };
};

const buildContextAnswer = ({ effectiveContext, questionMeta, metrics, suggestions }) => {
  if (!metrics.recentWorkoutCount) {
    return 'Ainda faltam treinos recentes suficientes para fechar uma leitura confiavel agora.';
  }

  switch (questionMeta?.intent) {
    case 'workout_today':
      if (metrics.daysSinceLastWorkout === 0) {
        return `Hoje voce ja bateu ${metrics.lastWorkoutTitle}; o melhor encaixe agora e ${metrics.nextSessionLabel}.`;
      }
      return `Hoje faz mais sentido ${metrics.nextSessionLabel}, porque o ultimo treino foi ${metrics.lastWorkoutTitle} ha ${metrics.timeSinceLastWorkoutLabel}.`;
    case 'rest_today':
      if (metrics.daysSinceLastWorkout === 0) {
        return `Sim, descanso completo ou no maximo ${metrics.nextSessionLabel} faz mais sentido porque ${metrics.lastWorkoutTitle} aconteceu hoje.`;
      }
      if (metrics.daysSinceLastWorkout >= 2 && metrics.weeklyDays < metrics.personalTargetFrequency) {
        return `Nao parece o melhor dia para descanso completo; seu ritmo caiu para ${metrics.weeklyDays}x e voce ja esta ha ${metrics.timeSinceLastWorkoutLabel} sem treinar.`;
      }
      if (metrics.lastWorkoutBucket === 'lower' && metrics.daysSinceLastWorkout <= 1) {
        return `Descanso total nao e obrigatorio hoje, mas vale tirar pernas do centro e usar ${metrics.nextSessionLabel}.`;
      }
      return 'Descanso completo hoje so faz sentido se sua energia estiver baixa; pelo historico, uma sessao leve ou complementar ainda cabe.';
    case 'progress_status':
      if (metrics.averageDuration > 0) {
        return `Sua evolucao esta ${metrics.trend}: ${metrics.weeklyDays}x nesta janela, ${metrics.comparisonShort} e media de ${metrics.averageDuration} min.`;
      }
      return `Sua evolucao depende mais de frequencia agora: ${metrics.weeklyDays}x nesta janela e ${metrics.comparisonShort}.`;
    case 'frequency_check':
      return `Sua frequencia atual esta ${metrics.frequencyStatus}: ${metrics.weeklyDays}x nesta janela contra meta pessoal de ${metrics.personalTargetFrequency}x.`;
    case 'next_adjustment':
      return `No proximo ${metrics.lastWorkoutTitle}, o ajuste principal e ${suggestions[0] || 'voltar com progressao limpa e sem pressa na carga.'}`;
    default:
      break;
  }

  if (effectiveContext === 'progress') {
    return `Seu bloco atual esta ${metrics.trend}: ${metrics.weeklyDays}x nesta janela e ${metrics.comparisonShort}.`;
  }

  if (effectiveContext === 'recovery') {
    return `Sua recuperacao parece ${metrics.daysSinceLastWorkout >= 2 ? 'mais aberta' : 'apertada'} para voltar, porque o ultimo treino foi ${metrics.lastWorkoutTitle} ha ${metrics.timeSinceLastWorkoutLabel}.`;
  }

  return `Seu encaixe atual aponta para ${metrics.nextSessionLabel}, porque o ultimo treino foi ${metrics.lastWorkoutTitle} ha ${metrics.timeSinceLastWorkoutLabel}.`;
};

const buildFallbackResponse = ({ effectiveContext, questionMeta, metrics, suggestions }) => {
  const answer = buildContextAnswer({
    effectiveContext,
    questionMeta,
    metrics,
    suggestions,
  });
  const reasoning = buildReasoning({ metrics, questionMeta });
  const action = suggestions[0] || 'registre o proximo treino completo para refinar a leitura';

  return {
    answer,
    reasoning,
    action,
    confidence: deriveConfidence({ metrics, questionMeta }),
  };
};

const normalizeCoachPayload = (raw = '') => {
  const lines = String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  const payload = {
    answer: '',
    reasoning: '',
    action: '',
  };

  for (const line of lines) {
    const normalized = normalizeText(line);

    if (normalized.startsWith('resposta:')) {
      payload.answer = line.split(':').slice(1).join(':').trim();
      continue;
    }

    if (normalized.startsWith('raciocinio:')) {
      payload.reasoning = line.split(':').slice(1).join(':').trim();
      continue;
    }

    if (normalized.startsWith('acao:')) {
      payload.action = line.split(':').slice(1).join(':').trim();
      continue;
    }

    if (!payload.answer) {
      payload.answer = line;
    } else if (!payload.reasoning) {
      payload.reasoning = line;
    } else if (!payload.action) {
      payload.action = line;
    }
  }

  return payload;
};

const splitReasoningLine = (value = '') =>
  String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

const isWeakCoachText = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length < 10) return true;

  return GENERIC_PATTERNS.some((pattern) =>
    normalized === pattern || normalized.startsWith(pattern),
  );
};

const buildLegacyPayload = (structured) => ({
  message: structured.answer,
  insights: structured.reasoning,
  suggestions: [structured.action].filter(Boolean),
});

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
  const rawQuestion = typeof body?.question === 'string' ? body.question.trim() : '';

  if (!VALID_CONTEXTS.includes(context)) {
    return json({ error: `context must be one of: ${VALID_CONTEXTS.join(', ')}` }, 400);
  }

  if (context === 'question' && !rawQuestion) {
    return json({ error: 'question is required when context is question' }, 400);
  }

  if (rawQuestion.length > QUESTION_MAX_LENGTH) {
    return json({ error: `question must be at most ${QUESTION_MAX_LENGTH} characters` }, 400);
  }

  const questionMeta = context === 'question'
    ? classifyCoachQuestion(rawQuestion)
    : null;

  if (questionMeta && !questionMeta.valid) {
    const offTopic = buildOffTopicResponse();
    return json({
      ...offTopic,
      ...buildLegacyPayload(offTopic),
    });
  }

  const effectiveContext = questionMeta?.effectiveContext || context;

  try {
    const [workouts, checkins, prs] = await Promise.all([
      fetchRecentWorkouts(supabase, user.id),
      fetchRecentCheckins(supabase, user.id),
      fetchRecentPrs(supabase, user.id),
    ]);

    const { summaryText, suggestions, metrics } = buildSummary({
      context: effectiveContext,
      questionMeta,
      workouts,
      checkins,
      prs,
    });

    const fallback = buildFallbackResponse({
      effectiveContext,
      questionMeta,
      metrics,
      suggestions,
    });

    if (!metrics.recentWorkoutCount) {
      return json({
        ...fallback,
        ...buildLegacyPayload(fallback),
      });
    }

    try {
      const rawReply = await requestCoachAnalysis(summaryText, {
        question: rawQuestion,
        intentLabel: questionMeta?.label || effectiveContext,
        draftAnswer: fallback.answer,
        draftReasoning: fallback.reasoning,
        preferredAction: fallback.action,
      });

      const normalized = normalizeCoachPayload(rawReply);
      const aiReasoning = splitReasoningLine(normalized.reasoning)
        .filter((item) => !isWeakCoachText(item));

      const structured = {
        answer: isWeakCoachText(normalized.answer) ? fallback.answer : normalized.answer,
        reasoning: aiReasoning.length ? aiReasoning : fallback.reasoning,
        action: isWeakCoachText(normalized.action) ? fallback.action : normalized.action,
        confidence: fallback.confidence,
      };

      return json({
        ...structured,
        ...buildLegacyPayload(structured),
      });
    } catch (error) {
      console.error('[ai/coach]', error);

      return json({
        ...fallback,
        ...buildLegacyPayload(fallback),
      });
    }
  } catch (error) {
    console.error('[ai/coach]', error);
    return json({ error: 'AI unavailable' }, 503);
  }
}
