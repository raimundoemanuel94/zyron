import { ApiError, toApiError } from '../_lib/errors.js';
import { errorResponse, successResponse } from '../_lib/http.js';
import { createApiLogger } from '../_lib/logging.js';
import { createRequestId } from '../_lib/request-id.js';
import {
  CARDIO_CORS_HEADERS,
  parseCardioBody,
  createCardioSupabaseClient,
  extractCardioToken,
  authenticateCardioUser,
  validateCardioEndPayload,
  normalizeCardioTimestamp,
  resolveCardioDurationSeconds,
} from '../_lib/cardio.js';

export const config = {
  runtime: 'edge',
};

const applyLookupFilters = (query, payload) => {
  let scoped = query;
  if (payload.cardio_log_id) scoped = scoped.eq('id', payload.cardio_log_id);
  if (payload.session_id) scoped = scoped.eq('session_id', payload.session_id);
  if (payload.workout_sync_id) scoped = scoped.eq('workout_sync_id', payload.workout_sync_id);
  return scoped;
};

export default async function handler(req) {
  const requestId = createRequestId();
  const log = createApiLogger({ scope: 'cardio/end', requestId });

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CARDIO_CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errorResponse({
      requestId,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST is allowed',
      status: 405,
      details: { method: req.method },
      corsHeaders: CARDIO_CORS_HEADERS,
    });
  }

  try {
    const supabase = createCardioSupabaseClient();
    const token = extractCardioToken(req);
    const user = await authenticateCardioUser(supabase, token);
    const body = await parseCardioBody(req);
    const payload = validateCardioEndPayload(body);
    const normalizedEnd = normalizeCardioTimestamp(payload.ended_at);
    const endedAt = normalizedEnd.iso;

    let recordResult = await applyLookupFilters(
      supabase.from('cardio_logs').select('*').eq('user_id', user.id),
      payload
    )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recordResult.error) throw recordResult.error;

    if (!recordResult.data) {
      recordResult = await applyLookupFilters(
        supabase.from('cardio_logs').select('*').eq('user_id', user.id),
        payload
      )
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recordResult.error) throw recordResult.error;
    }

    const record = recordResult.data || null;
    if (!record) {
      throw new ApiError({
        code: 'CARDIO_NOT_FOUND',
        message: 'No cardio log found for this user/session',
        status: 404,
      });
    }

    if (record.status !== 'active' && record.ended_at) {
      return successResponse({
        requestId,
        data: {
          cardio: record,
          already_ended: true,
          idempotent: true,
        },
        corsHeaders: CARDIO_CORS_HEADERS,
      });
    }

    const durationSeconds = resolveCardioDurationSeconds({
      started_at: payload.started_at || record.started_at,
      ended_at: endedAt,
      fallback_seconds: payload.duration_seconds ?? record.duration_seconds ?? 0,
    });

    const updatePayload = {
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      status: payload.status || 'completed',
      synced_at: new Date().toISOString(),
      source: payload.source || record.source || 'workout_session',
      workout_sync_id: payload.workout_sync_id || record.workout_sync_id || null,
      session_id: payload.session_id || record.session_id || null,
      cardio_type: payload.cardio_type || record.cardio_type,
      context: payload.context ?? record.context ?? null,
    };

    const updateResult = await supabase
      .from('cardio_logs')
      .update(updatePayload)
      .eq('id', record.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateResult.error) throw updateResult.error;

    log.info('cardio ended', {
      user_id: user.id,
      cardio_log_id: updateResult.data.id,
      duration_seconds: updateResult.data.duration_seconds,
      status: updateResult.data.status,
      clock_corrected: normalizedEnd.corrected,
      clock_drift_ms: normalizedEnd.driftMs,
    });

    return successResponse({
      requestId,
      data: {
        cardio: updateResult.data,
        already_ended: false,
        idempotent: false,
      },
      corsHeaders: CARDIO_CORS_HEADERS,
    });
  } catch (error) {
    const apiError = toApiError(error, {
      code: 'CARDIO_END_FAILED',
      message: 'Failed to close cardio log',
      status: 500,
    });

    log.error('end failed', {
      code: apiError.code,
      message: apiError.message,
    });

    return errorResponse({
      requestId,
      code: apiError.code,
      message: apiError.message,
      status: apiError.status,
      details: apiError.details,
      corsHeaders: CARDIO_CORS_HEADERS,
    });
  }
}
