const CACHE_NAME = 'powerdance-v8'; // Aumentamos para v8 para forçar a atualização e limpar o bug anterior

// Lista limpa com o que realmente existe na raiz do seu projeto atual
const ASSETS = [
    '/',
    '/index.html',
    '/landing.html',
    '/play.html',
    '/manifest.json',
    '/samp.html',
    '/power.html',
    '/tela-carrossel.html',
    '/mm.html',
    '/mdl.html',
    '/tela.html',
    '/admin_m.html',
    '/tela-admin1.html',
    '/tela-admin2.html',
    '/meta-cover.html',
    '/cor.gif',
    '/raiden.gif',
    '/eu1.jpg',
    '/logodj.gif',
    '/vu7.jpg'
];



// Instalação do Service Worker e Cache dos arquivos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos um mapeamento para carregar os arquivos e evitar que um erro isole o PWA inteiro
      return Promise.all(
        ASSETS.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('Aviso: Não foi possível salvar no cache o arquivo: ' + url, err);
          });
        })
      );
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