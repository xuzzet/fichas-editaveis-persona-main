// =============================================
// CONDIÇÕES UI
// Depende de: state.js, constants.js, calculations.js, ui.js
// =============================================

import { state } from './state.js';
import { CONDITIONS_LIST } from './constants.js';
import { recalcState, validateState } from './calculations.js';
import { render } from './ui.js';

// Rótulos de automação aplicada na ficha (movimento e rolagens de combate).
var COND_AUTO_BADGES = {
  congelado: ['÷2 movimento', 'Desv. AGI'],
  medo:      ['Desv. AGI'],
  atordoado: ['Desvantagem'],
  furia:     ['−5 acerto/esquiva']
};

var COND_CAT_LABELS = { Gerais: 'Condições Gerais', Status: 'Condições de Status' };

/** Separa a descrição em corpo principal, "Ampliado:" e "Como Aplicar:". */
function parseCondDesc(desc) {
  var out = { main: [], ampliado: '', apply: '' };
  String(desc || '').split('\n').forEach(function(ln) {
    var t = ln.trim();
    if (!t) return;
    if (/^Ampliado:/i.test(t)) out.ampliado = t.replace(/^Ampliado:\s*/i, '');
    else if (/^Como Aplicar:/i.test(t)) out.apply = t.replace(/^Como Aplicar:\s*/i, '');
    else out.main.push(t);
  });
  return out;
}

/** Monta o HTML de um card de condição (mesmo formato dos Feitos). */
function buildCondCard(c) {
  var parts = parseCondDesc(c.desc);
  var lines = parts.main.slice();
  if (parts.apply) lines.push('<span class="cond-tag">Como aplicar:</span> ' + parts.apply);
  if (parts.ampliado) lines.push('<span class="cond-tag">Ampliado:</span> ' + parts.ampliado);

  var auto = COND_AUTO_BADGES[c.id];
  var autoHtml = auto ? '<div class="cond-auto">Automatiza: ' + auto.join(' · ') + '</div>' : '';

  return '' +
    '<label class="cond-label">' +
      '<input type="checkbox" class="cond-check" data-id="' + c.id + '"/>' +
      '<span class="cond-name">' + c.name + '</span>' +
    '</label>' +
    '<div class="cond-desc-text">' + lines.join('<br>') + '</div>' +
    autoHtml;
}

export function buildConditionsUI() {
  var container = document.getElementById('conditions-list');
  if (!container) return;
  container.innerHTML = '';

  // Agrupa por categoria preservando a ordem de CONDITIONS_LIST.
  var cats = [];
  var byCat = {};
  CONDITIONS_LIST.forEach(function(c) {
    var cat = c.cat || 'Status';
    if (!byCat[cat]) { byCat[cat] = []; cats.push(cat); }
    byCat[cat].push(c);
  });

  cats.forEach(function(cat) {
    var group = document.createElement('div');
    group.className = 'cond-group cond-group--' + cat.toLowerCase();
    group.innerHTML = '<h3 class="cond-cat-title">' + (COND_CAT_LABELS[cat] || cat) + '</h3>';
    var grid = document.createElement('div');
    grid.className = 'cond-grid';
    byCat[cat].forEach(function(c) {
      var item = document.createElement('div');
      item.className = 'cond-item';
      item.dataset.condId = c.id;
      item.innerHTML = buildCondCard(c);
      grid.appendChild(item);
    });
    group.appendChild(grid);
    container.appendChild(group);
  });

  container.addEventListener('change', function(e) {
    if (e.target.classList.contains('cond-check')) {
      e.target.closest('.cond-item').classList.toggle('cond-active', e.target.checked);
      syncConditionsToState();
      recalcState();
      validateState();
      render();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    }
  });
}

export function syncConditionsToState() {
  var container = document.getElementById('conditions-list');
  if (!container) return;
  state.conditions = CONDITIONS_LIST.map(function(c) {
    var cb = container.querySelector('.cond-check[data-id="' + c.id + '"]');
    return { id: c.id, ativa: cb ? cb.checked : false };
  }).filter(function(c) { return c.ativa; });
}

export function renderConditions() {
  var container = document.getElementById('conditions-list');
  if (!container) return;
  container.querySelectorAll('.cond-check').forEach(function(cb) { cb.checked = false; });
  container.querySelectorAll('.cond-item').forEach(function(el) { el.classList.remove('cond-active'); });
  (state.conditions || []).forEach(function(saved) {
    var cb = container.querySelector('.cond-check[data-id="' + saved.id + '"]');
    if (cb && saved.ativa !== false) { cb.checked = true; cb.closest('.cond-item').classList.add('cond-active'); }
  });
}
