// =============================================
// MODIFICADORES GLOBAIS UI
// Depende de: state.js, constants.js, calculations.js, ui.js
// =============================================

import { state } from './state.js';
import { MOD_TARGETS } from './constants.js';
import { recalcState, validateState } from './calculations.js';
import { render } from './ui.js';

// Referência interna ao construtor de linhas (setada por buildModifiersUI)
var _addModRow = null;

export function renderModSummary() {
  var summary = document.getElementById('mod-summary');
  if (!summary) return;
  var actives = (state.modifiers || []).filter(function(m) { return m.ativo && m.valor !== 0; });
  if (actives.length === 0) { summary.style.display = 'none'; return; }
  summary.style.display = 'block';
  var parts = actives.map(function(m) {
    var sign = m.valor >= 0 ? '+' : '';
    var suffix = m.tipo === 'percentual' ? '%' : '';
    return '<b>' + m.alvo + '</b> ' + sign + m.valor + suffix + ' (' + (m.nome || 'sem nome') + ')';
  });
  summary.innerHTML = '\u26A1 Ativos: ' + parts.join(' \u00B7 ');
}

export function buildModifiersUI() {
  var container = document.querySelector('#tbl-mod .mod-list');
  if (!container) return;
  var btn = document.getElementById('add-mod');

  function addModRow(data) {
    data = data || { nome: '', tipo: 'flat', valor: 0, alvo: 'STR', ativo: true };
    var isActive = data.ativo !== false;
    var card = document.createElement('div');
    card.className = 'mod-card' + (isActive ? ' mod-card--active' : ' mod-card--inactive');

    var alvoOpts = MOD_TARGETS.map(function(t) {
      return '<option value="' + t + '">' + t + '</option>';
    }).join('');

    card.innerHTML =
      '<div class="mod-card-top">' +
        '<input class="mod-nome" placeholder="Nome do modificador"/>' +
        '<div class="mod-card-right">' +
          '<label class="mod-toggle-label">' +
            '<input type="checkbox" class="mod-ativo"' + (isActive ? ' checked' : '') + '/>' +
            '<span class="mod-status-badge">' + (isActive ? 'Ativo' : 'Inativo') + '</span>' +
          '</label>' +
          '<button class="mini del">\u2715</button>' +
        '</div>' +
      '</div>' +
      '<div class="mod-card-fields">' +
        '<label class="mod-field">' +
          '<span class="mod-field-label">Alvo</span>' +
          '<select class="mod-alvo">' + alvoOpts + '</select>' +
        '</label>' +
        '<label class="mod-field">' +
          '<span class="mod-field-label">Tipo</span>' +
          '<select class="mod-tipo">' +
            '<option value="flat">Flat (+/-)</option>' +
            '<option value="percentual">Percentual (%)</option>' +
          '</select>' +
        '</label>' +
        '<label class="mod-field">' +
          '<span class="mod-field-label">Valor</span>' +
          '<input class="mod-valor" type="number" value="0"/>' +
        '</label>' +
      '</div>';

    container.appendChild(card);
    card.querySelector('.mod-nome').value = data.nome || '';
    card.querySelector('.mod-tipo').value = data.tipo || 'flat';
    card.querySelector('.mod-valor').value = data.valor || 0;
    card.querySelector('.mod-alvo').value = data.alvo || 'STR';
    card.querySelector('.mod-ativo').checked = data.ativo !== false;

    function updateCardState() {
      var active = card.querySelector('.mod-ativo').checked;
      var valNum = Number(card.querySelector('.mod-valor').value) || 0;
      card.className = 'mod-card' +
        (active ? ' mod-card--active' : ' mod-card--inactive') +
        (active && valNum > 0 ? ' mod-card--positive' : '') +
        (active && valNum < 0 ? ' mod-card--negative' : '');
      card.querySelector('.mod-status-badge').textContent = active ? 'Ativo' : 'Inativo';
    }
    updateCardState();

    function onChange() {
      updateCardState();
      syncModifiersToState();
      recalcState();
      validateState();
      render();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    }
    card.querySelector('.mod-nome').addEventListener('input', onChange);
    card.querySelector('.mod-tipo').addEventListener('change', onChange);
    card.querySelector('.mod-valor').addEventListener('input', onChange);
    card.querySelector('.mod-alvo').addEventListener('change', onChange);
    card.querySelector('.mod-ativo').addEventListener('change', onChange);
    card.querySelector('.del').addEventListener('click', function() { (window.animateCardOut || function(el, cb){ el.remove(); cb(); })(card, onChange); });
  }

  _addModRow = addModRow;
  if (btn) btn.addEventListener('click', function() { addModRow(); syncModifiersToState(); });
}

export function syncModifiersToState() {
  var container = document.querySelector('#tbl-mod .mod-list');
  if (!container) return;
  state.modifiers = Array.from(container.querySelectorAll('.mod-card')).map(function(card) {
    return {
      nome: card.querySelector('.mod-nome').value,
      tipo: card.querySelector('.mod-tipo').value,
      valor: Number(card.querySelector('.mod-valor').value) || 0,
      alvo: card.querySelector('.mod-alvo').value,
      ativo: !!card.querySelector('.mod-ativo').checked
    };
  });
  renderModSummary();
}

export function renderModifiers() {
  var container = document.querySelector('#tbl-mod .mod-list');
  if (!container) return;
  container.innerHTML = '';
  (state.modifiers || []).forEach(function(m) {
    if (_addModRow) _addModRow(m);
  });
  renderModSummary();
}
