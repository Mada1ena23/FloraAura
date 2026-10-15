const CACHE_NAME = 'floraura-v1.0.1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pages/sobre.html',
  '/pages/offline.html',
  '/assets/css/styles.css',
  '/assets/js/app.js',
  '/assets/js/db.js',
  '/assets/js/modules/api.js',
  '/assets/js/modules/UI.js',
  '/manifest.json'
];

// Instalação do Service Worker e Caching dos Ficheiros
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[FloraAura SW] A guardar recursos estáticos no cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de Caches Antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[FloraAura SW] A remover cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Pedidos: Tenta Rede, com Fallback para Cache e Página Offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se for uma navegação HTML e falhar, exibe a página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/pages/offline.html');
          }
        });
      })
  );
});