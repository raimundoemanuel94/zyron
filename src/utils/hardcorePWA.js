// Sistema PWA HARDCORE - Atualizações automáticas forçadas
export class HardcorePWA {
  constructor() {
    this.swRegistration = null;
    this.updateInterval = null;
    this.heartbeatInterval = null;
    this.isUpdating = false;
    
    this.init();
  }

  async init() {
    console.log('🔥 Iniciando sistema PWA HARDCORE');
    
    // 1. Registrar Service Worker
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('✅ Service Worker registrado:', this.swRegistration);
        
        // 2. Iniciar comunicação
        this.setupCommunication();
        
        // 3. Iniciar heartbeat
        this.startHeartbeat();
        
        // 4. Forçar primeira atualização
        setTimeout(() => this.forceUpdate(), 5000);
        
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
      }
    }
  }

  setupCommunication() {
    if (!this.swRegistration) return;
    
    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Mensagem do SW:', event.data);
      
      switch (event.data.type) {
        case 'SW_ACTIVATED':
          console.log('🚀 Service Worker ativado - versão:', event.data.version);
          this.onSWActivated(event.data);
          break;
          
        case 'FORCE_UPDATE':
          console.log('🔄 Atualização forçada solicitada');
          this.onForceUpdate(event.data);
          break;
          
        case 'FORCE_RELOAD':
          console.log('🔄 Reload forçado solicitado');
          this.onForceReload(event.data);
          break;
          
        case 'HEARTBEAT':
          console.log('💓 Heartbeat recebido:', event.data.version);
          this.onHeartbeat(event.data);
          break;
      }
    });
  }

  startHeartbeat() {
    // Heartbeat a cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({
          type: 'HEARTBEAT_CHECK',
          timestamp: Date.now()
        });
      }
    }, 30 * 1000);
  }

  async forceUpdate() {
    if (this.isUpdating) {
      console.log('⚠️ Atualização já em andamento');
      return;
    }
    
    this.isUpdating = true;
    console.log('🔄 FORÇANDO ATUALIZAÇÃO HARDCORE');
    
    try {
      // 1. Notificar Service Worker
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({
          type: 'FORCE_UPDATE_NOW',
          timestamp: Date.now()
        });
      }
      
      // 2. Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Forçar reload
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Erro na atualização forçada:', error);
      this.isUpdating = false;
    }
  }

  async clearCache() {
    console.log('🗑️ Limpando cache forçado');
    
    if (this.swRegistration && this.swRegistration.active) {
      this.swRegistration.active.postMessage({
        type: 'CLEAR_CACHE',
        timestamp: Date.now()
      });
    }
  }

  onSWActivated(data) {
    // Callback quando SW é ativado
    console.log('🎯 SW ativado - versão:', data.version);
    
    // Notificar aplicação
    window.dispatchEvent(new CustomEvent('sw-activated', {
      detail: data
    }));
  }

  onForceUpdate(data) {
    // Callback quando atualização é forçada
    console.log('🔄 Atualização forçada iniciada');
    
    // Mostrar notificação
    this.showNotification('🔄 Atualizando ZYRON...', 'Forçando atualização automática');
    
    // Notificar aplicação
    window.dispatchEvent(new CustomEvent('force-update', {
      detail: data
    }));
  }

  onForceReload(data) {
    // Callback quando reload é forçado
    console.log('🔄 Reload forçado iniciado');
    
    // Mostrar notificação
    this.showNotification('🔄 Recarregando...', 'Atualização aplicada');
    
    // Notificar aplicação
    window.dispatchEvent(new CustomEvent('force-reload', {
      detail: data
    }));
  }

  onHeartbeat(data) {
    // Callback de heartbeat
    console.log('💓 Heartbeat recebido:', data.timestamp);
  }

  showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/images/zyron-192.png',
        badge: '/images/zyron-192.png',
        tag: 'zyron-update'
      });
    }
  }

  // Request permissão de notificação
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permissão de notificação:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  // Limpar tudo
  destroy() {
    console.log('🧹 Limpando sistema PWA HARDCORE');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.swRegistration) {
      this.swRegistration.unregister();
    }
  }
}

// Instância global
let hardcorePWA = null;

// Auto-inicializar quando o módulo é carregado
if (typeof window !== 'undefined') {
  hardcorePWA = new HardcorePWA();
}

export default hardcorePWA;
