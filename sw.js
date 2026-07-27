/* =============================================================
   SERVICE WORKER — cache offline
   Estratégia: cache-first para os assets do app (funciona sem
   internet numa sessão de RPG). Só é ativo quando o site é
   servido via http(s); em file:// o navegador ignora SW.
   Ao publicar mudanças, incremente CACHE_VERSION.
   ============================================================= */

const CACHE_VERSION = 'persona-ficha-v27';

// Assets essenciais para a app abrir offline. Os CSS/JS são
// carregados sob demanda e cacheados dinamicamente no fetch.
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './js/app.js',
  './js/vendor/pdf-lib.min.js',
  './js/vendor/html2canvas.min.js',
  './Elements/background-image.jpg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      // addAll falha se qualquer item falhar; usamos allSettled via map.
      return Promise.all(
        CORE_ASSETS.map(function (url) {
          return cache.add(url).catch(function () { /* ignora asset ausente */ });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_VERSION; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  // Só tratamos GET do mesmo domínio; deixa CDNs/fonts passarem direto.
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        // Cacheia dinamicamente respostas válidas do mesmo origin.
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // Offline e sem cache: para navegação, tenta servir o index.
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
