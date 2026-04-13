import { ApiError, toApiError } from '../_lib/errors.js';
import { errorResponse, successResponse } from '../_lib/http.js';
import { createApiLogger } from '../_lib/logging.js';
import { createRequestId } from '../_lib/request-id.js';
import {
  CHECKIN_CORS_HEADERS,
  authenticateUser,
  createSupabaseServiceClient,
  extractBearerToken,
  parseJsonBody,
  validateEndPayload,
} from '../_lib/checkins.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const requestId = createRequestId();
  const log = createApiLogger({ scope: 'checkins/end', requestId });

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
    const payload = validateEndPayload(body);

    // FASE 2: busca por checkin_id se fornecido, senão busca ativo do usuário
    let recordQuery = supabase
      .from('gym_checkins')
      .select('*')
      .eq('user_id', user.id);

    if (payload.checkin_id) {
      recordQuery = recordQuery.eq('id', payload.checkin_id);
    } else {
      recordQuery = recordQuery.eq('status', 'active');
    }

    const recordResult = await recordQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recordResult.error) throw recordResult.error;
    if (!recordResult.data) {
      throw new ApiError({
        code: 'CHECKIN_NOT_FOUND',
        message: 'No active check-in found for this user',
        status: 404,
        details: { checkin_id: payload.checkin_id || null },
      });
    }

    const current = recordResult.data;
    if (current.status === 'ended') {
      return successResponse({
        requestId,
        data: {
          checkin: current,
          already_ended: true,
          idempotent: true,
        },
        corsHeaders: CHECKIN_CORS_HEADERS,
      });
    }

    if (current.status !== 'active') {
      throw new ApiError({
        code: 'CHECKIN_INVALID_STATUS',
        message: 'Check-in status does not allow ending',
        status: 409,
        details: { checkin_id: current.id, status: current.status },
      });
    }

    const updateResult = await supabase
      .from('gym_checkins')
      .update({
        status: 'ended',
        ended_at_utc: payload.ended_at_utc,
        ended_at_local: payload.ended_at_local,
        ended_lat: payload.ended_lat,
        ended_lng: payload.ended_lng,
        ended_accuracy_m: payload.ended_accuracy_m,
        ended_reason: payload.ended_reason,
        duration_minutes: payload.duration_minutes,
        end_source: payload.source,
        timezone: payload.timezone,
      })
      .eq('id', current.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateResult.error) throw updateResult.error;

    log.info('checkin ended', {
      user_id: user.id,
      checkin_id: current.id,
      duration_minutes: payload.duration_minutes,
      ended_reason: payload.ended_reason,
    });

    return successResponse({
      requestId,
      data: {
        checkin: updateResult.data,
        already_ended: false,
        idempotent: false,
      },
      corsHeaders: CHECKIN_CORS_HEADERS,
    });
  } catch (error) {
    const apiError = toApiError(error, {
      code: 'CHECKIN_END_FAILED',
      message: 'Failed to end check-in',
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
      corsHeaders: CHECKIN_CORS_HEADERS,
    });
  }
}

