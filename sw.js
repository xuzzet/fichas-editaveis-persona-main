/* =============================================================
   SERVICE WORKER — cache offline
   Estratégia:
     - network-first para o código do app (HTML/CSS/JS do mesmo
       domínio): quando online, o usuário SEMPRE recebe a versão
       mais recente; offline, cai no cache.
     - cache-first para bibliotecas (vendor) e imagens, que quase
       nunca mudam e podem ser servidas do cache para rapidez.
   Só é ativo quando o site é servido via http(s); em file:// o
   navegador ignora SW. Ao publicar mudanças, incremente CACHE_VERSION.
   ============================================================= */

const CACHE_VERSION = 'persona-ficha-v53';

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

// Guarda uma resposta válida do mesmo origin no cache atual.
function cachePut(req, res) {
  if (res && res.status === 200 && res.type === 'basic') {
    var copy = res.clone();
    caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
  }
}

// Código do app: HTML/CSS/JS do mesmo domínio (ou navegação).
function isAppCode(req, url) {
  if (req.mode === 'navigate') return true;
  if (url.origin !== self.location.origin) return false;
  var p = url.pathname;
  // vendor/ e imagens ficam de fora (usam cache-first).
  if (p.indexOf('/js/vendor/') !== -1) return false;
  return /\.(?:html|css|js)$/i.test(p);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  // Só tratamos GET do mesmo domínio; deixa CDNs/fonts passarem direto.
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  if (isAppCode(req, url)) {
    // NETWORK-FIRST: busca a versão mais recente; se offline, usa o cache.
    event.respondWith(
      fetch(req).then(function (res) {
        cachePut(req, res);
        return res;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // CACHE-FIRST: vendor, imagens e demais assets estáticos.
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        cachePut(req, res);
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
