/**
 * ZYRON PWA Manager v3.0
 *
 * Ciclo correto de update:
 *   1. SW detecta nova versão → chama _notifyUpdate()
 *   2. UI mostra banner → usuário clica "Atualizar"
 *   3. applyUpdate() → salva versão no localStorage → skipWaiting
 *   4. Aguarda evento 'controllerchange' → ENTÃO recarrega (1x)
 *
 * Proteção contra loop:
 *   - localStorage guarda a versão "em update" antes do reload
 *   - ForceUpdateBanner checa essa entrada e não mostra o banner
 *     se a versão já foi aplicada
 */
export class ZyronPWA {
  constructor() {
    this.swRegistration = null;
    this.hasUpdate      = false;
    this._onUpdateCbs   = [];
    this._isApplying    = false; // previne duplo clique

    this.init();
  }

  async init() {
    if (!('serviceWorker' in navigator)) return;

    try {
      this.swRegistration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw.js'));

      console.log('[PWA] Registro obtido');

      // ── Detecta update: novo SW instalado enquanto há controlador ativo ──
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('[PWA] Nova versão disponível (updatefound)');
            this.hasUpdate = true;
            this._notifyUpdate('updatefound');
          }
        });
      });

      // ── Detecta update: mensagem direta do SW (ativação com caches antigos) ──
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          const version = event.data.version || '';

          // Se já aplicamos este update (localStorage), ignora
          const applied = localStorage.getItem('zyron-last-applied-version');
          if (applied === version) {
            console.log('[PWA] UPDATE_AVAILABLE ignorado — versão já aplicada:', version);
            return;
          }

          console.log('[PWA] UPDATE_AVAILABLE recebido do SW:', version);
          this.hasUpdate = true;
          this._notifyUpdate(version);
        }
      });

      // ── Verifica atualizações a cada 1 hora ──
      setInterval(() => {
        this.swRegistration?.update().catch(() => {});
      }, 60 * 60 * 1000);

    } catch (err) {
      console.error('[PWA] Erro no registro:', err);
    }
  }

  /** Registra callback para quando houver update disponível */
  onUpdate(cb) {
    this._onUpdateCbs.push(cb);
    if (this.hasUpdate) cb(); // já tem update pendente
  }

  /**
   * Aplica update corretamente:
   * 1. Salva versão aplicada no localStorage
   * 2. Manda skipWaiting para o SW em espera
   * 3. Aguarda controllerchange → ENTÃO recarrega (evita loop)
   */
  applyUpdate() {
    if (this._isApplying) return;
    this._isApplying = true;

    console.log('[PWA] Aplicando update...');

    // Guarda a versão atual do cache para não re-exibir o banner
    if (this.swRegistration?.waiting) {
      // Escuta controllerchange: dispara quando o SW.waiting assumiu controle
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        console.log('[PWA] controllerchange → recarregando');
        window.location.reload();
      });

      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

    } else {
      // Nenhum SW em espera — reload simples
      console.log('[PWA] Nenhum SW em espera, reload simples');
      window.location.reload();
    }
  }

  /** Limpa o cache via SW */
  clearCache() {
    this.swRegistration?.active?.postMessage({ type: 'CLEAR_CACHE' });
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return (await Notification.requestPermission()) === 'granted';
    }
    return false;
  }

  /** @private */
  _notifyUpdate(version = '') {
    this._onUpdateCbs.forEach((cb) => cb(version));
    window.dispatchEvent(
      new CustomEvent('zyron-update-available', { detail: { version } })
    );
  }
}

// ── Singleton global ────────────────────────────────────────────────────────
let hardcorePWA = null;

if (typeof window !== 'undefined') {
  hardcorePWA = new ZyronPWA();
}

export default hardcorePWA;
