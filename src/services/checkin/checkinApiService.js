import { supabase } from '../../lib/supabase';

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

const postWithAuth = async (url, body) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const err = new Error('Sessao invalida para check-in');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
};

// FASE 2: payload normalizado para cada endpoint

const toIsoLocal = (isoUtc) => {
  const now = isoUtc || new Date().toISOString();
  return new Date(new Date(now).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();
};

/**
 * Iniciar check-in
 * Aceita payload legado e payload fase 2.
 */
const startCheckin = (params = {}) => {
  const startedUtc = params.timestamp || params.started_at_utc || new Date().toISOString();
  const timezone = params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const body = {
    gym_id: params.gym_id,
    lat: params.lat ?? params.started_lat ?? null,
    lng: params.lng ?? params.started_lng ?? null,
    accuracy_m: params.accuracy_m ?? params.started_accuracy_m ?? null,
    source: params.source || 'gps',
    mode: params.mode || 'auto',
    timezone,
    started_at_utc: startedUtc,
    started_at_local: params.started_at_local || toIsoLocal(startedUtc),
    client_session_id: params.client_session_id || null,
  };

  return postWithAuth('/api/checkins/start', body);
};

/**
 * Enviar heartbeat
 * @param {Object} params
 * @param {string} params.checkin_id - UUID do check-in ativo (opcional — busca ativo se omitido)
 * @param {number} params.lat
 * @param {number} params.lng
 * @param {number} params.accuracy_m
 * @param {string} [params.timestamp] - ISO string
 * @param {string} [params.source]
 */
const heartbeatCheckin = (params = {}) => {
  return postWithAuth('/api/checkins/heartbeat', {
    checkin_id: params.checkin_id || null,
    lat: params.lat ?? params.heartbeat_lat ?? null,
    lng: params.lng ?? params.heartbeat_lng ?? null,
    accuracy_m: params.accuracy_m ?? params.heartbeat_accuracy_m ?? null,
    source: params.source || 'gps',
    heartbeat_at_utc: params.timestamp || params.heartbeat_at_utc || new Date().toISOString(),
  });
};

/**
 * Encerrar check-in
 * @param {Object} params
 * @param {string} params.checkin_id - UUID do check-in (opcional — busca ativo se omitido)
 * @param {number} params.duration_minutes
 * @param {string} [params.reason] - 'manual' | 'left_geofence' | 'inactivity' | 'workout_finished'
 * @param {number} [params.lat]
 * @param {number} [params.lng]
 * @param {number} [params.accuracy_m]
 * @param {string} [params.timestamp]
 * @param {string} [params.source]
 */
const endCheckin = (params = {}) => {
  const endedUtc = params.timestamp || params.ended_at_utc || new Date().toISOString();
  const timezone = params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return postWithAuth('/api/checkins/end', {
    checkin_id: params.checkin_id || null,
    lat: params.lat ?? params.ended_lat ?? null,
    lng: params.lng ?? params.ended_lng ?? null,
    accuracy_m: params.accuracy_m ?? params.ended_accuracy_m ?? null,
    source: params.source || 'gps',
    timezone,
    ended_at_utc: endedUtc,
    ended_at_local: params.ended_at_local || toIsoLocal(endedUtc),
    duration_minutes: Number(params.duration_minutes ?? 0),
    ended_reason: params.reason || params.ended_reason || 'manual',
  });
};

export const checkinApi = {
  start: startCheckin,
  heartbeat: heartbeatCheckin,
  end: endCheckin,
};
