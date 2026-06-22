// =============================================================================
// SERVICE WORKER - PWA (Web App Instalável)
// Arquivo: public/sw.js
// =============================================================================

const CACHE_NAME = 'suaagenda-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// =============================================================================
// INSTALL - Baixar e cachear recursos
// =============================================================================

self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Cache criado');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  
  self.skipWaiting(); // Ativar imediatamente
});

// =============================================================================
// ACTIVATE - Limpar caches antigos
// =============================================================================

self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim(); // Controlar clientes imediatamente
});

// =============================================================================
// FETCH - Servir do cache, se disponível
// =============================================================================

self.addEventListener('fetch', event => {
  // Ignorar requests não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Retornar do cache se disponível
      if (response) {
        console.log('[Service Worker] Servindo do cache:', event.request.url);
        return response;
      }

      // Caso contrário, buscar da rede
      return fetch(event.request)
        .then(response => {
          // Cachear se bem-sucedido
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback
          console.log('[Service Worker] Offline:', event.request.url);
          // Você pode retornar uma página offline aqui
        });
    })
  );
});

// =============================================================================
// BACKGROUND SYNC (Sincronizar quando voltar online)
// =============================================================================

self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Aqui você sincronizaria dados com o servidor
      Promise.resolve()
    );
  }
});

// =============================================================================
// PUSH NOTIFICATIONS (Notificações do servidor)
// =============================================================================

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: 'suaagenda-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SuaAgenda', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Abrir a app quando clicar na notificação
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
