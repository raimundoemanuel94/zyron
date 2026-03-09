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
    console.log('🔥 PWA SYSTEM: Inicializando ciclo de vida industrial');
    
    if ('serviceWorker' in navigator) {
      // Monitorar mudança de controle (novo SW assumindo)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.isUpdating) return;
        console.log('🔄 Novo Service Worker assumiu o controle. Recarregando...');
        window.location.reload();
      });

      try {
        // Tenta obter o registro existente
        this.swRegistration = await navigator.serviceWorker.getRegistration();
        
        if (!this.swRegistration) {
           this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        }

        console.log('✅ PWA: Registro ativo');
        this.setupCommunication();
        this.startHeartbeat();
        
        // Verificar atualizações a cada 1 hora
        setInterval(() => this.swRegistration?.update(), 60 * 60 * 1000);

      } catch (error) {
        console.error('❌ PWA: Erro no registro:', error);
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
    console.log('🚀 PWA: Verificando novas versões...');
    
    if (!this.swRegistration) return;

    try {
      // 1. Forçar verificação no servidor
      await this.swRegistration.update();

      // 2. Se houver um worker esperando, forçar skipWaiting
      if (this.swRegistration.waiting) {
        console.log('📦 PWA: Nova versão detectada! Forçando ativação...');
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // 3. Listener para quando o novo worker estiver pronto
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ PWA: Nova versão instalada. Pronto para atualizar.');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

    } catch (e) {
      console.error('❌ PWA: Erro ao buscar atualização:', e);
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
