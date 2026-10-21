const APP_SCOPE_KEY = new URL(self.registration.scope).pathname
  .replace(/^\/|\/$/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '_') || 'root';
const CACHE_PREFIX = `floraura-${APP_SCOPE_KEY}-`;
const CACHE_NAME = `${CACHE_PREFIX}v1.0.11`;
const LEGACY_CACHES = [
  'floraura-v1.0.0',
  'floraura-v1.0.1',
  'floraura-v1.0.2',
  'floraura-v1.0.3',
  'floraura-v1.0.4',
  'floraura-v1.0.5',
  'floraura-v1.0.6',
  'floraura-v1.0.7',
  'floraura-v1.0.8',
  'floraura-v1.0.9',
  'floraura-v1.0.10'
];
const appAsset = (path) => new URL(path, self.registration.scope).href;
const ASSETS_TO_CACHE = [
  'index.html',
  'pages/sobre.html',
  'pages/offline.html',
  'assets/css/styles.css',
  'assets/images/logo.svg',
  'assets/images/icons/icon-192x192.png',
  'assets/images/icons/icon-512x512.png',
  'assets/js/app.js',
  'assets/js/db.js',
  'assets/js/modules/UI.js',
  'assets/js/modules/catalog.js',
  'assets/js/modules/catalog-data.js',
  'manifest.json'
].map(appAsset);

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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Ativação e limpeza de Caches Antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if ((key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) || LEGACY_CACHES.includes(key)) {
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
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && event.request.url.startsWith(self.registration.scope)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se for uma navegação HTML e falhar, exibe a página offline
          if (event.request.mode === 'navigate') {
            return caches.match(appAsset('pages/offline.html')) || Response.error();
          }
          return Response.error();
        });
      })
  );
});