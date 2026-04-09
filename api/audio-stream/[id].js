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

const PROVIDERS = [
  {
    name: 'pipedapi.kavin.rocks',
    buildUrl: (id) => `https://pipedapi.kavin.rocks/streams/${id}`,
  },
  {
    name: 'pipedapi.adminforge.de',
    buildUrl: (id) => `https://pipedapi.adminforge.de/streams/${id}`,
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

const getFromCache = (videoId) => {
  const cached = streamCache.get(videoId);
  if (!cached) return null;

  if (Date.now() >= cached.expiresAt) {
    streamCache.delete(videoId);
    return null;
  }

  return cached.value;
};

const setCache = (videoId, value) => {
  if (streamCache.size >= STREAM_CACHE_MAX_ITEMS) {
    const oldestKey = streamCache.keys().next().value;
    if (oldestKey) streamCache.delete(oldestKey);
  }

  streamCache.set(videoId, {
    value,
    expiresAt: Date.now() + STREAM_CACHE_TTL_MS,
  });
};

const fetchProvider = async (provider, videoId, timeoutMs = 8000) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(provider.buildUrl(videoId), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ZYRON-Audio-Proxy/1.1',
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new ApiError({
          code: 'UPSTREAM_RATE_LIMITED',
          message: 'Upstream rate limit reached',
          status: 502,
          details: { upstream_status: 429 },
        });
      }

      if (response.status === 404) {
        throw new ApiError({
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found in upstream provider',
          status: 404,
          details: { upstream_status: 404 },
        });
      }

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
        message: 'Timeout while fetching audio stream',
        status: 408,
      });
    }

    throw toApiError(error, {
      code: 'UPSTREAM_ERROR',
      message: 'Failed to fetch audio stream from upstream',
      status: 502,
    });
  } finally {
    clearTimeout(timeoutId);
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

  const cached = getFromCache(videoId);
  if (cached) {
    log.info('cache=HIT', { videoId });
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

  log.info('cache=MISS', { videoId });

  const failures = [];

  for (const provider of PROVIDERS) {
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

      setCache(videoId, result);

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
