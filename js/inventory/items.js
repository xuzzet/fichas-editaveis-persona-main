// =============================================
// INVENTARIO — ITENS E PESO
// =============================================

import { state } from '../state.js';
import { MOD_TARGETS, SOCIAL_IDS, SOCIAL_SKILL_META } from '../constants.js';

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

  var combatOpts = MOD_TARGETS.map(function(t) {
    return '<option value="' + t + '">' + t + '</option>';
  }).join('');
  var socialOpts = SOCIAL_IDS.map(function(id) {
    var nome = (SOCIAL_SKILL_META[id] && SOCIAL_SKILL_META[id].name) || id;
    return '<option value="' + id + '">' + nome + '</option>';
  }).join('');
  var bonusAlvoOpts =
    '<optgroup label="Combate">' + combatOpts + '</optgroup>' +
    '<optgroup label="Social">' + socialOpts + '</optgroup>';

  card.innerHTML =
    '<div class="eq-card-header">' +
      '<div class="eq-card-name-row">' +
        '<input class="eq-nome" placeholder="Nome do item"/>' +
        '<div class="eq-card-actions">' +
          '<button type="button" class="eq-move-btn">' + moveLabel + '</button>' +
          '<button type="button" class="mini del" title="Remover">✕</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="eq-card-stats">' +
      '<label class="eq-stat"><span class="eq-stat-label">Peso</span>' +
        '<input class="eq-peso" type="number" min="0" step="0.1" value="0"/></label>' +
      '<label class="eq-stat"><span class="eq-stat-label">Qtd</span>' +
        '<input class="eq-qtd" type="number" min="1" step="1" value="1"/></label>' +
      '<label class="eq-stat eq-stat-total"><span class="eq-stat-label">Total</span>' +
        '<span class="eq-total-display">0</span></label>' +
    '</div>' +
    '<div class="eq-card-desc">' +
      '<label class="eq-desc-label">Efeito / Notas</label>' +
      '<textarea class="eq-ef" rows="2" placeholder="Descreva o efeito ou anotações…"></textarea>' +
    '</div>' +
    '<div class="eq-bonus-wrap">' +
      '<button type="button" class="eq-bonus-toggle">' +
        '<span class="eq-bonus-toggle-label">Bônus automático</span>' +
        '<span class="eq-bonus-arrow">▾</span>' +
      '</button>' +
      '<div class="eq-bonus-body">' +
        '<label class="eq-bonus-active"><input type="checkbox" class="eq-bonus-ativo"/> Aplicar bônus à ficha</label>' +
        '<div class="eq-bonus-controls">' +
          '<select class="eq-bonus-alvo" title="Atributo ou Habilidade alvo">' + bonusAlvoOpts + '</select>' +
          '<select class="eq-bonus-tipo" title="Tipo de bônus">' +
            '<option value="flat">Fixo</option>' +
            '<option value="percentual">%</option>' +
          '</select>' +
          '<input class="eq-bonus-valor" type="number" step="1" value="0" title="Valor do bônus"/>' +
        '</div>' +
      '</div>' +
    '</div>';

  container.appendChild(card);

  card.querySelector('.eq-nome').value = data.nome || '';
  card.querySelector('.eq-peso').value = data.peso != null ? data.peso : 0;
  card.querySelector('.eq-qtd').value = data.qtd != null ? data.qtd : 1;
  card.querySelector('.eq-ef').value = data.efeito || '';
  card.querySelector('.eq-bonus-ativo').checked = !!data.bonusAtivo;
  var alvoSel = card.querySelector('.eq-bonus-alvo');
  if (data.bonusAlvo && Array.prototype.some.call(alvoSel.options, function(o) { return o.value === data.bonusAlvo; })) {
    alvoSel.value = data.bonusAlvo;
  }
  card.querySelector('.eq-bonus-tipo').value = data.bonusTipo === 'percentual' ? 'percentual' : 'flat';
  card.querySelector('.eq-bonus-valor').value = data.bonusValor != null ? data.bonusValor : 0;

  function updateTotal() {
    var w = Number(card.querySelector('.eq-peso').value) || 0;
    var q = Number(card.querySelector('.eq-qtd').value) || 1;
    card.querySelector('.eq-total-display').textContent = Math.round(w * q * 100) / 100;
  }
  updateTotal();

  // --- Seção de bônus recolhível (oculta por padrão) ---
  var bonusWrap    = card.querySelector('.eq-bonus-wrap');
  var bonusBody    = card.querySelector('.eq-bonus-body');
  var bonusToggle  = card.querySelector('.eq-bonus-toggle');
  var bonusArrow   = card.querySelector('.eq-bonus-arrow');
  var bonusLabelEl = card.querySelector('.eq-bonus-toggle-label');
  var bonusAtivoEl = card.querySelector('.eq-bonus-ativo');

  function updateBonusSummary() {
    var ativo = bonusAtivoEl.checked;
    var alvo  = card.querySelector('.eq-bonus-alvo').value;
    var tipo  = card.querySelector('.eq-bonus-tipo').value;
    var valor = Number(card.querySelector('.eq-bonus-valor').value) || 0;
    var alvoNome = (SOCIAL_SKILL_META[alvo] && SOCIAL_SKILL_META[alvo].name) || alvo;
    if (ativo && valor !== 0) {
      var sinal = valor > 0 ? '+' : '';
      var txt = (tipo === 'percentual')
        ? sinal + valor + '% ' + alvoNome
        : sinal + valor + ' ' + alvoNome;
      bonusLabelEl.textContent = 'Bônus: ' + txt;
      bonusWrap.classList.add('eq-bonus-wrap--active');
    } else {
      bonusLabelEl.textContent = 'Bônus automático';
      bonusWrap.classList.remove('eq-bonus-wrap--active');
    }
  }

  function setBonusOpen(open) {
    card.classList.toggle('eq-bonus-open', open);
    bonusBody.style.display = open ? '' : 'none';
    bonusArrow.textContent = open ? '▴' : '▾';
  }

  // Abre por padrão apenas quando já há bônus configurado.
  setBonusOpen(!!data.bonusAtivo || (Number(data.bonusValor) || 0) !== 0);
  updateBonusSummary();

  bonusToggle.addEventListener('click', function() {
    setBonusOpen(!card.classList.contains('eq-bonus-open'));
  });

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
      updateBonusSummary();
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
    (window.animateCardOut || function(el, cb){ el.remove(); cb(); })(card, function() {
      syncEquipToState();
      renderInventoryStatus();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    });
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

