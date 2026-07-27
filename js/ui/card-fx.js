// =============================================
// CARD FX — micro-interações dos cards
// Tilt 3D (ponteiro fino), saída animada ao remover sub-cards,
// pulso ao atualizar o Resumo Automático e toggle de densidade.
// Puramente visual: não altera dados, cálculos nem estrutura.
// Respeita prefers-reduced-motion.
// =============================================

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------------------------------------------------------------
// 1. SAÍDA ANIMADA — helper global usado pelos handlers de remoção
//    dos sub-cards (magias, vínculos, itens, modificadores).
//    Adiciona a classe .cp-leaving, aguarda a animação e então
//    remove o nó do DOM e executa o callback (sincronização).
// ---------------------------------------------------------------
function animateCardOut(el, done) {
  if (!el) {
    if (done) done();
    return;
  }
  if (el.__cpLeaving) return;
  el.__cpLeaving = true;

  var timer;
  function finish() {
    el.removeEventListener('animationend', finish);
    if (timer) clearTimeout(timer);
    if (el.parentNode) el.remove();
    if (done) done();
  }

  if (reduceMotion.matches) {
    finish();
    return;
  }
  el.classList.add('cp-leaving');
  el.addEventListener('animationend', finish);
  // Rede de segurança caso animationend não dispare.
  timer = setTimeout(finish, 340);
}
// Exposto cedo (no carregamento do módulo) para estar disponível
// antes de qualquer clique de remoção.
window.animateCardOut = animateCardOut;

// ---------------------------------------------------------------
// 2. TILT 3D — leve inclinação dos cards de seção seguindo o mouse.
//    Apenas em ponteiro fino e sem redução de movimento.
// ---------------------------------------------------------------
function initTilt() {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches || reduceMotion.matches) return;

  var MAX = 3.5; // graus máximos de rotação
  var current = null;
  var frame = 0;
  var lastX = 0;
  var lastY = 0;

  function apply() {
    frame = 0;
    if (!current) return;
    var r = current.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var px = (lastX - r.left) / r.width; // 0..1
    var py = (lastY - r.top) / r.height; // 0..1
    var ry = (px - 0.5) * (MAX * 2);
    var rx = (0.5 - py) * (MAX * 2);
    current.style.transform =
      'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' +
      ry.toFixed(2) + 'deg) translateY(-4px)';
  }

  document.addEventListener(
    'pointermove',
    function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (card !== current) {
        if (current) current.style.transform = '';
        current = card;
      }
      if (!current) return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    },
    { passive: true }
  );

  document.addEventListener('pointerout', function (e) {
    if (!current) return;
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (card === current && !current.contains(e.relatedTarget)) {
      current.style.transform = '';
      current = null;
    }
  });
}

// ---------------------------------------------------------------
// 3. PULSO DE ATUALIZAÇÃO — realça o card de Resumo Automático
//    sempre que seu conteúdo é recalculado.
// ---------------------------------------------------------------
function initSummaryPulse() {
  var card = document.getElementById('auto-summary-card');
  var content = document.getElementById('auto-summary-content');
  if (!card || !content || typeof MutationObserver === 'undefined') return;
  if (reduceMotion.matches) return;

  var t;
  var obs = new MutationObserver(function () {
    card.classList.remove('cp-updated');
    // Reinicia a animação.
    void card.offsetWidth;
    card.classList.add('cp-updated');
    clearTimeout(t);
    t = setTimeout(function () {
      card.classList.remove('cp-updated');
    }, 750);
  });
  obs.observe(content, { childList: true, subtree: true, characterData: true });
}

// ---------------------------------------------------------------
// 4. DENSIDADE COMPACTA — toggle persistido em Configurações.
// ---------------------------------------------------------------
var DENSITY_KEY = 'ficha-compact-cards';

function initDensity() {
  var cb = document.getElementById('compactCards');
  var on = false;
  try {
    on = localStorage.getItem(DENSITY_KEY) === 'on';
  } catch (e) {}
  document.body.classList.toggle('compact-cards', on);
  if (cb) {
    cb.checked = on;
    cb.addEventListener('change', function () {
      document.body.classList.toggle('compact-cards', cb.checked);
      try {
        localStorage.setItem(DENSITY_KEY, cb.checked ? 'on' : 'off');
      } catch (e) {}
    });
  }
}

export function initCardFx() {
  try { initTilt(); } catch (e) { console.error('[card-fx] tilt:', e); }
  try { initSummaryPulse(); } catch (e) { console.error('[card-fx] pulse:', e); }
  try { initDensity(); } catch (e) { console.error('[card-fx] density:', e); }
}
