// =============================================
// INVENTÁRIO E TABELAS DINÂMICAS
// Depende de: state.js, constants.js, utils.js
// =============================================

import { state } from './state.js';
import { ARCANAS } from './constants.js';
import { clampInt } from './utils.js';

// =============================================
// REFERÊNCIAS AOS TBODIES DAS TABELAS
// =============================================

export var eqBodyEquipado = document.querySelector('#tbl-eq-equipado');
export var eqBodyMochila  = document.querySelector('#tbl-eq-mochila');
export var spellBody      = document.querySelector('#spell-grid');
export var linkBody       = document.getElementById('tbl-link');
export var clueBody       = document.querySelector('#tbl-clue');
export var cttBody        = document.querySelector('#tbl-ctt');

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
    statusText.textContent = '⚠ Sobrecarregado';
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
    local: local
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
    '<textarea class="eq-ef" rows="2" placeholder="Efeito / Notas (opcional)"></textarea>';

  container.appendChild(card);

  card.querySelector('.eq-nome').value = data.nome || '';
  card.querySelector('.eq-peso').value = data.peso != null ? data.peso : 0;
  card.querySelector('.eq-qtd').value = data.qtd != null ? data.qtd : 1;
  card.querySelector('.eq-ef').value = data.efeito || '';

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
  if (eqBodyEquipado) {
    Array.from(eqBodyEquipado.querySelectorAll('.eq-card')).forEach(function(card) {
      items.push({
        nome: card.querySelector('.eq-nome').value,
        peso: Number(card.querySelector('.eq-peso').value) || 0,
        qtd: Number(card.querySelector('.eq-qtd').value) || 1,
        efeito: card.querySelector('.eq-ef').value,
        local: 'equipado'
      });
    });
  }
  if (eqBodyMochila) {
    Array.from(eqBodyMochila.querySelectorAll('.eq-card')).forEach(function(card) {
      items.push({
        nome: card.querySelector('.eq-nome').value,
        peso: Number(card.querySelector('.eq-peso').value) || 0,
        qtd: Number(card.querySelector('.eq-qtd').value) || 1,
        efeito: card.querySelector('.eq-ef').value,
        local: 'mochila'
      });
    });
  }
  state.equip = items;
}

// =============================================
// MAGIAS — HELPERS INTERNOS
// =============================================

var SPELL_CATEGORIES = [
  '', 'Magia Ofensiva', 'Magia de Cura', 'Magia de Suporte',
  'Magia de Status', 'Técnica Física', 'Técnica Especial', 'Passiva'
];

var SPELL_ELEMENTS = [
  'Físico','Fogo','Gelo','Vento','Raio','Nuclear','PSY','Luz','Trevas','Suporte','Controle'
];

function _updateSpellCount() {
  var countEl = document.getElementById('spell-count');
  if (!countEl || !spellBody) return;
  var all = spellBody.querySelectorAll('.spell-card');
  var visible = Array.from(all).filter(function(c) { return c.style.display !== 'none'; });
  var t = all.length;
  countEl.textContent = t === 0 ? '' :
    (visible.length < t ? visible.length + ' / ' + t : t) + ' magia' + (t !== 1 ? 's' : '');
}

function _updateSpellEmpty() {
  var emptyEl = document.getElementById('spell-empty');
  if (!emptyEl || !spellBody) return;
  emptyEl.style.display = spellBody.querySelectorAll('.spell-card').length === 0 ? '' : 'none';
}

// =============================================
// MAGIAS
// =============================================

export function moveSpellRow(el, direction) {
  if (!el || !spellBody) return;
  var cards = Array.from(spellBody.querySelectorAll('.spell-card'));
  var idx = cards.indexOf(el);
  if (idx === -1) return;
  if (direction === 'up' && idx > 0) spellBody.insertBefore(el, cards[idx - 1]);
  else if (direction === 'down' && idx < cards.length - 1) spellBody.insertBefore(el, cards[idx + 2]);
  syncSpellsToState();
}

export function addSpell(data) {
  data = data || {};
  if (!spellBody) return;

  var card = document.createElement('div');
  card.className = 'spell-card';

  // Build static HTML (no user-data interpolation — values set via .value below)
  var catOpts = SPELL_CATEGORIES.map(function(c) {
    return '<option value="' + c + '">' + (c || '— Categoria —') + '</option>';
  }).join('');
  var elOpts = SPELL_ELEMENTS.map(function(e) {
    return '<option value="' + e + '">' + e + '</option>';
  }).join('');

  card.innerHTML =
    '<div class="spell-card-header">' +
      '<div class="spell-card-name-row">' +
        '<input class="sp-n spell-name-input" placeholder="Nome da Magia / Técnica">' +
        '<div class="spell-card-actions">' +
          '<button type="button" class="mini up" title="Mover para cima">↑</button>' +
          '<button type="button" class="mini down" title="Mover para baixo">↓</button>' +
          '<button type="button" class="mini del" title="Remover">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="spell-card-badges">' +
        '<select class="sp-cat spell-cat-select">' + catOpts + '</select>' +
        '<select class="sp-t spell-el-select">' + elOpts + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="spell-card-stats">' +
      '<label class="spell-stat"><span class="spell-stat-label">PM</span>' +
        '<input class="sp-uses spell-stat-input" placeholder="—"></label>' +
      '<label class="spell-stat"><span class="spell-stat-label">Ação</span>' +
        '<input class="sp-acao spell-stat-input" placeholder="—"></label>' +
      '<label class="spell-stat"><span class="spell-stat-label">Alcance</span>' +
        '<input class="sp-alcance spell-stat-input" placeholder="—"></label>' +
      '<label class="spell-stat"><span class="spell-stat-label">Alvo</span>' +
        '<input class="sp-c spell-stat-input" placeholder="—"></label>' +
      '<label class="spell-stat"><span class="spell-stat-label">Duração</span>' +
        '<input class="sp-duracao spell-stat-input" placeholder="—"></label>' +
      '<label class="spell-stat"><span class="spell-stat-label">Nível</span>' +
        '<input class="sp-tier spell-stat-input" placeholder="—"></label>' +
    '</div>' +
    '<div class="spell-card-desc">' +
      '<label class="spell-desc-label">Efeito / Descrição</label>' +
      '<textarea class="sp-e spell-desc-textarea" rows="2" placeholder="Descreva o efeito…"></textarea>' +
    '</div>' +
    '<div class="spell-card-obs-wrap">' +
      '<button type="button" class="spell-obs-toggle">Observações <span class="spell-obs-arrow">▾</span></button>' +
      '<textarea class="sp-obs spell-obs-textarea" rows="1" placeholder="Notas adicionais…"></textarea>' +
    '</div>';

  // Set values safely (avoids XSS from interpolating data into innerHTML)
  card.querySelector('.sp-n').value          = data.nome    || '';
  card.querySelector('.sp-t').value          = data.tipo    || 'Físico';
  card.querySelector('.sp-cat').value        = data.cat     || '';
  card.querySelector('.sp-uses').value       = data.uses    || '';
  card.querySelector('.sp-acao').value       = data.acao    || '';
  card.querySelector('.sp-alcance').value    = data.alcance || '';
  card.querySelector('.sp-c').value          = data.custo   || '';
  card.querySelector('.sp-duracao').value    = data.duracao || '';
  card.querySelector('.sp-tier').value       = data.tier    || '';
  card.querySelector('.sp-e').value          = data.efeito  || '';
  card.querySelector('.sp-obs').value        = data.obs     || '';

  // Sync element badge colour via data attribute
  function _refreshEl() { card.dataset.element = card.querySelector('.sp-t').value; }
  card.querySelector('.sp-t').addEventListener('change', _refreshEl);
  _refreshEl();

  spellBody.appendChild(card);

  // Obs toggle (hidden by default unless obs already has content)
  var obsWrap   = card.querySelector('.spell-obs-wrap');
  var obsTA     = card.querySelector('.sp-obs');
  var obsArrow  = card.querySelector('.spell-obs-arrow');
  if (!data.obs) {
    obsTA.style.display = 'none';
  } else {
    card.classList.add('spell-obs-open');
    obsArrow.textContent = '▴';
  }
  card.querySelector('.spell-obs-toggle').addEventListener('click', function() {
    var open = card.classList.toggle('spell-obs-open');
    obsTA.style.display  = open ? '' : 'none';
    obsArrow.textContent = open ? '▴' : '▾';
  });

  // Sync state on any field change
  card.addEventListener('input',  syncSpellsToState);
  card.addEventListener('change', syncSpellsToState);

  // Remove
  card.querySelector('.del').addEventListener('click', function() {
    card.remove();
    syncSpellsToState();
    _updateSpellCount();
    _updateSpellEmpty();
  });

  // Reorder
  card.querySelector('.up').addEventListener('click',   function() { moveSpellRow(card, 'up'); });
  card.querySelector('.down').addEventListener('click', function() { moveSpellRow(card, 'down'); });

  _updateSpellCount();
  _updateSpellEmpty();
}

export function syncSpellsToState() {
  state.spells = spellBody ? Array.from(spellBody.querySelectorAll('.spell-card')).map(function(card) {
    return {
      nome:    (card.querySelector('.sp-n')       || {}).value || '',
      tipo:    (card.querySelector('.sp-t')       || {}).value || 'Físico',
      cat:     (card.querySelector('.sp-cat')     || {}).value || '',
      custo:   (card.querySelector('.sp-c')       || {}).value || '',
      efeito:  (card.querySelector('.sp-e')       || {}).value || '',
      tier:    (card.querySelector('.sp-tier')    || {}).value || '',
      uses:    (card.querySelector('.sp-uses')    || {}).value || '',
      acao:    (card.querySelector('.sp-acao')    || {}).value || '',
      alcance: (card.querySelector('.sp-alcance') || {}).value || '',
      duracao: (card.querySelector('.sp-duracao') || {}).value || '',
      obs:     (card.querySelector('.sp-obs')     || {}).value || ''
    };
  }) : [];
}

export function initSpellFilters() {
  var searchEl  = document.getElementById('spell-search');
  var catEl     = document.getElementById('spell-filter-cat');
  var elEl      = document.getElementById('spell-filter-el');
  var clearBtn  = document.getElementById('spell-filter-clear');

  function applyFilters() {
    if (!spellBody) return;
    var q   = searchEl ? searchEl.value.trim().toLowerCase() : '';
    var cat = catEl    ? catEl.value : '';
    var el  = elEl     ? elEl.value  : '';
    Array.from(spellBody.querySelectorAll('.spell-card')).forEach(function(card) {
      var name    = ((card.querySelector('.sp-n')   || {}).value || '').toLowerCase();
      var cardCat = (card.querySelector('.sp-cat')  || {}).value || '';
      var cardEl  = (card.querySelector('.sp-t')    || {}).value || '';
      var show = (!q || name.includes(q)) &&
                 (!cat || cardCat === cat) &&
                 (!el  || cardEl  === el);
      card.style.display = show ? '' : 'none';
    });
    _updateSpellCount();
  }

  if (searchEl) searchEl.addEventListener('input',  applyFilters);
  if (catEl)    catEl.addEventListener('change',    applyFilters);
  if (elEl)     elEl.addEventListener('change',     applyFilters);
  if (clearBtn) clearBtn.addEventListener('click', function() {
    if (searchEl) searchEl.value = '';
    if (catEl)    catEl.value    = '';
    if (elEl)     elEl.value     = '';
    applyFilters();
  });
}

// =============================================
// VÍNCULOS
// =============================================

var LINK_STATUS_CLASSES = {
  'Ativo':     'link--ativo',
  'Pausado':   'link--pausado',
  'Conclu\u00eddo': 'link--concluido',
  'Bloqueado': 'link--bloqueado',
  'Rompido':   'link--rompido'
};

export function renderLinkSummary() {
  var cards = linkBody ? Array.from(linkBody.querySelectorAll('.link-card')) : [];
  var totalEl  = document.getElementById('lsumm-total');
  var activeEl = document.getElementById('lsumm-active');
  var rankEl   = document.getElementById('lsumm-maxrank');
  var arcEl    = document.getElementById('lsumm-arcanas');

  var maxRank = 0;
  var active  = 0;
  var arcanaSet = {};
  cards.forEach(function(c) {
    var r = clampInt((c.querySelector('.lk-r') || {}).value || 1, 1, 10);
    if (r > maxRank) maxRank = r;
    if ((c.querySelector('.lk-s') || {}).value === 'Ativo') active++;
    var arc = (c.querySelector('.lk-a') || {}).value;
    if (arc) arcanaSet[arc] = true;
  });

  if (totalEl)  totalEl.textContent  = cards.length;
  if (activeEl) activeEl.textContent = active;
  if (rankEl)   rankEl.textContent   = cards.length > 0 ? maxRank : '\u2014';
  if (arcEl) {
    var arcList = Object.keys(arcanaSet);
    if (arcList.length === 0) {
      arcEl.textContent = '\u2014';
    } else {
      arcEl.innerHTML = '';
      arcList.forEach(function(a) {
        var chip = document.createElement('span');
        chip.className = 'link-arcana-chip';
        chip.textContent = a.replace(/^[IVXLC\d]+ - /, '');
        arcEl.appendChild(chip);
      });
    }
  }
}

function _buildRankPips(rank) {
  var html = '<div class="link-rank-pips">';
  for (var i = 1; i <= 10; i++) {
    html += '<span class="link-pip' + (i <= rank ? ' link-pip--filled' : '') + '"></span>';
  }
  return html + '</div>';
}

function applyLinkFilters() {
  if (!linkBody) return;
  var searchEl = document.getElementById('link-search');
  var arcanaEl = document.getElementById('link-filter-arcana');
  var statusEl = document.getElementById('link-filter-status');
  var sortEl   = document.getElementById('link-sort');

  var q      = searchEl ? searchEl.value.trim().toLowerCase() : '';
  var arcana = arcanaEl ? arcanaEl.value : '';
  var status = statusEl ? statusEl.value : '';
  var sort   = sortEl   ? sortEl.value   : 'none';

  var cards = Array.from(linkBody.querySelectorAll('.link-card'));
  cards.forEach(function(card) {
    var nome   = (card.querySelector('.lk-n') || {}).value || '';
    var cArc   = (card.querySelector('.lk-a') || {}).value || '';
    var cSt    = (card.querySelector('.lk-s') || {}).value || '';
    var show   = (!q      || nome.toLowerCase().includes(q)) &&
                 (!arcana || cArc === arcana) &&
                 (!status || cSt  === status);
    card.style.display = show ? '' : 'none';
  });

  if (sort !== 'none') {
    var vis = cards.filter(function(c) { return c.style.display !== 'none'; });
    vis.sort(function(a, b) {
      var ra = clampInt((a.querySelector('.lk-r') || {}).value || 1, 1, 10);
      var rb = clampInt((b.querySelector('.lk-r') || {}).value || 1, 1, 10);
      var na = (a.querySelector('.lk-n') || {}).value || '';
      var nb = (b.querySelector('.lk-n') || {}).value || '';
      if (sort === 'rank-desc') return rb - ra;
      if (sort === 'rank-asc')  return ra - rb;
      return na.localeCompare(nb);
    });
    vis.forEach(function(c) { linkBody.appendChild(c); });
  }
}

export function initLinkFilters() {
  var arcanaEl = document.getElementById('link-filter-arcana');
  if (arcanaEl) {
    ARCANAS.filter(function(a) { return a; }).forEach(function(a) {
      var opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      arcanaEl.appendChild(opt);
    });
  }
  var searchEl = document.getElementById('link-search');
  var statusEl = document.getElementById('link-filter-status');
  var sortEl   = document.getElementById('link-sort');
  if (searchEl) searchEl.addEventListener('input',  applyLinkFilters);
  if (arcanaEl) arcanaEl.addEventListener('change', applyLinkFilters);
  if (statusEl) statusEl.addEventListener('change', applyLinkFilters);
  if (sortEl)   sortEl.addEventListener('change',   applyLinkFilters);
}

export function addLink(data) {
  data = data || {};
  if (!linkBody) return;
  var rank       = clampInt(data.rank || 1, 1, 10);
  var status     = data.status || 'Ativo';
  var statusCls  = LINK_STATUS_CLASSES[status] || 'link--ativo';

  var card = document.createElement('div');
  card.className = 'link-card ' + statusCls;

  var arcanaOpts = ARCANAS.map(function(a) {
    return '<option value="' + a + '">' + (a || '\u2014 Arcana \u2014') + '</option>';
  }).join('');
  var statusOpts = Object.keys(LINK_STATUS_CLASSES).map(function(s) {
    return '<option value="' + s + '">' + s + '</option>';
  }).join('');

  card.innerHTML =
    '<div class="link-card-header">' +
      _buildRankPips(rank) +
      '<div class="link-card-header-main">' +
        '<input class="lk-n link-name-input" placeholder="Nome do V\u00ednculo"/>' +
        '<div class="link-card-header-right">' +
          '<select class="lk-s link-status-select">' + statusOpts + '</select>' +
          '<button class="mini del">\u2715</button>' +
        '</div>' +
      '</div>' +
      '<div class="link-card-arcana-row">' +
        '<span class="link-arcana-label">Arcana</span>' +
        '<select class="lk-a link-arcana-select">' + arcanaOpts + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="link-card-body">' +
      '<div class="link-card-fields-row">' +
        '<label class="link-field">' +
          '<span class="link-field-label">Rank</span>' +
          '<input class="lk-r link-rank-input" type="number" min="1" max="10" value="1"/>' +
        '</label>' +
        '<label class="link-field link-field--grow">' +
          '<span class="link-field-label">Rela\u00e7\u00e3o</span>' +
          '<input class="lk-rel link-rel-input" placeholder="Ex: Colega de turma, Rival\u2026"/>' +
        '</label>' +
      '</div>' +
      '<label class="link-field link-field--full">' +
        '<span class="link-field-label">Descri\u00e7\u00e3o</span>' +
        '<textarea class="lk-d link-desc-ta" rows="2" placeholder="Hist\u00f3ria, personalidade, como se conheceram\u2026"></textarea>' +
      '</label>' +
      '<label class="link-field link-field--full">' +
        '<span class="link-field-label link-benefit-label">\u2605 Benef\u00edcio</span>' +
        '<textarea class="lk-b link-benefit-ta" rows="1" placeholder="Benef\u00edcio mec\u00e2nico deste v\u00ednculo (opcional)\u2026"></textarea>' +
      '</label>' +
      '<label class="link-field link-field--full">' +
        '<span class="link-field-label">Observa\u00e7\u00f5es</span>' +
        '<textarea class="lk-o link-obs-ta" rows="1" placeholder="Notas livres\u2026"></textarea>' +
      '</label>' +
    '</div>';

  linkBody.appendChild(card);

  card.querySelector('.lk-n').value   = data.nome      || '';
  card.querySelector('.lk-a').value   = data.arcana    || '';
  card.querySelector('.lk-r').value   = rank;
  card.querySelector('.lk-s').value   = status;
  card.querySelector('.lk-rel').value = data.relacao   || '';
  card.querySelector('.lk-d').value   = data.desc      || '';
  card.querySelector('.lk-b').value   = data.beneficio || '';
  card.querySelector('.lk-o').value   = data.obs       || '';

  function updatePips() {
    var r = clampInt(card.querySelector('.lk-r').value, 1, 10);
    card.querySelectorAll('.link-pip').forEach(function(pip, i) {
      pip.classList.toggle('link-pip--filled', i < r);
    });
  }
  function updateStatusCls() {
    var s = card.querySelector('.lk-s').value;
    Object.values(LINK_STATUS_CLASSES).forEach(function(c) { card.classList.remove(c); });
    card.classList.add(LINK_STATUS_CLASSES[s] || 'link--ativo');
  }

  card.querySelector('.lk-r').addEventListener('input', function() {
    updatePips(); syncLinksToState(); renderLinkSummary();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  card.querySelector('.lk-s').addEventListener('change', function() {
    updateStatusCls(); syncLinksToState(); renderLinkSummary();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  card.querySelector('.lk-a').addEventListener('change', function() {
    syncLinksToState(); renderLinkSummary();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  ['lk-n','lk-rel','lk-d','lk-b','lk-o'].forEach(function(cls) {
    var el = card.querySelector('.' + cls);
    if (el) el.addEventListener('input', function() { syncLinksToState(); renderLinkSummary(); });
  });
  card.querySelector('.del').addEventListener('click', function() {
    card.remove(); syncLinksToState(); renderLinkSummary(); applyLinkFilters();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
}

export function syncLinksToState() {
  state.links = linkBody ? Array.from(linkBody.querySelectorAll('.link-card')).map(function(card) {
    return {
      nome:      card.querySelector('.lk-n').value,
      arcana:    card.querySelector('.lk-a').value,
      rank:      clampInt(card.querySelector('.lk-r').value, 1, 10),
      status:    card.querySelector('.lk-s').value,
      relacao:   card.querySelector('.lk-rel').value,
      desc:      card.querySelector('.lk-d').value,
      beneficio: card.querySelector('.lk-b').value,
      obs:       card.querySelector('.lk-o').value
    };
  }) : [];
}

// =============================================
// PISTAS
// =============================================

var CLUE_STATUS_CLASSES = {
  'Aberta': 'clue--aberta',
  'Em andamento': 'clue--andamento',
  'Resolvida': 'clue--resolvida',
  'Falsa pista': 'clue--falsa'
};

export function addClue(data) {
  data = data || { titulo: '', desc: '', evid: '', status: 'Aberta' };
  if (!clueBody) return;
  var card = document.createElement('div');
  card.className = 'clue-card ' + (CLUE_STATUS_CLASSES[data.status] || 'clue--aberta');

  card.innerHTML =
    '<div class="clue-card-top">' +
      '<input class="cl-t" placeholder="T\u00edtulo da pista ou \u00e2ncora"/>' +
      '<select class="cl-s">' +
        '<option>Aberta</option>' +
        '<option>Em andamento</option>' +
        '<option>Resolvida</option>' +
        '<option>Falsa pista</option>' +
      '</select>' +
      '<button class="mini del">\u2715</button>' +
    '</div>' +
    '<textarea class="cl-d" rows="2" placeholder="Descri\u00e7\u00e3o / Ancoragem"></textarea>' +
    '<textarea class="cl-e" rows="1" placeholder="Evid\u00eancia \u2014 onde, quem, como"></textarea>';

  clueBody.appendChild(card);
  card.querySelector('.cl-t').value = data.titulo || '';
  card.querySelector('.cl-d').value = data.desc || '';
  card.querySelector('.cl-e').value = data.evid || '';
  card.querySelector('.cl-s').value = data.status || 'Aberta';

  function updateStatusClass(s) {
    Object.values(CLUE_STATUS_CLASSES).forEach(function(c) { card.classList.remove(c); });
    card.classList.add(CLUE_STATUS_CLASSES[s] || 'clue--aberta');
  }

  card.querySelector('.cl-s').addEventListener('change', function() {
    updateStatusClass(card.querySelector('.cl-s').value);
    syncCluesToState();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  card.querySelector('.cl-t').addEventListener('input', syncCluesToState);
  card.querySelector('.cl-d').addEventListener('input', syncCluesToState);
  card.querySelector('.cl-e').addEventListener('input', syncCluesToState);
  card.querySelector('.del').addEventListener('click', function() { card.remove(); syncCluesToState(); });
}

export function syncCluesToState() {
  state.clues = clueBody ? Array.from(clueBody.querySelectorAll('.clue-card')).map(function(card) {
    return {
      titulo: card.querySelector('.cl-t').value,
      desc: card.querySelector('.cl-d').value,
      evid: card.querySelector('.cl-e').value,
      status: card.querySelector('.cl-s').value
    };
  }) : [];
}

// =============================================
// CONTATOS
// =============================================

export function addCtt(data) {
  data = data || { nome: '', tipo: 'NPC', obs: '' };
  if (!cttBody) return;
  var card = document.createElement('div');
  card.className = 'ctt-card';

  card.innerHTML =
    '<div class="ctt-card-top">' +
      '<input class="ct-n" placeholder="Nome do contato ou local"/>' +
      '<select class="ct-t">' +
        '<option>NPC</option>' +
        '<option>Local</option>' +
        '<option>Clube</option>' +
        '<option>Com\u00e9rcio</option>' +
      '</select>' +
      '<button class="mini del">\u2715</button>' +
    '</div>' +
    '<textarea class="ct-o" rows="2" placeholder="Observa\u00e7\u00f5es, pistas, hor\u00e1rios, n\u00edvel de confian\u00e7a..."></textarea>';

  cttBody.appendChild(card);
  card.querySelector('.ct-n').value = data.nome || '';
  card.querySelector('.ct-t').value = data.tipo || 'NPC';
  card.querySelector('.ct-o').value = data.obs || '';

  card.querySelector('.ct-n').addEventListener('input', syncContactsToState);
  card.querySelector('.ct-t').addEventListener('change', syncContactsToState);
  card.querySelector('.ct-o').addEventListener('input', syncContactsToState);
  card.querySelector('.del').addEventListener('click', function() { card.remove(); syncContactsToState(); });
}

export function syncContactsToState() {
  state.contacts = cttBody ? Array.from(cttBody.querySelectorAll('.ctt-card')).map(function(card) {
    return {
      nome: card.querySelector('.ct-n').value,
      tipo: card.querySelector('.ct-t').value,
      obs: card.querySelector('.ct-o').value
    };
  }) : [];
}

// =============================================
// RENDER TODAS AS TABELAS A PARTIR DO STATE
// =============================================

export function renderTables() {
  // Inventário: migrar e renderizar nas duas seções
  if (eqBodyEquipado) eqBodyEquipado.innerHTML = '';
  if (eqBodyMochila) eqBodyMochila.innerHTML = '';
  (state.equip || []).forEach(function(item) {
    var migrated = migrateEquipItem(item);
    addInventoryItem(migrated, migrated.local);
  });
  renderInventoryStatus();

  if (spellBody) { spellBody.innerHTML = ''; (state.spells || []).forEach(addSpell); }
  if (linkBody) { linkBody.innerHTML = ''; (state.links || []).forEach(addLink); renderLinkSummary(); }
  if (clueBody) { clueBody.innerHTML = ''; (state.clues || []).forEach(addClue); }
  if (cttBody) { cttBody.innerHTML = ''; (state.contacts || []).forEach(addCtt); }
}

// =============================================
// BOTÕES DE ADICIONAR LINHAS
// =============================================

export function initInventoryButtons() {
  var addEqEquipadoBtn = document.querySelector('#add-eq-equipado');
  if (addEqEquipadoBtn) addEqEquipadoBtn.addEventListener('click', function() {
    addInventoryItem({}, 'equipado');
    syncEquipToState();
    renderInventoryStatus();
  });

  var addEqMochilaBtn = document.querySelector('#add-eq-mochila');
  if (addEqMochilaBtn) addEqMochilaBtn.addEventListener('click', function() {
    addInventoryItem({}, 'mochila');
    syncEquipToState();
    renderInventoryStatus();
  });

  var addSpellBtn = document.querySelector('#add-spell');
  if (addSpellBtn) addSpellBtn.addEventListener('click', function() {
    addSpell();
    syncSpellsToState();
  });

  initSpellFilters();
  _updateSpellEmpty();

  var addLinkBtn = document.querySelector('#add-link');
  if (addLinkBtn) addLinkBtn.addEventListener('click', function() { addLink(); syncLinksToState(); renderLinkSummary(); });

  var addClueBtn = document.querySelector('#add-clue');
  if (addClueBtn) addClueBtn.addEventListener('click', function() { addClue(); syncCluesToState(); });

  var addCttBtn = document.querySelector('#add-ctt');
  if (addCttBtn) addCttBtn.addEventListener('click', function() { addCtt(); syncContactsToState(); });
}
