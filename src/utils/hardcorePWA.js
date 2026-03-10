/**
 * ZYRON PWA Manager v2.0
 * 
 * Gerencia o ciclo de vida do Service Worker de forma LIMPA.
 * SEM heartbeats. SEM loops. SEM reloads automáticos.
 * Detecta updates e notifica a UI para que o usuário decida.
 */
export class ZyronPWA {
  constructor() {
    this.swRegistration = null;
    this.hasUpdate = false;
    this._onUpdateCallbacks = [];

    this.init();
  }

  async init() {
    if (!('serviceWorker' in navigator)) return;

    try {
      // Registrar (ou obter registro existente)
      this.swRegistration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw.js'));

      console.log('[PWA] Registro obtido');

      // Escutar quando um novo SW é encontrado
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // Novo SW instalado e há um controlador existente → é um UPDATE real
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nova versão disponível!');
            this.hasUpdate = true;
            this._notifyUpdate();
          }
        });
      });

      // Escutar mensagens do SW (ex: UPDATE_AVAILABLE na ativação)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          console.log('[PWA] SW enviou UPDATE_AVAILABLE');
          this.hasUpdate = true;
          this._notifyUpdate();
        }
      });

      // Verificar atualizações a cada 1 hora (leve, sem loop agressivo)
      setInterval(() => {
        this.swRegistration?.update().catch(() => {});
      }, 60 * 60 * 1000);

    } catch (err) {
      console.error('[PWA] Erro no registro:', err);
    }
  }

  /** Registra um callback para quando houver update disponível */
  onUpdate(cb) {
    this._onUpdateCallbacks.push(cb);
    // Se já tiver update pendente, notifica imediatamente
    if (this.hasUpdate) cb();
  }

  /** Aplica o update (skipWaiting + reload UMA VEZ) */
  applyUpdate() {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload controlado — só acontece quando o USUÁRIO clica
    window.location.reload();
  }

  /** Limpar cache manualmente */
  clearCache() {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  }

  /** Pedir permissão de notificação (opcional) */
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return (await Notification.requestPermission()) === 'granted';
    }
    return false;
  }

  /** @private */
  _notifyUpdate() {
    this._onUpdateCallbacks.forEach((cb) => cb());
    // Dispara evento custom para quem preferir escutar via DOM
    window.dispatchEvent(new CustomEvent('zyron-update-available'));
  }
}

// ── Instância global singleton ──────────────────────────────────────────────
let hardcorePWA = null;

if (typeof window !== 'undefined') {
  hardcorePWA = new ZyronPWA();
}

export default hardcorePWA;
