const CACHE_NAME = 'zyron-pwa-v2.0.0-hardcore';
const FORCE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// URLs críticas que sempre devem estar atualizadas
const CRITICAL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/main.js',
  '/main.css',
  '/api/audio-stream/[id]',
  '/api/search'
];

// URLs para cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/zyron-192.png',
  '/images/zyron-512.png'
];

// Sistema de atualização automática hardcore
let updateTimer = null;
let isUpdating = false;

const forceUpdate = async () => {
  if (isUpdating) return;
  isUpdating = true;
  
  console.log('🔄 FORÇANDO ATUALIZAÇÃO AUTOMÁTICA');
  
  try {
    // 1. Notificar todos os clientes
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'FORCE_UPDATE',
        timestamp: Date.now(),
        version: CACHE_NAME
      });
    });
    
    // 2. Limpar cache antigo agressivamente
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    // 3. Forçar reload em todos os clientes
    clients.forEach(client => {
      client.postMessage({
        type: 'FORCE_RELOAD',
        timestamp: Date.now()
      });
    });
    
    console.log('✅ Atualização forçada concluída');
    
  } catch (error) {
    console.error('❌ Erro na atualização forçada:', error);
  } finally {
    isUpdating = false;
  }
};

// Instalar o service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker INSTALADO - v2.0.0-HARDCORE');
  
  // Forçar update imediatamente
  self.skipWaiting();
  
  // Iniciar timer de atualização automática
  updateTimer = setInterval(forceUpdate, FORCE_UPDATE_INTERVAL);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache crítico aberto');
        // Cache crítico primeiro
        return Promise.all(
          CRITICAL_URLS.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              return fetch(url);
            })
          )
        );
      })
      .then(() => {
        console.log('📦 Cache secundário aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('❌ Erro ao instalar cache:', error);
      })
  );
});

// Ativar o service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ATIVADO - v2.0.0-HARDCORE');
  
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
    }).then(() => {
      // Forçar controle imediato de todos os clientes
      return self.clients.claim();
    }).then(() => {
      console.log('🎯 Controle forçado de todos os clientes');
    })
  );
  
  // Notificar ativação hardcore
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        version: CACHE_NAME,
        timestamp: Date.now()
      });
    });
  });
});

// Fetch hardcore com cache inteligente
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Não interceptar APIs críticas - deixar passar direto
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('/manifest.json') ||
      url.pathname.includes('.js') ||
      url.pathname.includes('.css')) {
    return fetch(request);
  }
  
  // Estratégia de cache agressivo
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Verificar se tem em cache
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Cache hit - verificar se está atualizado
        const cachedDate = cachedResponse.headers.get('date');
        const now = new Date();
        const cacheAge = now - new Date(cachedDate);
        
        // Se cache for muito novo (< 1 minuto), usar cache
        if (cacheAge < CACHE_DURATION) {
          console.log('🎯 Cache HIT (fresco):', request.url);
          return cachedResponse;
        }
        
        // Cache velho - buscar nova versão em background
        console.log('🔄 Cache HIT (velho) - atualizando:', request.url);
        
        try {
          const freshResponse = await fetch(request);
          if (freshResponse.ok) {
            // Atualizar cache
            await cache.put(request, freshResponse.clone());
            return freshResponse;
          }
        } catch (error) {
          console.warn('⚠️ Falha ao atualizar cache, usando versão antiga:', error);
          return cachedResponse;
        }
      }
      
      // Cache miss - buscar e armazenar
      console.log('🌐 Cache MISS - buscando:', request.url);
      
      try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
          // Armazenar em cache
          const responseClone = networkResponse.clone();
          await cache.put(request, responseClone);
          console.log('✅ Recurso armazenado em cache:', request.url);
        }
        
        return networkResponse;
        
      } catch (error) {
        console.error('❌ Falha na rede:', error);
        return new Response('Erro de rede', { status: 500 });
      }
    })
  );
});

// Sistema de mensagens hardcore
self.addEventListener('message', (event) => {
  console.log('📨 Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ SkipWaiting solicitado');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'FORCE_UPDATE_NOW') {
    console.log('🔄 Forçando atualização imediata');
    forceUpdate();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Limpando cache solicitado');
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(name => caches.delete(name)));
    });
  }
});

// Forçar atualização a cada 30 segundos (hardcore)
setInterval(() => {
  console.log('💓 Verificação periódica de atualização');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'HEARTBEAT',
        timestamp: Date.now(),
        version: CACHE_NAME
      });
    });
  });
}, 30 * 1000);
