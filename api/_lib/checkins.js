import { createClient } from '@supabase/supabase-js';
import { ApiError } from './errors.js';
import { buildCorsHeaders } from './http.js';

export const CHECKIN_CORS_HEADERS = buildCorsHeaders({
  methods: 'POST, OPTIONS',
  headers: 'Content-Type, Authorization',
});

const SOURCE_VALUES = ['gps', 'network', 'manual'];
const MODE_VALUES = ['auto', 'manual'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assertObject = (value, field = 'body') => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be an object`,
      status: 400,
      details: { field },
    });
  }
};

const assertString = (value, field, { min = 1, max = 255 } = {}) => {
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

const assertNumber = (value, field, { min = -Infinity, max = Infinity } = {}) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be a valid number`,
      status: 400,
      details: { field },
    });
  }

  if (numeric < min || numeric > max) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be between ${min} and ${max}`,
      status: 400,
      details: { field, min, max },
    });
  }

  return numeric;
};

const assertIsoDate = (value, field) => {
  const text = assertString(value, field, { min: 10, max: 64 });
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be an ISO date`,
      status: 400,
      details: { field },
    });
  }

  return parsed.toISOString();
};

const assertEnum = (value, field, acceptedValues) => {
  const normalized = assertString(value, field, { min: 2, max: 40 }).toLowerCase();
  if (!acceptedValues.includes(normalized)) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be one of: ${acceptedValues.join(', ')}`,
      status: 400,
      details: { field, acceptedValues },
    });
  }

  return normalized;
};

const assertOptionalUuid = (value, field) => {
  if (value === null || value === undefined || value === '') return null;
  const text = assertString(value, field, { min: 36, max: 36 });
  if (!UUID_REGEX.test(text)) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: `Field "${field}" must be a valid UUID`,
      status: 400,
      details: { field },
    });
  }
  return text;
};

const assertOptionalNumber = (value, field, limits = {}) => {
  if (value === null || value === undefined || value === '') return null;
  return assertNumber(value, field, limits);
};

const assertOptionalString = (value, field, limits = {}) => {
  if (value === null || value === undefined || value === '') return null;
  return assertString(value, field, limits);
};

export const parseJsonBody = async (req) => {
  try {
    const body = await req.json();
    assertObject(body);
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      code: 'INVALID_JSON',
      message: 'Request body must be valid JSON',
      status: 400,
    });
  }
};

export const createSupabaseServiceClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new ApiError({
      code: 'SERVER_CONFIG_ERROR',
      message: 'Supabase server configuration is missing',
      status: 500,
    });
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export const extractBearerToken = (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid Bearer token',
      status: 401,
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Missing access token',
      status: 401,
    });
  }
  return token;
};

export const authenticateUser = async (supabase, token) => {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Invalid access token',
      status: 401,
      details: { reason: error?.message || 'unknown' },
    });
  }
  return user;
};

export const validateStartPayload = (body) => {
  const gym_id = assertString(body.gym_id, 'gym_id', { min: 2, max: 120 });
  const timezone = assertString(body.timezone, 'timezone', { min: 2, max: 120 });
  const source = assertEnum(body.source, 'source', SOURCE_VALUES);
  const mode = assertEnum(body.mode || 'auto', 'mode', MODE_VALUES);

  const started_at_utc = assertIsoDate(body.started_at_utc, 'started_at_utc');
  const started_at_local = assertIsoDate(body.started_at_local, 'started_at_local');
  const started_lat = assertOptionalNumber(body.started_lat, 'started_lat', { min: -90, max: 90 });
  const started_lng = assertOptionalNumber(body.started_lng, 'started_lng', { min: -180, max: 180 });
  const started_accuracy_m = assertOptionalNumber(body.started_accuracy_m, 'started_accuracy_m', { min: 0, max: 100000 });
  const client_session_id = assertOptionalString(body.client_session_id, 'client_session_id', { min: 8, max: 120 });

  if (source !== 'manual' && (started_lat === null || started_lng === null)) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: 'started_lat and started_lng are required for non-manual source',
      status: 400,
      details: { source },
    });
  }

  return {
    gym_id,
    timezone,
    source,
    mode,
    started_at_utc,
    started_at_local,
    started_lat,
    started_lng,
    started_accuracy_m,
    client_session_id,
  };
};

export const validateHeartbeatPayload = (body) => {
  const checkin_id = assertOptionalUuid(body.checkin_id, 'checkin_id');
  if (!checkin_id) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: 'Field "checkin_id" is required',
      status: 400,
      details: { field: 'checkin_id' },
    });
  }

  return {
    checkin_id,
    heartbeat_at_utc: assertIsoDate(body.heartbeat_at_utc, 'heartbeat_at_utc'),
    source: assertEnum(body.source, 'source', SOURCE_VALUES),
    heartbeat_lat: assertOptionalNumber(body.heartbeat_lat, 'heartbeat_lat', { min: -90, max: 90 }),
    heartbeat_lng: assertOptionalNumber(body.heartbeat_lng, 'heartbeat_lng', { min: -180, max: 180 }),
    heartbeat_accuracy_m: assertOptionalNumber(body.heartbeat_accuracy_m, 'heartbeat_accuracy_m', { min: 0, max: 100000 }),
  };
};

export const validateEndPayload = (body) => {
  const checkin_id = assertOptionalUuid(body.checkin_id, 'checkin_id');
  if (!checkin_id) {
    throw new ApiError({
      code: 'INVALID_PAYLOAD',
      message: 'Field "checkin_id" is required',
      status: 400,
      details: { field: 'checkin_id' },
    });
  }

  return {
    checkin_id,
    ended_at_utc: assertIsoDate(body.ended_at_utc, 'ended_at_utc'),
    ended_at_local: assertIsoDate(body.ended_at_local, 'ended_at_local'),
    timezone: assertString(body.timezone, 'timezone', { min: 2, max: 120 }),
    duration_minutes: Math.round(assertNumber(body.duration_minutes, 'duration_minutes', { min: 0, max: 10080 })),
    ended_reason: assertString(body.ended_reason || 'manual', 'ended_reason', { min: 2, max: 80 }),
    source: assertEnum(body.source, 'source', SOURCE_VALUES),
    ended_lat: assertOptionalNumber(body.ended_lat, 'ended_lat', { min: -90, max: 90 }),
    ended_lng: assertOptionalNumber(body.ended_lng, 'ended_lng', { min: -180, max: 180 }),
    ended_accuracy_m: assertOptionalNumber(body.ended_accuracy_m, 'ended_accuracy_m', { min: 0, max: 100000 }),
  };
};

