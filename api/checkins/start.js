import { ApiError, toApiError } from '../_lib/errors.js';
import { errorResponse, successResponse } from '../_lib/http.js';
import { createApiLogger } from '../_lib/logging.js';
import { createRequestId } from '../_lib/request-id.js';
import {
  CHECKIN_CORS_HEADERS,
  authenticateUser,
  createSupabaseServiceClient,
  extractBearerToken,
  normalizeClientTimestamp,
  parseJsonBody,
  toLocalIsoFromUtc,
  validateStartPayload,
} from '../_lib/checkins.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const requestId = createRequestId();
  const log = createApiLogger({ scope: 'checkins/start', requestId });
  const staleThresholdMinutes = 180;

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CHECKIN_CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errorResponse({
      requestId,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST is allowed',
      status: 405,
      details: { method: req.method },
      corsHeaders: CHECKIN_CORS_HEADERS,
    });
  }

  try {
    const supabase = createSupabaseServiceClient();
    const token = extractBearerToken(req);
    const user = await authenticateUser(supabase, token);
    const body = await parseJsonBody(req);
    const payload = validateStartPayload(body);
    const normalizedStart = normalizeClientTimestamp(payload.started_at_utc);
    const startedAtUtc = normalizedStart.iso;
    const startedAtLocal = normalizedStart.corrected
      ? toLocalIsoFromUtc(startedAtUtc)
      : payload.started_at_local;

    if (normalizedStart.corrected) {
      log.warn('start timestamp corrected due clock drift', {
        user_id: user.id,
        client_started_at_utc: payload.started_at_utc,
        server_started_at_utc: startedAtUtc,
        drift_ms: normalizedStart.driftMs,
      });
    }

    const activeCheckinQuery = await supabase
      .from('gym_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeCheckinQuery.error) throw activeCheckinQuery.error;

    let activeCheckin = activeCheckinQuery.data || null;
    if (activeCheckin) {
      const nowMs = Date.now();
      const startedAtIso = activeCheckin.started_at_utc || activeCheckin.created_at || null;
      const startedAtMs = startedAtIso ? new Date(startedAtIso).getTime() : null;
      const activeAgeMinutes = Number.isFinite(startedAtMs)
        ? Math.max(0, Math.round((nowMs - startedAtMs) / 60000))
        : 0;
      const isStaleActive = activeAgeMinutes >= staleThresholdMinutes;

      if (isStaleActive) {
        const endedAtUtc = new Date().toISOString();
        const endedAtLocal = new Date(new Date(endedAtUtc).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();

        const staleCloseResult = await supabase
          .from('gym_checkins')
          .update({
            status: 'ended',
            ended_at_utc: endedAtUtc,
            ended_at_local: endedAtLocal,
            ended_reason: 'stale_replaced',
            duration_minutes: activeAgeMinutes,
            end_source: 'manual',
          })
          .eq('id', activeCheckin.id)
          .eq('user_id', user.id);

        if (staleCloseResult.error) throw staleCloseResult.error;

        log.warn('stale active checkin auto-closed before new start', {
          user_id: user.id,
          stale_checkin_id: activeCheckin.id,
          stale_age_minutes: activeAgeMinutes,
        });

        activeCheckin = null;
      }
    }

    if (activeCheckin) {
      if (
        payload.client_session_id
        && activeCheckin.client_session_id
        && activeCheckin.client_session_id === payload.client_session_id
      ) {
        return successResponse({
          requestId,
          data: {
            checkin: activeCheckin,
            already_active: true,
            idempotent: true,
          },
          corsHeaders: CHECKIN_CORS_HEADERS,
        });
      }

      if (activeCheckin.gym_id === payload.gym_id) {
        return successResponse({
          requestId,
          data: {
            checkin: activeCheckin,
            already_active: true,
            idempotent: false,
          },
          corsHeaders: CHECKIN_CORS_HEADERS,
        });
      }

      throw new ApiError({
        code: 'ACTIVE_CHECKIN_EXISTS',
        message: 'There is already an active check-in for this user',
        status: 409,
        details: {
          active_checkin_id: activeCheckin.id,
          active_gym_id: activeCheckin.gym_id,
        },
      });
    }

    const row = {
      user_id: user.id,
      client_session_id: payload.client_session_id,
      gym_id: payload.gym_id,
      status: 'active',
      mode: payload.mode,
      source: payload.source,
      timezone: payload.timezone,
      started_at_utc: startedAtUtc,
      started_at_local: startedAtLocal,
      started_lat: payload.started_lat,
      started_lng: payload.started_lng,
      started_accuracy_m: payload.started_accuracy_m,
      heartbeat_count: 1,
      last_heartbeat_at_utc: startedAtUtc,
      last_heartbeat_lat: payload.started_lat,
      last_heartbeat_lng: payload.started_lng,
      last_heartbeat_accuracy_m: payload.started_accuracy_m,
      heartbeat_source: payload.source,
      last_seen_at: startedAtUtc,
    };

    const insertResult = await supabase
      .from('gym_checkins')
      .insert(row)
      .select('*')
      .single();

    if (insertResult.error) throw insertResult.error;

    log.info('checkin started', {
      user_id: user.id,
      checkin_id: insertResult.data.id,
      gym_id: payload.gym_id,
      source: payload.source,
      mode: payload.mode,
      clock_drift_ms: normalizedStart.driftMs,
      clock_corrected: normalizedStart.corrected,
    });

    return successResponse({
      requestId,
      data: {
        checkin: insertResult.data,
        already_active: false,
        idempotent: false,
      },
      corsHeaders: CHECKIN_CORS_HEADERS,
    });
  } catch (error) {
    const apiError = toApiError(error, {
      code: 'CHECKIN_START_FAILED',
      message: 'Failed to start check-in',
      status: 500,
    });

    log.error('start failed', {
      code: apiError.code,
      message: apiError.message,
    });

    return errorResponse({
      requestId,
      code: apiError.code,
      message: apiError.message,
      status: apiError.status,
      details: apiError.details,
      corsHeaders: CHECKIN_CORS_HEADERS,
    });
  }
}
