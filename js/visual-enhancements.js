// =============================================
// MELHORIAS VISUAIS (camada aditiva)
// Barras visuais de PV/PM que refletem Atual/Máximo. Apenas leitura
// dos campos existentes — não altera lógica, cálculos, regras nem a
// estrutura do estado. Sincroniza tanto com edições do usuário quanto
// com atualizações programáticas (carregar ficha, desfazer, recalc).
// =============================================

function pct(current, max) {
  var c = Number(current) || 0;
  var m = Number(max) || 0;
  if (m <= 0) return 0;
  return Math.max(0, Math.min(100, (c / m) * 100));
}

function makeBar(container) {
  if (!container) return null;
  var bar = document.createElement('div');
  bar.className = 'recurso-bar';
  var fill = document.createElement('div');
  fill.className = 'recurso-bar__fill';
  bar.appendChild(fill);
  container.appendChild(bar);
  return fill;
}

export function initVisualEnhancements() {
  var hpBlock = document.querySelector('.recurso-hp');
  var pmBlock = document.querySelector('.recurso-pm');
  var hpFill = makeBar(hpBlock);
  var pmFill = makeBar(pmBlock);
  if (!hpFill && !pmFill) return;

  var curHP = document.getElementById('CurrentHP');
  var maxHP = document.getElementById('MaxHP');
  var curPM = document.getElementById('CurrentPM');
  var maxPM = document.getElementById('EnergyMax');

  var last = { hp: -1, pm: -1, low: null };

  function update() {
    if (hpFill && curHP && maxHP) {
      var hp = pct(curHP.value, maxHP.value);
      var low = hp <= 30;
      if (hp !== last.hp || low !== last.low) {
        hpFill.style.width = hp + '%';
        hpFill.classList.toggle('is-low', low);
        last.hp = hp;
        last.low = low;
      }
    }
    if (pmFill && curPM && maxPM) {
      var pm = pct(curPM.value, maxPM.value);
      if (pm !== last.pm) {
        pmFill.style.width = pm + '%';
        last.pm = pm;
      }
    }
  }

  // Resposta imediata às edições do usuário.
  [curHP, maxHP, curPM, maxPM].forEach(function(el) {
    if (el) el.addEventListener('input', update);
  });

  // Captura atualizações programáticas (carregar/desfazer/recalcular),
  // que definem .value sem disparar eventos de input.
  setInterval(update, 200);
  update();
}
