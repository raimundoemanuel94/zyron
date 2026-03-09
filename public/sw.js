const CACHE_NAME = 'zyron-pwa-v1.3.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/zyron-192.png',
  '/images/zyron-512.png'
];

// Instalar o service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado - v1.3.0');
  
  // Forçar update imediatamente
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Erro ao instalar cache:', error);
      })
  );
});

// Ativar o service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ativado - v1.3.0');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Forçar controle imediato de todos os clientes
  return self.clients.claim();
});

// Enviar mensagem para todos os clientes quando houver update
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker recebeu mensagem:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Enviar update para todos os clientes
  if (event.data && event.data.type === 'UPDATE_CLIENTS') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        return Promise.all(
          clients.map((client) => {
            console.log('📨 Enviando update para cliente:', client.url);
            return client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: CACHE_NAME
            });
          })
        );
      })
    );
  }
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Não interceptar requisições de API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log('📦 Cache hit para:', event.request.url);
          return response;
        }
        
        // Network request
        return fetch(event.request)
          .then((response) => {
            // Verificar se resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar resposta
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.error('❌ Erro na requisição:', error);
            
            // Tentar offline fallback
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Skip waiting para atualização imediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skip waiting recebido, ativando novo service worker');
    self.skipWaiting();
  }
});

// Background sync para música
self.addEventListener('sync', (event) => {
  if (event.tag === 'music-sync') {
    console.log('🎵 Background sync para música');
    event.waitUntil(
      // Lógica de sincronização aqui
      Promise.resolve()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização do ZYRON',
    icon: '/images/zyron-192.png',
    badge: '/images/zyron-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir ZYRON',
        icon: '/images/zyron-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ZYRON', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
