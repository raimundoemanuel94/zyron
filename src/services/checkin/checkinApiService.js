import { supabase } from '../../lib/supabase';

const parseResponse = async (response) => {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error?.message || json?.errorMessage || json?.message || `HTTP ${response.status}`;
    const error = new Error(message);
    error.code = json?.error?.code || json?.code || `HTTP_${response.status}`;
    error.status = response.status;
    error.payload = json;
    throw error;
  }
  return json;
};

const postWithAuth = async (url, body) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const err = new Error('Sessao invalida para check-in');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response);
};

export const checkinApi = {
  start(payload) {
    return postWithAuth('/api/checkins/start', payload);
  },
  heartbeat(payload) {
    return postWithAuth('/api/checkins/heartbeat', payload);
  },
  end(payload) {
    return postWithAuth('/api/checkins/end', payload);
  },
};

