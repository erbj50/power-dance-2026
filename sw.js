const CACHE_NAME = 'powerdance-v1';
// Adicione aqui os arquivos que você quer que funcionem offline
const ASSETS = [
  '/',
  '/index.html',
  '/landing.html',
  '/play.html',
  '/cor.gif',
  '/raiden.gif'
];

// Instalação do Service Worker e Cache dos arquivos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Estratégia de Cache: Serve o cache primeiro, se falhar busca na rede
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});