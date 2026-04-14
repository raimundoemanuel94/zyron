import { ApiError } from './errors.js';
import {
  CHECKIN_CORS_HEADERS,
  normalizeClientTimestamp,
  parseJsonBody,
  createSupabaseServiceClient,
  extractBearerToken,
  authenticateUser,
} from './checkins.js';

const CARDIO_STATUS_VALUES = ['active', 'completed', 'cancelled', 'aborted'];

const assertString = (value, field, { min = 1, max = 160 } = {}) => {
  if (typeof value !== 'string') {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be a string`,
      status: 400,
      details: { field },
    });
  }

  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" length must be between ${min} and ${max}`,
      status: 400,
      details: { field, min, max },
    });
  }

  return normalized;
};

const assertOptionalString = (value, field, limits = {}) => {
  if (value === null || value === undefined || value === '') return null;
  return assertString(value, field, limits);
};

const assertIsoDate = (value, field) => {
  const text = assertString(value, field, { min: 10, max: 64 });
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be a valid ISO timestamp`,
      status: 400,
      details: { field },
    });
  }
  return parsed.toISOString();
};

const assertOptionalInteger = (value, field, min = 0) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < min) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be an integer >= ${min}`,
      status: 400,
      details: { field, min },
    });
  }
  return parsed;
};

const assertOptionalStatus = (value, field, fallback = 'active') => {
  const normalized = value == null ? fallback : String(value).trim().toLowerCase();
  if (!CARDIO_STATUS_VALUES.includes(normalized)) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be one of: ${CARDIO_STATUS_VALUES.join(', ')}`,
      status: 400,
      details: { field, accepted: CARDIO_STATUS_VALUES },
    });
  }
  return normalized;
};

export const CARDIO_CORS_HEADERS = CHECKIN_CORS_HEADERS;

export const parseCardioBody = parseJsonBody;
export const createCardioSupabaseClient = createSupabaseServiceClient;
export const extractCardioToken = extractBearerToken;
export const authenticateCardioUser = authenticateUser;
export const normalizeCardioTimestamp = normalizeClientTimestamp;

export const validateCardioStartPayload = (body) => {
  const session_id = assertString(
    body.session_id || body.sessionId || body.workout_sync_id || body.workoutSyncId,
    'session_id',
    { min: 8, max: 180 }
  );
  const workout_sync_id = assertOptionalString(
    body.workout_sync_id || body.workoutSyncId || session_id,
    'workout_sync_id',
    { min: 8, max: 180 }
  );
  const workout_key = assertOptionalString(body.workout_key || body.workoutKey || null, 'workout_key', { min: 1, max: 120 });
  const cardio_type = assertString(body.cardio_type || body.cardioType || body.type || 'cardio', 'cardio_type', { min: 1, max: 120 });
  const context = assertOptionalString(body.context, 'context', { min: 1, max: 120 });
  const started_at = assertIsoDate(
    body.started_at || body.startedAt || body.started_at_utc || body.started_at_local || new Date().toISOString(),
    'started_at'
  );
  assertOptionalStatus(body.status, 'status', 'active');

  return {
    session_id,
    workout_sync_id,
    workout_key,
    cardio_type,
    context,
    started_at,
    status: 'active',
    source: assertOptionalString(body.source, 'source', { min: 1, max: 40 }) || 'workout_session',
  };
};

export const validateCardioEndPayload = (body) => {
  const cardio_log_id = assertOptionalString(body.cardio_log_id || body.cardioLogId || body.id || null, 'cardio_log_id', { min: 8, max: 180 });
  const session_id = assertOptionalString(
    body.session_id || body.sessionId || body.workout_sync_id || body.workoutSyncId || null,
    'session_id',
    { min: 8, max: 180 }
  );
  const workout_sync_id = assertOptionalString(body.workout_sync_id || body.workoutSyncId || session_id || null, 'workout_sync_id', { min: 8, max: 180 });
  const cardio_type = assertOptionalString(body.cardio_type || body.cardioType || body.type || null, 'cardio_type', { min: 1, max: 120 });
  const context = assertOptionalString(body.context, 'context', { min: 1, max: 120 });
  const started_at = body.started_at || body.startedAt ? assertIsoDate(body.started_at || body.startedAt, 'started_at') : null;
  const ended_at = assertIsoDate(
    body.ended_at || body.endedAt || body.ended_at_utc || body.ended_at_local || new Date().toISOString(),
    'ended_at'
  );
  const duration_seconds = assertOptionalInteger(body.duration_seconds ?? body.durationSeconds ?? null, 'duration_seconds', 0);
  const status = assertOptionalStatus(body.status, 'status', 'completed');
  const source = assertOptionalString(body.source, 'source', { min: 1, max: 40 }) || 'workout_session';

  if (!cardio_log_id && !session_id && !workout_sync_id) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: 'Provide cardio_log_id or session_id/workout_sync_id to close cardio log',
      status: 400,
      details: { field: 'cardio_log_id' },
    });
  }

  return {
    cardio_log_id,
    session_id,
    workout_sync_id,
    cardio_type,
    context,
    started_at,
    ended_at,
    duration_seconds,
    status: status === 'active' ? 'completed' : status,
    source,
  };
};

export const resolveCardioDurationSeconds = ({ started_at, ended_at, fallback_seconds = 0 }) => {
  const startMs = started_at ? new Date(started_at).getTime() : null;
  const endMs = ended_at ? new Date(ended_at).getTime() : null;
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {
    return Math.max(1, Math.round((endMs - startMs) / 1000));
  }
  return Math.max(0, Number(fallback_seconds || 0));
};
