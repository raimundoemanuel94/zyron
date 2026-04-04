export const config = {
  runtime: 'edge',
};

// Armazenamento em memória (em produção, use banco de dados)
const logs = [];
const maxLogs = 10000;

export default async function handler(req) {
  if (req.method === 'POST') {
    try {
      // Receber novo log
      const logEntry = await req.json();
      
      // Validar log
      if (!logEntry.timestamp || !logEntry.level || !logEntry.message) {
        return new Response(JSON.stringify({ error: 'Log inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Adicionar timestamp do servidor
      logEntry.serverTimestamp = new Date().toISOString();
      
      // Adicionar à lista
      logs.unshift(logEntry);
      
      // Manter apenas os logs mais recentes
      if (logs.length > maxLogs) {
        logs.splice(maxLogs);
      }

      // Log crítico para console do servidor
      if (logEntry.level === 'ERROR') {
        console.error('🚨 ERRO CRÍTICO DO ZYRON:', {
          user: logEntry.user?.email,
          message: logEntry.message,
          error: logEntry.error?.message,
          timestamp: logEntry.timestamp,
          device: logEntry.device?.platform
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        logId: logEntry.id,
        totalLogs: logs.length 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Erro ao processar log:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const level = url.searchParams.get('level');
      const limit = parseInt(url.searchParams.get('limit')) || 100;
      const userId = url.searchParams.get('userId');

      let filteredLogs = logs;

      // Filtrar por nível
      if (level) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }

      // Filtrar por usuário
      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.user?.id === userId);
      }

      // Limitar resultados
      const limitedLogs = filteredLogs.slice(0, limit);

      // Estatísticas
      const stats = {
        total: logs.length,
        errors: logs.filter(log => log.level === 'ERROR').length,
        warnings: logs.filter(log => log.level === 'WARN').length,
        userActions: logs.filter(log => log.level === 'USER_ACTION').length,
        systemEvents: logs.filter(log => log.level === 'SYSTEM_EVENT').length,
        last24h: logs.filter(log => {
          const logTime = new Date(log.timestamp);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return logTime > dayAgo;
        }).length
      };

      return new Response(JSON.stringify({
        logs: limitedLogs,
        stats,
        total: filteredLogs.length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });

    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const url = new URL(req.url);
      const olderThan = url.searchParams.get('olderThan');

      if (olderThan) {
        // Deletar logs mais antigos que X horas
        const cutoffTime = new Date(Date.now() - parseInt(olderThan) * 60 * 60 * 1000);
        const initialCount = logs.length;
        
        for (let i = logs.length - 1; i >= 0; i--) {
          if (new Date(logs[i].timestamp) < cutoffTime) {
            logs.splice(i, 1);
          }
        }

        return new Response(JSON.stringify({
          success: true,
          deletedCount: initialCount - logs.length,
          remainingCount: logs.length
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        // Deletar todos os logs
        const deletedCount = logs.length;
        logs.length = 0;

        return new Response(JSON.stringify({
          success: true,
          deletedCount,
          message: 'Todos os logs foram deletados'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

    } catch (error) {
      console.error('Erro ao deletar logs:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  return new Response(JSON.stringify({ error: 'Método não permitido' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
