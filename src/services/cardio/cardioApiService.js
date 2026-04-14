import { getSessionOrHandleInvalidRefresh } from '../../lib/sessionRecovery';
import { buildApiUrl, getApiPathname, isLocalDevApiUrl } from '../api/baseUrl';

const parseResponse = async (response) => {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error?.message || json?.errorMessage || json?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.code = json?.error?.code || json?.code || `HTTP_${response.status}`;
    error.status = response.status;
    error.payload = json;
    throw error;
  }
  return json;
};

const isLocalDevCardioRoute = (url) => {
  const path = getApiPathname(url);
  return import.meta.env.DEV && path.startsWith('/api/cardio/') && isLocalDevApiUrl(url);
};
const USE_LOCAL_CARDIO_HTTP_IN_DEV = import.meta.env.VITE_LOCAL_CARDIO_HTTP === 'true';
const localCardioMemory = new Map();

const deriveDuration = (startedAt, endedAt) => {
  const startMs = startedAt ? new Date(startedAt).getTime() : null;
  const endMs = endedAt ? new Date(endedAt).getTime() : null;
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {
    return Math.max(1, Math.round((endMs - startMs) / 1000));
  }
  return 0;
};

const buildLocalDevFallback = (url, body = {}) => {
  const nowIso = new Date().toISOString();
  const path = getApiPathname(url);
  const sessionKey = body.session_id || body.workout_sync_id || body.cardio_log_id || `local-cardio-${Date.now()}`;
  const persisted = localCardioMemory.get(sessionKey) || null;

  if (path === '/api/cardio/start') {
    if (persisted?.status === 'active') {
      return {
        local_only: true,
        ok: true,
        data: { cardio: persisted, already_active: true, idempotent: true },
      };
    }

    const cardioLog = {
      id: body.cardio_log_id || `local-cardio-${Date.now()}`,
      session_id: body.session_id || sessionKey,
      workout_sync_id: body.workout_sync_id || sessionKey,
      workout_key: body.workout_key || null,
      cardio_type: body.cardio_type || 'cardio',
      context: body.context || null,
      started_at: body.started_at || nowIso,
      ended_at: null,
      duration_seconds: 0,
      status: 'active',
      source: body.source || 'workout_session',
    };
    localCardioMemory.set(sessionKey, cardioLog);
    return {
      local_only: true,
      ok: true,
      data: { cardio: cardioLog, already_active: false, idempotent: false },
    };
  }

  if (path === '/api/cardio/end') {
    const active = persisted || null;
    const endedAt = body.ended_at || nowIso;
    const base = active || {
      id: body.cardio_log_id || `local-cardio-${Date.now()}`,
      session_id: body.session_id || sessionKey,
      workout_sync_id: body.workout_sync_id || sessionKey,
      cardio_type: body.cardio_type || 'cardio',
      context: body.context || null,
      started_at: body.started_at || nowIso,
      status: 'active',
    };
    const duration = Number.isFinite(Number(body.duration_seconds))
      ? Math.max(0, Number(body.duration_seconds))
      : deriveDuration(base.started_at, endedAt);
    const closed = {
      ...base,
      ended_at: endedAt,
      duration_seconds: duration,
      status: body.status || 'completed',
      context: body.context ?? base.context ?? null,
      cardio_type: body.cardio_type || base.cardio_type || 'cardio',
      source: body.source || base.source || 'workout_session',
    };
    localCardioMemory.set(sessionKey, closed);
    return {
      local_only: true,
      ok: true,
      data: { cardio: closed, already_ended: false, idempotent: false },
    };
  }

  return { local_only: true, ok: true, data: {} };
};

const postWithAuth = async (url, body) => {
  const endpoint = buildApiUrl(url);
  if (isLocalDevCardioRoute(endpoint) && !USE_LOCAL_CARDIO_HTTP_IN_DEV) {
    console.info(`[cardioApi] modo local ativo para ${endpoint} (sem request HTTP no npm run dev)`);
    return buildLocalDevFallback(endpoint, body);
  }

  const { session } = await getSessionOrHandleInvalidRefresh();
  if (!session?.access_token) {
    const err = new Error('Sessão inválida para cardio');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    try {
      return await parseResponse(response);
    } catch (error) {
      if (error?.status === 404 && isLocalDevCardioRoute(endpoint)) {
        console.warn(`[cardioApi] local fallback ativo para ${endpoint} (endpoint indisponível no npm run dev)`);
        return buildLocalDevFallback(endpoint, body);
      }
      throw error;
    }
  } catch (networkError) {
    if (isLocalDevCardioRoute(endpoint)) {
      console.warn(`[cardioApi] local fallback ativo para ${endpoint} (falha de rede local)`);
      return buildLocalDevFallback(endpoint, body);
    }
    throw networkError;
  }
};

const startCardio = (params = {}) => {
  const startedAt = params.started_at || params.startedAt || new Date().toISOString();
  const body = {
    session_id: params.session_id || params.sessionId,
    workout_sync_id: params.workout_sync_id || params.workoutSyncId || params.session_id || params.sessionId,
    workout_key: params.workout_key || params.workoutKey || null,
    cardio_type: params.cardio_type || params.cardioType || params.type || 'cardio',
    context: params.context || null,
    started_at: startedAt,
    status: 'active',
    source: params.source || 'workout_session',
  };
  return postWithAuth('/api/cardio/start', body);
};

const endCardio = (params = {}) => {
  const endedAt = params.ended_at || params.endedAt || new Date().toISOString();
  const body = {
    cardio_log_id: params.cardio_log_id || params.cardioLogId || params.id || null,
    session_id: params.session_id || params.sessionId || null,
    workout_sync_id: params.workout_sync_id || params.workoutSyncId || null,
    cardio_type: params.cardio_type || params.cardioType || params.type || null,
    context: params.context ?? null,
    started_at: params.started_at || params.startedAt || null,
    ended_at: endedAt,
    duration_seconds: Number.isFinite(Number(params.duration_seconds))
      ? Number(params.duration_seconds)
      : null,
    status: params.status || 'completed',
    source: params.source || 'workout_session',
  };
  return postWithAuth('/api/cardio/end', body);
};

export const cardioApi = {
  start: startCardio,
  end: endCardio,
};
