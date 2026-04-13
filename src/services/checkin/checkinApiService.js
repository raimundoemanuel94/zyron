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

/**
 * Iniciar check-in
 * @param {Object} params
 * @param {number} params.lat
 * @param {number} params.lng
 * @param {number} params.accuracy_m - deve ser <= 50
 * @param {string} params.gym_id
 * @param {string} params.timestamp - ISO string
 * @param {string} [params.client_session_id]
 * @param {string} [params.source] - 'gps' | 'network' | 'manual'
 */
const startCheckin = ({ lat, lng, accuracy_m, gym_id, timestamp, client_session_id, source = 'gps' }) => {
  const now = timestamp || new Date().toISOString();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const localIso = new Date(new Date(now).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();

  return postWithAuth('/api/checkins/start', {
    gym_id,
    lat,
    lng,
    accuracy_m,
    source,
    mode: 'auto',
    timezone: tz,
    started_at_utc: now,
    started_at_local: localIso,
    client_session_id: client_session_id || null,
  });
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
const heartbeatCheckin = ({ checkin_id, lat, lng, accuracy_m, timestamp, source = 'gps' }) => {
  return postWithAuth('/api/checkins/heartbeat', {
    checkin_id: checkin_id || null,
    lat,
    lng,
    accuracy_m,
    source,
    heartbeat_at_utc: timestamp || new Date().toISOString(),
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
const endCheckin = ({ checkin_id, duration_minutes, reason = 'manual', lat, lng, accuracy_m, timestamp, source = 'gps' }) => {
  const now = timestamp || new Date().toISOString();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const localIso = new Date(new Date(now).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();

  return postWithAuth('/api/checkins/end', {
    checkin_id: checkin_id || null,
    lat: lat ?? null,
    lng: lng ?? null,
    accuracy_m: accuracy_m ?? null,
    source,
    timezone: tz,
    ended_at_utc: now,
    ended_at_local: localIso,
    duration_minutes,
    ended_reason: reason,
  });
};

export const checkinApi = {
  start: startCheckin,
  heartbeat: heartbeatCheckin,
  end: endCheckin,
};
