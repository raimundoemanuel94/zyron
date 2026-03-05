import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';

export default function DebugLogs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [serverStats, setServerStats] = useState(null);

  useEffect(() => {
    loadLogs();
    loadServerStats();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      loadLogs();
      loadServerStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadLogs = () => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
  };

  const loadServerStats = async () => {
    try {
      const response = await fetch('/api/logs?limit=0');
      if (response.ok) {
        const data = await response.json();
        setServerStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do servidor:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.level === filter;
    const matchesSearch = search === '' || 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.data).toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const toggleExpanded = (logId) => {
    setExpanded(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const clearLogs = () => {
    logger.clearLogs();
    loadLogs();
  };

  const exportLogs = () => {
    logger.exportLogs();
  };

  const getLevelColor = (level) => {
    const colors = {
      'ERROR': 'text-red-400 bg-red-900/20 border-red-800',
      'WARN': 'text-yellow-400 bg-yellow-900/20 border-yellow-800',
      'INFO': 'text-blue-400 bg-blue-900/20 border-blue-800',
      'DEBUG': 'text-gray-400 bg-gray-900/20 border-gray-800',
      'USER_ACTION': 'text-green-400 bg-green-900/20 border-green-800',
      'SYSTEM_EVENT': 'text-purple-400 bg-purple-900/20 border-purple-800'
    };
    return colors[level] || 'text-gray-400 bg-gray-900/20 border-gray-800';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Logs disponíveis apenas em modo desenvolvimento</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-4xl max-h-96 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold flex items-center">
            📊 ZYRON Logs ({filteredLogs.length})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={loadLogs}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              🔄
            </button>
            <button
              onClick={exportLogs}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              📥
            </button>
            <button
              onClick={clearLogs}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Server Stats */}
        {serverStats && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-red-400 font-bold">{serverStats.errors}</div>
              <div className="text-gray-400">Erros</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold">{serverStats.userActions}</div>
              <div className="text-gray-400">Ações</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold">{serverStats.last24h}</div>
              <div className="text-gray-400">24h</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex space-x-2 mt-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
          >
            <option value="ALL">Todos</option>
            <option value="ERROR">Erros</option>
            <option value="WARN">Warnings</option>
            <option value="USER_ACTION">Ações</option>
            <option value="SYSTEM_EVENT">Sistema</option>
          </select>
          
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 flex-1"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="overflow-y-auto max-h-64 p-2 space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            Nenhum log encontrado
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`border rounded p-2 cursor-pointer transition-all ${getLevelColor(log.level)}`}
              onClick={() => toggleExpanded(log.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold">{log.level}</span>
                  <span className="text-xs">{formatTimestamp(log.timestamp)}</span>
                  <span className="text-xs truncate max-w-xs">{log.message}</span>
                </div>
                <span className="text-xs">
                  {expanded[log.id] ? '▼' : '▶'}
                </span>
              </div>

              {expanded[log.id] && (
                <div className="mt-2 text-xs space-y-1">
                  <div><strong>Usuário:</strong> {log.user?.email || 'anonymous'}</div>
                  <div><strong>Dispositivo:</strong> {log.device?.platform} ({log.device?.isMobile ? 'Mobile' : 'Desktop'})</div>
                  
                  {log.data && Object.keys(log.data).length > 0 && (
                    <div>
                      <strong>Dados:</strong>
                      <pre className="bg-black/30 p-1 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {log.error && (
                    <div>
                      <strong>Erro:</strong>
                      <div className="bg-red-900/20 p-1 rounded mt-1">
                        <div>{log.error.name}: {log.error.message}</div>
                        {log.error.stack && (
                          <details className="mt-1">
                            <summary className="cursor-pointer">Stack Trace</summary>
                            <pre className="text-xs mt-1 whitespace-pre-wrap">
                              {log.error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
