class ZYRONLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.endpoint = '/api/logs';
  }

  // Níveis de log
  levels = {
    ERROR: 'ERROR',
    WARN: 'WARN', 
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    USER_ACTION: 'USER_ACTION',
    SYSTEM_EVENT: 'SYSTEM_EVENT'
  };

  // Formatar timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Obter informações do usuário
  getUserInfo() {
    try {
      const user = JSON.parse(localStorage.getItem('zyron_user') || '{}');
      return {
        id: user.id || 'anonymous',
        email: user.email || 'anonymous',
        role: user.role || 'user'
      };
    } catch {
      return { id: 'anonymous', email: 'anonymous', role: 'user' };
    }
  }

  // Obter informações do dispositivo
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      online: navigator.onLine,
      battery: navigator.getBattery ? 'supported' : 'not-supported'
    };
  }

  // Obter informações da aplicação
  getAppInfo() {
    return {
      version: '1.1.0',
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      timestamp: this.getTimestamp()
    };
  }

  // Criar entrada de log
  createLogEntry(level, message, data = {}, error = null) {
    const entry = {
      id: this.generateId(),
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code || null
      } : null,
      user: this.getUserInfo(),
      device: this.getDeviceInfo(),
      app: this.getAppInfo(),
      sessionId: this.getSessionId()
    };

    return entry;
  }

  // Gerar ID único
  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obter/criar session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('zyron_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('zyron_session_id', sessionId);
    }
    return sessionId;
  }

  // Adicionar log ao array
  addLog(entry) {
    this.logs.unshift(entry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Salvar no localStorage
    this.saveLogsToStorage();

    // Enviar para servidor se for erro
    if (entry.level === this.levels.ERROR) {
      this.sendToServer(entry);
    }

    // Console output em desenvolvimento
    if (this.isDevelopment) {
      this.consoleOutput(entry);
    }
  }

  // Salvar logs no localStorage
  saveLogsToStorage() {
    try {
      const logsToSave = this.logs.slice(0, 100); // Salva apenas 100 logs no storage
      localStorage.setItem('zyron_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.warn('Erro ao salvar logs no localStorage:', error);
    }
  }

  // Carregar logs do localStorage
  loadLogsFromStorage() {
    try {
      const savedLogs = localStorage.getItem('zyron_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.warn('Erro ao carregar logs do localStorage:', error);
      this.logs = [];
    }
  }

  // Output no console
  consoleOutput(entry) {
    const style = {
      ERROR: 'color: #ff4444; font-weight: bold;',
      WARN: 'color: #ffaa00; font-weight: bold;',
      INFO: 'color: #4444ff; font-weight: bold;',
      DEBUG: 'color: #888888;',
      USER_ACTION: 'color: #00aa44; font-weight: bold;',
      SYSTEM_EVENT: 'color: #aa00aa; font-weight: bold;'
    };

    const css = style[entry.level] || '';
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.user.id}]`;
    
    console.log(`%c${prefix} ${entry.message}`, css, entry);
  }

  // Enviar log para servidor
  async sendToServer(entry) {
    // Em desenvolvimento, não enviar para servidor (evita erros 404)
    if (this.isDevelopment) {
      return;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Erro ao enviar log para servidor:', error);
    }
  }

  // Métodos de log
  error(message, data = {}, error = null) {
    const entry = this.createLogEntry(this.levels.ERROR, message, data, error);
    this.addLog(entry);
    return entry;
  }

  warn(message, data = {}) {
    const entry = this.createLogEntry(this.levels.WARN, message, data);
    this.addLog(entry);
    return entry;
  }

  info(message, data = {}) {
    const entry = this.createLogEntry(this.levels.INFO, message, data);
    this.addLog(entry);
    return entry;
  }

  debug(message, data = {}) {
    const entry = this.createLogEntry(this.levels.DEBUG, message, data);
    this.addLog(entry);
    return entry;
  }

  userAction(action, data = {}) {
    const entry = this.createLogEntry(this.levels.USER_ACTION, `USER: ${action}`, data);
    this.addLog(entry);
    return entry;
  }

  systemEvent(event, data = {}) {
    const entry = this.createLogEntry(this.levels.SYSTEM_EVENT, `SYSTEM: ${event}`, data);
    this.addLog(entry);
    return entry;
  }

  // Obter logs
  getLogs(level = null, limit = 50) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(0, limit);
  }

  // Obter erros
  getErrors(limit = 20) {
    return this.getLogs(this.levels.ERROR, limit);
  }

  // Obter ações do usuário
  getUserActions(limit = 50) {
    return this.getLogs(this.levels.USER_ACTION, limit);
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('zyron_logs');
    this.info('Logs limpos pelo usuário');
  }

  // Exportar logs
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `zyron_logs_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Inicializar
  init() {
    this.loadLogsFromStorage();
    this.systemEvent('Logger inicializado', { logsCount: this.logs.length });
    
    // Capturar erros globais
    window.addEventListener('error', (event) => {
      this.error('Erro JavaScript global', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, event.error);
    });

    // Capturar rejeições não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise rejeitada não tratada', {
        reason: event.reason
      });
    });

    // Capturar mudanças de conexão
    window.addEventListener('online', () => {
      this.systemEvent('Conexão restaurada');
    });

    window.addEventListener('offline', () => {
      this.systemEvent('Conexão perdida');
    });
  }
}

// Instância global
const logger = new ZYRONLogger();
logger.init();

export default logger;
