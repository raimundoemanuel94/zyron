import { ApiError, toApiError } from '../_lib/errors.js';
import { buildCorsHeaders, errorResponse, successResponse } from '../_lib/http.js';
import { createApiLogger } from '../_lib/logging.js';
import { createRequestId } from '../_lib/request-id.js';
import { getVideoIdFromRequest, isValidYouTubeVideoId } from '../_lib/validation.js';

export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = buildCorsHeaders({
  methods: 'GET, OPTIONS',
  headers: 'Content-Type',
});

const STREAM_CACHE_TTL_MS = 5 * 60 * 1000;
const STREAM_CACHE_MAX_ITEMS = 300;
const streamCache = new Map();
const PROVIDER_CACHE_TTL_MS = 10 * 60 * 1000;
let providersCache = {
  value: null,
  expiresAt: 0,
};

const STATIC_PROVIDERS = [
  {
    name: 'api.piped.private.coffee',
    buildUrl: (id) => `https://api.piped.private.coffee/streams/${id}`,
  },
  {
    name: 'piped.video',
    buildUrl: (id) => `https://piped.video/api/v1/streams/${id}`,
  },
];

const norm = (value) => String(value || '').toLowerCase();

const isIOSCompatibleStream = (stream) => {
  const format = norm(stream?.format);
  const mimeType = norm(stream?.mimeType || stream?.mime_type);
  const codec = norm(stream?.codec || stream?.audioCodec || stream?.codecs);
  const url = norm(stream?.url);

  if (mimeType.includes('audio/mp4') || mimeType.includes('audio/aac') || mimeType.includes('audio/mpeg')) return true;
  if (mimeType.includes('application/vnd.apple.mpegurl')) return true;
  if (format.includes('mp4') || format.includes('m4a') || format.includes('aac') || format.includes('mp3')) return true;
  if (format.includes('hls') || format.includes('m3u8') || url.includes('.m3u8')) return true;
  if (codec.includes('mp4a') || codec.includes('aac') || codec.includes('mp3')) return true;
  return false;
};

const isWebmLike = (stream) => {
  const format = norm(stream?.format);
  const mimeType = norm(stream?.mimeType || stream?.mime_type);
  const codec = norm(stream?.codec || stream?.audioCodec || stream?.codecs);
  return (
    format.includes('webm')
    || mimeType.includes('webm')
    || codec.includes('opus')
    || codec.includes('vorbis')
  );
};

const toQualityScore = (stream) => {
  const quality = norm(stream?.quality);
  if (quality.includes('best')) return 30;
  if (quality.includes('high')) return 20;
  if (quality.includes('medium')) return 10;
  return 0;
};

const toBitrateScore = (stream) => {
  const bitrate = Number(stream?.bitrate || 0);
  if (!Number.isFinite(bitrate)) return 0;
  return Math.min(40, Math.max(0, Math.floor(bitrate / 16000)));
};

const scoreStream = (stream, isIOSClient) => {
  let score = toQualityScore(stream) + toBitrateScore(stream);

  if (isIOSClient) {
    if (isIOSCompatibleStream(stream)) score += 120;
    if (isWebmLike(stream)) score -= 160;
  } else {
    if (isWebmLike(stream)) score += 70;
    if (isIOSCompatibleStream(stream)) score += 35;
  }

  return score;
};

const pickBestAudio = (payload, { isIOSClient = false } = {}) => {
  const audioStreams = Array.isArray(payload?.audioStreams) ? payload.audioStreams : [];

  if (!audioStreams.length) return null;

  const ranked = audioStreams
    .filter((stream) => Boolean(stream?.url))
    .map((stream) => ({ stream, score: scoreStream(stream, isIOSClient) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.stream || null;
};

const toStreamCacheKey = (videoId, isIOSClient) => `${videoId}:${isIOSClient ? 'ios' : 'default'}`;

const getFromCache = (cacheKey) => {
  const cached = streamCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() >= cached.expiresAt) {
    streamCache.delete(cacheKey);
    return null;
  }

  return cached.value;
};

const setCache = (cacheKey, value) => {
  if (streamCache.size >= STREAM_CACHE_MAX_ITEMS) {
    const oldestKey = streamCache.keys().next().value;
    if (oldestKey) streamCache.delete(oldestKey);
  }

  streamCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + STREAM_CACHE_TTL_MS,
  });
};

const sanitizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return null;
    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
};

const fetchJsonWithTimeout = async (url, timeoutMs = 5000) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ZYRON-Audio-Proxy/1.2',
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new ApiError({
        code: 'UPSTREAM_ERROR',
        message: `Upstream status ${response.status}`,
        status: 502,
        details: { upstream_status: response.status },
      });
    }

    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError({
        code: 'UPSTREAM_TIMEOUT',
        message: 'Timeout while fetching upstream json',
        status: 408,
      });
    }

    throw toApiError(error, {
      code: 'UPSTREAM_ERROR',
      message: 'Failed to fetch upstream json',
      status: 502,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const scoreProviderInstance = (instance) => {
  const uptime24h = Number(instance?.uptime_24h || 0);
  const uptime7d = Number(instance?.uptime_7d || 0);
  const upToDate = instance?.up_to_date ? 10 : 0;
  const cacheBonus = instance?.cache ? 5 : 0;
  return uptime24h + uptime7d + upToDate + cacheBonus;
};

const toProvider = (apiUrl) => {
  const baseUrl = sanitizeBaseUrl(apiUrl);
  if (!baseUrl) return null;

  try {
    const hostname = new URL(baseUrl).host;
    return {
      name: hostname,
      buildUrl: (id) => `${baseUrl}/streams/${id}`,
    };
  } catch {
    return null;
  }
};

const dedupeProviders = (providers) => {
  const seen = new Set();
  return providers.filter((provider) => {
    if (!provider?.name || seen.has(provider.name)) return false;
    seen.add(provider.name);
    return true;
  });
};

const resolveProviders = async () => {
  if (providersCache.value && Date.now() < providersCache.expiresAt) {
    return providersCache.value;
  }

  let discoveredProviders = [];

  try {
    const instances = await fetchJsonWithTimeout('https://piped-instances.kavin.rocks/', 5000);
    if (Array.isArray(instances)) {
      discoveredProviders = instances
        .map((instance) => ({
          instance,
          provider: toProvider(instance?.api_url),
        }))
        .filter((entry) => entry.provider)
        .sort((a, b) => scoreProviderInstance(b.instance) - scoreProviderInstance(a.instance))
        .slice(0, 6)
        .map((entry) => entry.provider);
    }
  } catch {
    discoveredProviders = [];
  }

  const providers = dedupeProviders([...discoveredProviders, ...STATIC_PROVIDERS]);

  providersCache = {
    value: providers,
    expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS,
  };

  return providers;
};

const fetchProvider = async (provider, videoId, timeoutMs = 8000) => {
  try {
    return await fetchJsonWithTimeout(provider.buildUrl(videoId), timeoutMs);
  } catch (error) {
    const apiError = toApiError(error, {
      code: 'UPSTREAM_ERROR',
      message: 'Failed to fetch audio stream from upstream',
      status: 502,
    });

    const upstreamStatus = Number(apiError?.details?.upstream_status || 0);

    if (upstreamStatus === 429) {
      throw new ApiError({
        code: 'UPSTREAM_RATE_LIMITED',
        message: 'Upstream rate limit reached',
        status: 502,
        details: { upstream_status: 429 },
      });
    }

    if (upstreamStatus === 404) {
      throw new ApiError({
        code: 'VIDEO_NOT_FOUND',
        message: 'Video not found in upstream provider',
        status: 404,
        details: { upstream_status: 404 },
      });
    }

    throw apiError;
  }
};

const toFailureType = (errorCode) => {
  if (errorCode === 'UPSTREAM_TIMEOUT') return 'timeout';
  if (errorCode === 'UPSTREAM_RATE_LIMITED') return 'rate_limit';
  if (errorCode === 'VIDEO_NOT_FOUND') return 'not_found';
  return 'upstream_error';
};

export default async function handler(req) {
  const requestId = createRequestId();
  const log = createApiLogger({ scope: 'audio-stream', requestId });
  const userAgent = req.headers.get('user-agent') || '';
  const isIOSClient = /iphone|ipad|ipod/i.test(userAgent);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== 'GET') {
    return errorResponse({
      requestId,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only GET is allowed',
      status: 405,
      details: { method: req.method },
      corsHeaders: CORS_HEADERS,
    });
  }

  const videoId = getVideoIdFromRequest(req);
  if (!videoId) {
    return errorResponse({
      requestId,
      code: 'INVALID_VIDEO_ID',
      message: 'Missing video id',
      status: 400,
      corsHeaders: CORS_HEADERS,
    });
  }

  if (!isValidYouTubeVideoId(videoId)) {
    return errorResponse({
      requestId,
      code: 'INVALID_VIDEO_ID',
      message: 'Invalid YouTube video id format',
      status: 400,
      details: { videoId },
      corsHeaders: CORS_HEADERS,
    });
  }

  const cacheKey = toStreamCacheKey(videoId, isIOSClient);
  const cached = getFromCache(cacheKey);
  if (cached) {
    log.info('cache=HIT', { videoId, ios_client: isIOSClient });
    return successResponse({
      data: {
        ...cached,
        cached: true,
      },
      requestId,
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=120',
      },
      corsHeaders: CORS_HEADERS,
      includeTopLevelData: true,
    });
  }

  log.info('cache=MISS', { videoId, ios_client: isIOSClient });

  const failures = [];
  const providers = await resolveProviders();

  for (const provider of providers) {
    try {
      const payload = await fetchProvider(provider, videoId, 8000);
      const bestAudio = pickBestAudio(payload, { isIOSClient });

      if (!bestAudio?.url) {
        const parseFailure = {
          provider: provider.name,
          type: 'parse_error',
          status: 502,
          message: 'No audio stream in payload',
        };
        failures.push(parseFailure);
        log.warn('provider=FAIL', { videoId, ...parseFailure });
        continue;
      }

      const result = {
        videoId,
        audioUrl: bestAudio.url,
        format: bestAudio.format || null,
        mimeType: bestAudio.mimeType || bestAudio.mime_type || null,
        codec: bestAudio.codec || bestAudio.audioCodec || bestAudio.codecs || null,
        quality: bestAudio.quality || null,
        bitrate: bestAudio.bitrate || null,
        title: payload.title || 'Unknown',
        uploader: payload.uploader || 'Unknown',
        duration: payload.duration || 0,
        thumbnail: payload.thumbnail || null,
        provider: provider.name,
        ios_compatible: isIOSCompatibleStream(bestAudio),
      };

      setCache(cacheKey, result);

      log.info('provider=SUCCESS', {
        videoId,
        provider: provider.name,
        ios_client: isIOSClient,
        ios_compatible: result.ios_compatible,
        format: result.format,
        mimeType: result.mimeType,
        quality: result.quality,
      });

      return successResponse({
        data: result,
        requestId,
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=120',
        },
        corsHeaders: CORS_HEADERS,
        includeTopLevelData: true,
      });
    } catch (error) {
      const apiError = toApiError(error, {
        code: 'UPSTREAM_ERROR',
        message: 'Failed to resolve provider stream',
        status: 502,
      });

      const failure = {
        provider: provider.name,
        type: toFailureType(apiError.code),
        status: apiError.status,
        message: apiError.message,
      };

      failures.push(failure);
      log.warn('provider=FAIL', { videoId, ...failure });
    }
  }

  const hasTimeout = failures.some((failure) => failure.type === 'timeout');
  const hasRateLimit = failures.some((failure) => failure.type === 'rate_limit');
  const hasParseError = failures.some((failure) => failure.type === 'parse_error');
  const hasNotFound = failures.some((failure) => failure.type === 'not_found');

  if (hasTimeout) {
    return errorResponse({
      requestId,
      code: 'UPSTREAM_TIMEOUT',
      message: 'Timeout while fetching audio stream',
      status: 408,
      details: { videoId, providers: failures },
      corsHeaders: CORS_HEADERS,
    });
  }

  if (hasRateLimit) {
    return errorResponse({
      requestId,
      code: 'UPSTREAM_RATE_LIMITED',
      message: 'Upstream rate limit reached',
      status: 502,
      details: { videoId, providers: failures },
      corsHeaders: CORS_HEADERS,
    });
  }

  if (hasParseError) {
    return errorResponse({
      requestId,
      code: 'UPSTREAM_PARSE_ERROR',
      message: 'Invalid upstream payload format',
      status: 502,
      details: { videoId, providers: failures },
      corsHeaders: CORS_HEADERS,
    });
  }

  if (hasNotFound && failures.length === 1) {
    return errorResponse({
      requestId,
      code: 'VIDEO_NOT_FOUND',
      message: 'Video not found in upstream provider',
      status: 404,
      details: { videoId, providers: failures },
      corsHeaders: CORS_HEADERS,
    });
  }

  return errorResponse({
    requestId,
    code: 'UPSTREAM_ERROR',
    message: 'Failed to resolve audio stream from providers',
    status: 502,
    details: { videoId, providers: failures },
    corsHeaders: CORS_HEADERS,
  });
}
