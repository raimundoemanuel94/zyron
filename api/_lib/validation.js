export const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const isValidYouTubeVideoId = (value) => /^[a-zA-Z0-9_-]{11}$/.test(normalizeText(value));

export const getVideoIdFromRequest = (req, {
  queryParam = 'id',
  excludeSegments = ['audio-stream'],
} = {}) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const lastSegment = normalizeText(decodeURIComponent(pathParts[pathParts.length - 1] || ''));
  const fromQuery = normalizeText(url.searchParams.get(queryParam));

  if (lastSegment && !excludeSegments.includes(lastSegment)) {
    return lastSegment;
  }

  return fromQuery;
};

