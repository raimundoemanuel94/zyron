const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const getBrowserOrigin = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin || '';
};

const resolveApiBaseUrl = () => {
  const explicitBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  if (explicitBase) return trimTrailingSlash(explicitBase);

  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const host = window.location.hostname || '';
    if (LOCAL_HOSTS.has(host)) {
      const remoteDevBase = String(import.meta.env.VITE_DEV_API_BASE_URL || 'https://axiron.vercel.app').trim();
      return trimTrailingSlash(remoteDevBase);
    }
  }

  return trimTrailingSlash(getBrowserOrigin());
};

const API_BASE_URL = resolveApiBaseUrl();

export const getApiBaseUrl = () => API_BASE_URL;

export const buildApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) return normalizedPath;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getApiPathname = (url = '') => {
  if (!url) return '';
  try {
    const parsed = new URL(url, getBrowserOrigin() || 'http://localhost');
    return parsed.pathname || '';
  } catch {
    return url;
  }
};

export const isLocalDevApiUrl = (url = '') => {
  if (!import.meta.env.DEV) return false;
  try {
    const parsed = new URL(url, getBrowserOrigin() || 'http://localhost');
    return LOCAL_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};
