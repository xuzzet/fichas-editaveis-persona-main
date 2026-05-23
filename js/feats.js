// =============================================
// FEITOS (Façanhas) UI
// Depende de: state.js, constants.js, calculations.js, ui.js
// =============================================

import { state } from './state.js';
import { FEITOS_LIST } from './constants.js';
import { recalcState, validateState } from './calculations.js';
import { render } from './ui.js';

export function buildFeitosUI() {
  var container = document.getElementById('feitos-list');
  if (!container) return;
  container.innerHTML = '';

  var categories = [];
  var catMap = {};
  FEITOS_LIST.forEach(function(f) {
    var c = f.cat || 'Outros';
    if (!catMap[c]) { catMap[c] = []; categories.push(c); }
    catMap[c].push(f);
  });

  categories.forEach(function(cat) {
    var group = document.createElement('div');
    group.className = 'feat-group';
    group.innerHTML = '<h3 class="feat-cat-title">' + cat + '</h3>';
    var grid = document.createElement('div');
    grid.className = 'feat-grid';
    catMap[cat].forEach(function(f) {
      var item = document.createElement('div');
      item.className = 'feat-item';
      item.dataset.featId = f.id;
      var prereqHtml = f.prereq ? '<div class="feat-prereq">Pré-requisito: ' + f.prereq + '</div>' : '';
      item.innerHTML = '<label class="feat-label"><input type="checkbox" class="feat-check" data-id="' + f.id + '"/><span class="feat-name">' + f.name + '</span></label><div class="feat-desc-text">' + f.desc.replace(/\n/g, '<br>') + '</div>' + prereqHtml;
      grid.appendChild(item);
    });
    group.appendChild(grid);
    container.appendChild(group);
  });

  container.addEventListener('change', function(e) {
    if (e.target.classList.contains('feat-check')) {
      e.target.closest('.feat-item').classList.toggle('feat-active', e.target.checked);
      syncFeitosToState();
      recalcState();
      validateState();
      render();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    }
  });
}

export function syncFeitosToState() {
  var container = document.getElementById('feitos-list');
  if (!container) return;
  state.feitos = FEITOS_LIST.map(function(f) {
    var cb = container.querySelector('.feat-check[data-id="' + f.id + '"]');
    return { id: f.id, ativo: cb ? cb.checked : false };
  }).filter(function(f) { return f.ativo; });
}

export function renderFeitos() {
  var container = document.getElementById('feitos-list');
  if (!container) return;
  container.querySelectorAll('.feat-check').forEach(function(cb) { cb.checked = false; });
  container.querySelectorAll('.feat-item').forEach(function(el) { el.classList.remove('feat-active'); });
  (state.feitos || []).forEach(function(f) {
    var cb = container.querySelector('.feat-check[data-id="' + f.id + '"]');
    var isActive = f.ativo !== undefined ? f.ativo : f.selected;
    if (cb && isActive !== false) { cb.checked = true; cb.closest('.feat-item').classList.add('feat-active'); }
  });
}
