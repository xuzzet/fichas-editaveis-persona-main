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
  var body = document.querySelector('#tbl-mod tbody');
  if (!body) return;
  var btn = document.getElementById('add-mod');

  function addModRow(data) {
    data = data || { nome: '', tipo: 'flat', valor: 0, alvo: 'STR', ativo: true };
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><input class="mod-nome" placeholder="Nome do modificador"/></td>' +
      '<td><select class="mod-tipo"><option value="flat">Flat (+/-)</option><option value="percentual">Percentual (%)</option></select></td>' +
      '<td><input class="mod-valor" type="number" value="0" style="width:80px;"/></td>' +
      '<td><select class="mod-alvo"></select></td>' +
      '<td style="text-align:center"><input type="checkbox" class="mod-ativo" checked/></td>' +
      '<td class="row-actions"><button class="mini del">Remover</button></td>';
    body.appendChild(tr);
    var alvoSel = tr.querySelector('.mod-alvo');
    MOD_TARGETS.forEach(function(t) { var o = document.createElement('option'); o.value = t; o.textContent = t; alvoSel.appendChild(o); });
    tr.querySelector('.mod-nome').value = data.nome || '';
    tr.querySelector('.mod-tipo').value = data.tipo || 'flat';
    tr.querySelector('.mod-valor').value = data.valor || 0;
    alvoSel.value = data.alvo || 'STR';
    tr.querySelector('.mod-ativo').checked = data.ativo !== false;

    function onChange() {
      syncModifiersToState();
      recalcState();
      validateState();
      render();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    }
    tr.querySelector('.mod-nome').addEventListener('input', onChange);
    tr.querySelector('.mod-tipo').addEventListener('change', onChange);
    tr.querySelector('.mod-valor').addEventListener('input', onChange);
    alvoSel.addEventListener('change', onChange);
    tr.querySelector('.mod-ativo').addEventListener('change', onChange);
    tr.querySelector('.del').addEventListener('click', function() { tr.remove(); onChange(); });
  }

  _addModRow = addModRow;
  if (btn) btn.addEventListener('click', function() { addModRow(); syncModifiersToState(); });
}

export function syncModifiersToState() {
  var body = document.querySelector('#tbl-mod tbody');
  if (!body) return;
  state.modifiers = Array.from(body.querySelectorAll('tr')).map(function(tr) {
    return {
      nome: tr.querySelector('.mod-nome').value,
      tipo: tr.querySelector('.mod-tipo').value,
      valor: Number(tr.querySelector('.mod-valor').value) || 0,
      alvo: tr.querySelector('.mod-alvo').value,
      ativo: !!tr.querySelector('.mod-ativo').checked
    };
  });
  renderModSummary();
}

export function renderModifiers() {
  var body = document.querySelector('#tbl-mod tbody');
  if (!body) return;
  body.innerHTML = '';
  (state.modifiers || []).forEach(function(m) {
    if (_addModRow) _addModRow(m);
  });
  renderModSummary();
}
