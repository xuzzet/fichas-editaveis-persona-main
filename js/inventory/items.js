// =============================================
// INVENTARIO — ITENS E PESO
// =============================================

import { state } from '../state.js';
import { MOD_TARGETS } from '../constants.js';

export var eqBodyEquipado = document.querySelector('#tbl-eq-equipado');
export var eqBodyMochila  = document.querySelector('#tbl-eq-mochila');

// =============================================
// SISTEMA DE PESO DO INVENTÁRIO
// =============================================

/**
 * Calcula capacidade de carga: (STR × 5) + VIT
 */
export function calcInventoryCapacity() {
  var comp = state._computed;
  if (!comp) return 0;
  var str = comp.modded ? comp.modded.STR : (state.CharSTR || 1);
  var vit = comp.modded ? comp.modded.VIT : (state.CharVIT || 1);
  return (str * 5) + vit;
}

/**
 * Calcula o peso total dos itens do inventário.
 */
export function calcInventoryWeight() {
  var total = 0;
  (state.equip || []).forEach(function(item) {
    total += (Number(item.peso) || 0) * (Number(item.qtd) || 1);
  });
  return Math.round(total * 100) / 100;
}

/**
 * Renderiza a barra de capacidade e o status de carga.
 */
export function renderInventoryStatus() {
  var cap = calcInventoryCapacity();
  var weight = calcInventoryWeight();
  var pct = cap > 0 ? Math.min((weight / cap) * 100, 100) : (weight > 0 ? 100 : 0);

  var fill = document.getElementById('inv-capacity-fill');
  var weightText = document.getElementById('inv-weight-text');
  var statusText = document.getElementById('inv-status-text');
  if (!fill || !weightText || !statusText) return;

  fill.style.width = pct + '%';
  weightText.textContent = 'Peso: ' + weight + ' / ' + cap;

  // Determinar estado
  fill.classList.remove('inv-normal', 'inv-pesado', 'inv-sobrecarregado');
  statusText.classList.remove('inv-normal', 'inv-pesado', 'inv-sobrecarregado');

  if (weight > cap) {
    fill.classList.add('inv-sobrecarregado');
    statusText.classList.add('inv-sobrecarregado');
    statusText.textContent = '▲ Sobrecarregado';
    fill.style.width = '100%';
  } else if (weight >= cap * 0.8) {
    fill.classList.add('inv-pesado');
    statusText.classList.add('inv-pesado');
    statusText.textContent = 'Pesado';
  } else {
    fill.classList.add('inv-normal');
    statusText.classList.add('inv-normal');
    statusText.textContent = 'Normal';
  }
}

// =============================================
// ITENS DO INVENTÁRIO
// =============================================

/**
 * Migra item do formato antigo (tipo/nome/efeito) para o novo (nome/peso/qtd/efeito/local).
 */
export function migrateEquipItem(item) {
  if (item.local) return item; // Já no formato novo
  var local = 'mochila';
  if (item.tipo && item.tipo !== 'Item') local = 'equipado';
  return {
    nome: item.nome || '',
    peso: item.peso != null ? item.peso : 0,
    qtd: item.qtd != null ? item.qtd : 1,
    efeito: item.efeito || '',
    local: local,
    bonusAtivo: !!item.bonusAtivo,
    bonusAlvo: item.bonusAlvo || '',
    bonusTipo: item.bonusTipo || 'flat',
    bonusValor: item.bonusValor != null ? item.bonusValor : 0
  };
}

/**
 * Adiciona um item ao inventário como card visual.
 */
export function addInventoryItem(data, targetLocal) {
  data = data || {};
  var local = data.local || targetLocal || 'mochila';
  var container = (local === 'equipado') ? eqBodyEquipado : eqBodyMochila;
  if (!container) return;

  var card = document.createElement('div');
  card.className = 'eq-card';
  card.dataset.local = local;
  var moveLabel = (local === 'equipado') ? '↓ Mochila' : '↑ Equipar';

  var bonusAlvoOpts = MOD_TARGETS.map(function(t) {
    return '<option value="' + t + '">' + t + '</option>';
  }).join('');

  card.innerHTML =
    '<div class="eq-card-name-row">' +
      '<input class="eq-nome" placeholder="Nome do item"/>' +
      '<div class="eq-card-actions">' +
        '<button class="eq-move-btn">' + moveLabel + '</button>' +
        '<button class="mini del">✕</button>' +
      '</div>' +
    '</div>' +
    '<div class="eq-card-stats-row">' +
      '<label class="eq-stat"><span class="eq-stat-label">Peso</span>' +
        '<input class="eq-peso" type="number" min="0" step="0.1" value="0"/></label>' +
      '<label class="eq-stat"><span class="eq-stat-label">Qtd</span>' +
        '<input class="eq-qtd" type="number" min="1" step="1" value="1"/></label>' +
      '<span class="eq-total-display">= 0</span>' +
    '</div>' +
    '<textarea class="eq-ef" rows="2" placeholder="Efeito / Notas (opcional)"></textarea>' +
    '<div class="eq-bonus-row">' +
      '<label class="eq-bonus-toggle"><input type="checkbox" class="eq-bonus-ativo"/> Bônus automático</label>' +
      '<select class="eq-bonus-alvo">' + bonusAlvoOpts + '</select>' +
      '<select class="eq-bonus-tipo">' +
        '<option value="flat">Fixo</option>' +
        '<option value="percentual">%</option>' +
      '</select>' +
      '<input class="eq-bonus-valor" type="number" step="1" value="0" title="Valor do bônus"/>' +
    '</div>';

  container.appendChild(card);

  card.querySelector('.eq-nome').value = data.nome || '';
  card.querySelector('.eq-peso').value = data.peso != null ? data.peso : 0;
  card.querySelector('.eq-qtd').value = data.qtd != null ? data.qtd : 1;
  card.querySelector('.eq-ef').value = data.efeito || '';
  card.querySelector('.eq-bonus-ativo').checked = !!data.bonusAtivo;
  if (data.bonusAlvo && MOD_TARGETS.indexOf(data.bonusAlvo) >= 0) card.querySelector('.eq-bonus-alvo').value = data.bonusAlvo;
  card.querySelector('.eq-bonus-tipo').value = data.bonusTipo === 'percentual' ? 'percentual' : 'flat';
  card.querySelector('.eq-bonus-valor').value = data.bonusValor != null ? data.bonusValor : 0;

  function updateTotal() {
    var w = Number(card.querySelector('.eq-peso').value) || 0;
    var q = Number(card.querySelector('.eq-qtd').value) || 1;
    card.querySelector('.eq-total-display').textContent = '= ' + Math.round(w * q * 100) / 100;
  }
  updateTotal();

  card.querySelector('.eq-peso').addEventListener('input', function() { updateTotal(); syncEquipToState(); renderInventoryStatus(); });
  card.querySelector('.eq-qtd').addEventListener('input', function() { updateTotal(); syncEquipToState(); renderInventoryStatus(); });
  card.querySelector('.eq-nome').addEventListener('input', function() { syncEquipToState(); });
  card.querySelector('.eq-ef').addEventListener('input', function() { syncEquipToState(); });
  // Bônus de equipamento: alteração recalcula atributos finais (via window.recalcAndRender)
  ['.eq-bonus-ativo', '.eq-bonus-alvo', '.eq-bonus-tipo', '.eq-bonus-valor'].forEach(function(sel) {
    var el = card.querySelector(sel);
    if (!el) return;
    var evt = (el.type === 'checkbox') ? 'change' : 'input';
    el.addEventListener(evt, function() {
      syncEquipToState();
      if (window.recalcAndRender) window.recalcAndRender();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    });
  });

  card.querySelector('.eq-move-btn').addEventListener('click', function() {
    syncEquipToState();
    var idx = getItemIndexFromRow(card, local);
    if (idx === -1) return;
    var item = state.equip[idx];
    item.local = (local === 'equipado') ? 'mochila' : 'equipado';
    card.remove();
    addInventoryItem(item, item.local);
    syncEquipToState();
    renderInventoryStatus();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });

  card.querySelector('.del').addEventListener('click', function() {
    card.remove();
    syncEquipToState();
    renderInventoryStatus();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
}

/**
 * Encontra o índice no state.equip de um card de item.
 */
export function getItemIndexFromRow(card, local) {
  var container = (local === 'equipado') ? eqBodyEquipado : eqBodyMochila;
  if (!container) return -1;
  var cards = Array.from(container.querySelectorAll('.eq-card'));
  var cardIdx = cards.indexOf(card);
  if (cardIdx === -1) return -1;
  var count = 0;
  for (var i = 0; i < state.equip.length; i++) {
    if ((state.equip[i].local || 'mochila') === local) {
      if (count === cardIdx) return i;
      count++;
    }
  }
  return -1;
}

export function syncEquipToState() {
  var items = [];
  function readCard(card, loc) {
    return {
      nome: card.querySelector('.eq-nome').value,
      peso: Number(card.querySelector('.eq-peso').value) || 0,
      qtd: Number(card.querySelector('.eq-qtd').value) || 1,
      efeito: card.querySelector('.eq-ef').value,
      local: loc,
      bonusAtivo: !!(card.querySelector('.eq-bonus-ativo') || {}).checked,
      bonusAlvo: (card.querySelector('.eq-bonus-alvo') || {}).value || '',
      bonusTipo: (card.querySelector('.eq-bonus-tipo') || {}).value || 'flat',
      bonusValor: Number((card.querySelector('.eq-bonus-valor') || {}).value) || 0
    };
  }
  if (eqBodyEquipado) {
    Array.from(eqBodyEquipado.querySelectorAll('.eq-card')).forEach(function(card) {
      items.push(readCard(card, 'equipado'));
    });
  }
  if (eqBodyMochila) {
    Array.from(eqBodyMochila.querySelectorAll('.eq-card')).forEach(function(card) {
      items.push(readCard(card, 'mochila'));
    });
  }
  state.equip = items;
}

