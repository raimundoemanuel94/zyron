const toIsoNow = () => new Date().toISOString();

export const buildCorsHeaders = ({
  origin = '*',
  methods = 'GET, POST, OPTIONS',
  headers = 'Content-Type, Authorization',
} = {}) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': methods,
  'Access-Control-Allow-Headers': headers,
});

export const jsonResponse = (body, {
  status = 200,
  headers = {},
  corsHeaders = {},
} = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
  });

const buildMeta = (requestId, extraMeta = {}) => ({
  request_id: requestId || null,
  timestamp: toIsoNow(),
  ...extraMeta,
});

export const successResponse = ({
  data = {},
  requestId,
  status = 200,
  headers = {},
  corsHeaders = {},
  meta = {},
  includeTopLevelData = false,
} = {}) => {
  const payload = {
    ok: true,
    data,
    meta: buildMeta(requestId, meta),
  };

  if (includeTopLevelData && data && typeof data === 'object' && !Array.isArray(data)) {
    Object.assign(payload, data);
  }

  return jsonResponse(payload, { status, headers, corsHeaders });
};

export const errorResponse = ({
  requestId,
  code = 'INTERNAL_ERROR',
  message = 'Unexpected server error',
  details = {},
  status = 500,
  headers = {},
  corsHeaders = {},
} = {}) =>
  jsonResponse(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
      code,
      errorMessage: message,
      details,
      meta: buildMeta(requestId),
    },
    { status, headers, corsHeaders },
  );

