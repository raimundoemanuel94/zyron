/**
 * ZYRON Service Worker v5.0.0
 * 
 * Estratégia: Network-first para assets dinâmicos, cache-first para estáticos.
 * SEM reloads automáticos. SEM heartbeat. SEM loops.
 * Detecta update e AVISA o cliente — o usuário decide quando atualizar.
 */
const CACHE_NAME = 'zyron-pwa-v5.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/zyron-192.png',
  '/images/zyron-512.png'
];

// ── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando', CACHE_NAME);
  self.skipWaiting(); // ativa imediatamente

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Alguns assets não foram cacheados:', err);
      });
    })
  );
});

// ── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado', CACHE_NAME);

  event.waitUntil(
    // Limpar caches de versões anteriores
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
     .then(() => {
       // Notifica TODOS os clientes que há uma nova versão ativa
       self.clients.matchAll().then((clients) => {
         clients.forEach((client) => {
           client.postMessage({
             type: 'UPDATE_AVAILABLE',
             version: CACHE_NAME,
             timestamp: Date.now()
           });
         });
       });
     })
  );
});

// ── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar requests não-GET e cross-origin
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // API routes: sempre network (sem cache)
  if (url.pathname.startsWith('/api/')) return;

  // JS/CSS: Network-first (pega sempre do servidor, fallback pro cache)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais assets (imagens, fontes, HTML): cache-first, refresh em background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });

      return cached || networkFetch;
    })
  );
});

// ── MESSAGES ────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((names) =>
        Promise.all(names.map((n) => caches.delete(n)))
      );
      break;

    case 'GET_VERSION':
      event.source?.postMessage({
        type: 'CURRENT_VERSION',
        version: CACHE_NAME
      });
      break;
  }
});
