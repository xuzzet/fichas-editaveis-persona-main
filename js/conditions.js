// =============================================
// CONDIÇÕES UI
// Depende de: state.js, constants.js, calculations.js, ui.js
// =============================================

import { state } from './state.js';
import { CONDITIONS_LIST } from './constants.js';
import { recalcState, validateState } from './calculations.js';
import { render } from './ui.js';

export function buildConditionsUI() {
  var container = document.getElementById('conditions-list');
  if (!container) return;
  container.innerHTML = '';

  CONDITIONS_LIST.forEach(function(c) {
    var item = document.createElement('div');
    item.className = 'cond-item';
    item.dataset.condId = c.id;
    item.innerHTML = '<label class="cond-label"><input type="checkbox" class="cond-check" data-id="' + c.id + '"/><span class="cond-name">' + c.name + '</span></label><div class="cond-desc-text">' + c.desc.replace(/\n/g, '<br>') + '</div>';
    container.appendChild(item);
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
