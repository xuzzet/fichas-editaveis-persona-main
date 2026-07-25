// =============================================
// CARREGAMENTO SOB DEMANDA DE BIBLIOTECAS PESADAS
// pdf-lib (~525KB) e html2canvas (~198KB) só são baixados quando o
// usuário realmente aciona a exportação de PDF/PNG, em vez de bloquear
// o carregamento inicial da página. Camada aditiva — não altera lógica.
// =============================================

var cache = {};

// Injeta um <script> uma única vez e resolve quando carregar.
export function loadScriptOnce(src) {
  if (cache[src]) return cache[src];
  cache[src] = new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = function () { resolve(); };
    s.onerror = function () {
      cache[src] = null; // permite nova tentativa
      reject(new Error('Falha ao carregar ' + src));
    };
    document.head.appendChild(s);
  });
  return cache[src];
}

// Garante que a biblioteca pdf-lib esteja disponível (window.PDFLib).
export function ensurePdfLib() {
  if (typeof PDFLib !== 'undefined') return Promise.resolve();
  return loadScriptOnce('./js/vendor/pdf-lib.min.js');
}

// Garante que a biblioteca html2canvas esteja disponível.
export function ensureHtml2canvas() {
  if (typeof html2canvas !== 'undefined') return Promise.resolve();
  return loadScriptOnce('./js/vendor/html2canvas.min.js');
}
