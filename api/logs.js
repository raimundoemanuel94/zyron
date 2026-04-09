import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

const extractBearerToken = (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization token');
  }
  return authHeader.split(' ')[1];
};

const getSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

const authenticateUser = async (supabase, token) => {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  return user;
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const supabase = getSupabaseClient();

    if (req.method === 'POST') {
      const token = extractBearerToken(req);
      const user = await authenticateUser(supabase, token);

      const logEntry = await req.json();

      // Validar payload obrigatório
      if (!logEntry.message || !logEntry.level || !logEntry.type) {
        return json(
          { error: 'Missing required fields: message, level, type' },
          400
        );
      }

      // Validar valores enum
      const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
      const validTypes = ['sync', 'checkin', 'auth', 'ai', 'error', 'warning', 'info', 'user_action'];

      if (!validLevels.includes(logEntry.level)) {
        return json(
          { error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
          400
        );
      }

      if (!validTypes.includes(logEntry.type)) {
        return json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          400
        );
      }

      // Construir row para inserir (colunas: log_type e log_level)
      const row = {
        user_id: user.id,
        log_type: logEntry.type,
        log_level: logEntry.level,
        message: logEntry.message,
        context: logEntry.context || null,
        meta: logEntry.meta || null,
        client_timestamp: logEntry.timestamp ? new Date(logEntry.timestamp).toISOString() : null,
        workout_id: logEntry.workout_id || null,
        checkin_id: logEntry.checkin_id || null,
        request_id: logEntry.request_id || null,
        expires_at: logEntry.expires_at ? new Date(logEntry.expires_at).toISOString() : null,
      };

      const { data, error } = await supabase
        .from('app_logs')
        .insert(row)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to insert log:', error);
        return json(
          { error: 'Failed to save log', details: error.message },
          500
        );
      }

      // Log crítico para console do servidor
      if (logEntry.level === 'ERROR' || logEntry.level === 'FATAL') {
        console.error('🚨 CRITICAL LOG ENTRY:', {
          user_id: user.id,
          type: logEntry.type,
          message: logEntry.message,
          context: logEntry.context,
        });
      }

      return json({
        success: true,
        logId: data.id,
      });
    }

    if (req.method === 'GET') {
      const token = extractBearerToken(req);
      const user = await authenticateUser(supabase, token);

      const url = new URL(req.url);
      const type = url.searchParams.get('type');
      const level = url.searchParams.get('level');
      const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 1000);
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      // Construir query
      let query = supabase
        .from('app_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('log_type', type);
      }

      if (level) {
        query = query.eq('log_level', level);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('Failed to fetch logs:', error);
        return json(
          { error: 'Failed to fetch logs', details: error.message },
          500
        );
      }

      // Calcular estatísticas
      const statsQuery = await supabase
        .from('app_logs')
        .select('log_level, log_type', { count: 'exact' })
        .eq('user_id', user.id);

      const allLogs = statsQuery.data || [];
      const stats = {
        total: count || 0,
        errors: allLogs.filter(log => log.log_level === 'ERROR').length,
        fatals: allLogs.filter(log => log.log_level === 'FATAL').length,
        warnings: allLogs.filter(log => log.log_level === 'WARN').length,
        sync: allLogs.filter(log => log.log_type === 'sync').length,
        checkin: allLogs.filter(log => log.log_type === 'checkin').length,
        auth: allLogs.filter(log => log.log_type === 'auth').length,
        ai: allLogs.filter(log => log.log_type === 'ai').length,
      };

      return json({
        logs: data,
        stats,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      });
    }

    if (req.method === 'DELETE') {
      const token = extractBearerToken(req);
      const user = await authenticateUser(supabase, token);

      const url = new URL(req.url);
      const olderThanHours = url.searchParams.get('olderThan');

      if (!olderThanHours) {
        return json({ error: 'olderThan parameter is required' }, 400);
      }

      const cutoffTime = new Date(Date.now() - parseInt(olderThanHours) * 60 * 60 * 1000);

      const { count, error } = await supabase
        .from('app_logs')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffTime.toISOString());

      if (error) {
        console.error('Failed to delete logs:', error);
        return json(
          { error: 'Failed to delete logs', details: error.message },
          500
        );
      }

      return json({
        success: true,
        deletedCount: count || 0,
      });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Logs handler error:', error);
    return json(
      { error: error.message || 'Internal server error' },
      error.message?.includes('Unauthorized') ? 401 : 500
    );
  }
}
