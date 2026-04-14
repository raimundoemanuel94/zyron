import { supabase } from './supabase';

const INVALID_REFRESH_PATTERNS = [
  /invalid refresh token/i,
  /refresh token not found/i,
  /refresh token.*not found/i,
];

const AUTH_STORAGE_KEY_PATTERN = /^sb-.*-auth-token$/i;
export const AUTH_SESSION_RESET_EVENT = 'zyron:auth-session-reset';

const getErrorMessage = (error) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return String(
    error.message
    || error.error_description
    || error.description
    || error.msg
    || ''
  );
};

export const isInvalidRefreshTokenError = (error) => {
  const message = getErrorMessage(error);
  return INVALID_REFRESH_PATTERNS.some((pattern) => pattern.test(message));
};

const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(window.localStorage || {});
    keys.forEach((key) => {
      if (!key) return;
      if (AUTH_STORAGE_KEY_PATTERN.test(key) || key === 'supabase.auth.token') {
        window.localStorage.removeItem(key);
      }
    });
  } catch {
    // noop
  }
};

export const forceResetAuthSession = async (reason = 'invalid_refresh_token') => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // noop
  }

  clearAuthStorage();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_RESET_EVENT, {
      detail: {
        reason,
        at: new Date().toISOString(),
      },
    }));
  }
};

export const getSessionOrHandleInvalidRefresh = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error && isInvalidRefreshTokenError(error)) {
    console.warn('[auth] invalid refresh token detected, forcing local sign-out');
    await forceResetAuthSession('invalid_refresh_token');
    return { session: null, error };
  }

  return {
    session: data?.session || null,
    error: error || null,
  };
};
