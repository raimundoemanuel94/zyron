import { toApiError } from '../_lib/errors.js';
import { errorResponse, successResponse } from '../_lib/http.js';
import { createApiLogger } from '../_lib/logging.js';
import { createRequestId } from '../_lib/request-id.js';
import {
  CARDIO_CORS_HEADERS,
  parseCardioBody,
  createCardioSupabaseClient,
  extractCardioToken,
  authenticateCardioUser,
  validateCardioStartPayload,
  normalizeCardioTimestamp,
  resolveCardioDurationSeconds,
} from '../_lib/cardio.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const requestId = createRequestId();
  const log = createApiLogger({ scope: 'cardio/start', requestId });

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
    const payload = validateCardioStartPayload(body);
    const normalizedStart = normalizeCardioTimestamp(payload.started_at);
    const startedAt = normalizedStart.iso;

    const activeResult = await supabase
      .from('cardio_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeResult.error) throw activeResult.error;

    const currentActive = activeResult.data || null;
    if (currentActive) {
      const sameSession = currentActive.session_id && currentActive.session_id === payload.session_id;
      const sameWorkoutSync = currentActive.workout_sync_id && currentActive.workout_sync_id === payload.workout_sync_id;

      if (sameSession || sameWorkoutSync) {
        return successResponse({
          requestId,
          data: {
            cardio: currentActive,
            already_active: true,
            idempotent: true,
          },
          corsHeaders: CARDIO_CORS_HEADERS,
        });
      }

      const autoEndedAt = new Date().toISOString();
      const autoDuration = resolveCardioDurationSeconds({
        started_at: currentActive.started_at,
        ended_at: autoEndedAt,
        fallback_seconds: currentActive.duration_seconds || 0,
      });

      const closeActiveResult = await supabase
        .from('cardio_logs')
        .update({
          status: 'aborted',
          ended_at: autoEndedAt,
          duration_seconds: autoDuration,
          synced_at: autoEndedAt,
        })
        .eq('id', currentActive.id)
        .eq('user_id', user.id);

      if (closeActiveResult.error) throw closeActiveResult.error;
      log.warn('auto-closed stale active cardio before starting new one', {
        user_id: user.id,
        old_cardio_log_id: currentActive.id,
      });
    }

    const insertRow = {
      user_id: user.id,
      workout_sync_id: payload.workout_sync_id || payload.session_id,
      session_id: payload.session_id,
      workout_key: payload.workout_key,
      cardio_type: payload.cardio_type,
      context: payload.context,
      started_at: startedAt,
      ended_at: null,
      duration_seconds: 0,
      status: 'active',
      source: payload.source || 'workout_session',
      synced_at: new Date().toISOString(),
    };

    const insertResult = await supabase
      .from('cardio_logs')
      .insert(insertRow)
      .select('*')
      .single();

    if (insertResult.error) throw insertResult.error;

    log.info('cardio started', {
      user_id: user.id,
      cardio_log_id: insertResult.data.id,
      workout_sync_id: insertResult.data.workout_sync_id,
      session_id: insertResult.data.session_id,
      clock_corrected: normalizedStart.corrected,
      clock_drift_ms: normalizedStart.driftMs,
    });

    return successResponse({
      requestId,
      data: {
        cardio: insertResult.data,
        already_active: false,
        idempotent: false,
      },
      corsHeaders: CARDIO_CORS_HEADERS,
    });
  } catch (error) {
    const apiError = toApiError(error, {
      code: 'CARDIO_START_FAILED',
      message: 'Failed to start cardio log',
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
      corsHeaders: CARDIO_CORS_HEADERS,
    });
  }
}
