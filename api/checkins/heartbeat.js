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
  validateHeartbeatPayload,
} from '../_lib/checkins.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const requestId = createRequestId();
  const log = createApiLogger({ scope: 'checkins/heartbeat', requestId });

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
    const payload = validateHeartbeatPayload(body);

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
    if (current.status !== 'active') {
      throw new ApiError({
        code: 'CHECKIN_NOT_ACTIVE',
        message: 'Check-in is not active',
        status: 409,
        details: { checkin_id: current.id, status: current.status },
      });
    }

    const nextHeartbeatCount = Number(current.heartbeat_count || 0) + 1;
    const updateResult = await supabase
      .from('gym_checkins')
      .update({
        heartbeat_count: nextHeartbeatCount,
        last_heartbeat_at_utc: payload.heartbeat_at_utc,
        last_heartbeat_lat: payload.heartbeat_lat,
        last_heartbeat_lng: payload.heartbeat_lng,
        last_heartbeat_accuracy_m: payload.heartbeat_accuracy_m,
        heartbeat_source: payload.source,
        last_seen_at: payload.heartbeat_at_utc,
      })
      .eq('id', current.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateResult.error) throw updateResult.error;

    log.info('heartbeat accepted', {
      user_id: user.id,
      checkin_id: current.id,
      heartbeat_count: nextHeartbeatCount,
    });

    return successResponse({
      requestId,
      data: {
        checkin: updateResult.data,
        heartbeat_count: nextHeartbeatCount,
      },
      corsHeaders: CHECKIN_CORS_HEADERS,
    });
  } catch (error) {
    const apiError = toApiError(error, {
      code: 'CHECKIN_HEARTBEAT_FAILED',
      message: 'Failed to register heartbeat',
      status: 500,
    });

    log.error('heartbeat failed', {
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

