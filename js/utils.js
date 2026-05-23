// =============================================
// UTILITÁRIOS GENÉRICOS
// Sem dependências de projeto.
// =============================================

/** Seleciona o primeiro elemento matching o seletor. */
export function $(sel, ctx) { return (ctx || document).querySelector(sel); }

/** Seleciona todos os elementos matching o seletor. */
export function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

/** Garante que um inteiro fique dentro do intervalo [min, max]. */
export function clampInt(v, min, max) {
  var n = parseInt(v, 10);
  if (isNaN(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

/**
 * Cria uma versão com debounce da função fn.
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms) {
  var t;
  return function() {
    var args = arguments;
    var ctx  = this;
    clearTimeout(t);
    t = setTimeout(function() { fn.apply(ctx, args); }, ms);
  };
}
