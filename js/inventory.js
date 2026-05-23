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

export var eqBodyEquipado = document.querySelector('#tbl-eq-equipado tbody');
export var eqBodyMochila  = document.querySelector('#tbl-eq-mochila tbody');
export var spellBody      = document.querySelector('#spell-grid');
export var linkBody       = document.querySelector('#tbl-link tbody');
export var clueBody       = document.querySelector('#tbl-clue tbody');
export var cttBody        = document.querySelector('#tbl-ctt tbody');

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
 * Adiciona um item ao inventário (em uma das duas tbodies).
 */
export function addInventoryItem(data, targetLocal) {
  data = data || {};
  var local = data.local || targetLocal || 'mochila';
  var tbody = (local === 'equipado') ? eqBodyEquipado : eqBodyMochila;
  if (!tbody) return;

  var tr = document.createElement('tr');
  var moveLabel = (local === 'equipado') ? '↓ Mochila' : '↑ Equipar';
  tr.dataset.local = local;
  tr.innerHTML = '<td><input class="eq-nome" placeholder="Nome do item"/></td>' +
    '<td><input class="eq-peso" type="number" min="0" step="0.1" value="0" placeholder="0"/></td>' +
    '<td><input class="eq-qtd" type="number" min="1" step="1" value="1" placeholder="1"/></td>' +
    '<td><textarea class="eq-ef" rows="1" placeholder="Efeito/Notas"></textarea></td>' +
    '<td class="row-actions"><button class="eq-move-btn">' + moveLabel + '</button><button class="mini del">X</button></td>';
  tbody.appendChild(tr);

  tr.querySelector('.eq-nome').value = data.nome || '';
  tr.querySelector('.eq-peso').value = data.peso != null ? data.peso : 0;
  tr.querySelector('.eq-qtd').value = data.qtd != null ? data.qtd : 1;
  tr.querySelector('.eq-ef').value = data.efeito || '';

  // Eventos de atualização de peso
  tr.querySelector('.eq-peso').addEventListener('input', function() { syncEquipToState(); renderInventoryStatus(); });
  tr.querySelector('.eq-qtd').addEventListener('input', function() { syncEquipToState(); renderInventoryStatus(); });
  tr.querySelector('.eq-nome').addEventListener('input', function() { syncEquipToState(); });
  tr.querySelector('.eq-ef').addEventListener('input', function() { syncEquipToState(); });

  // Botão mover entre equipado/mochila
  tr.querySelector('.eq-move-btn').addEventListener('click', function() {
    syncEquipToState();
    var idx = getItemIndexFromRow(tr, local);
    if (idx === -1) return;
    var item = state.equip[idx];
    item.local = (local === 'equipado') ? 'mochila' : 'equipado';
    tr.remove();
    addInventoryItem(item, item.local);
    syncEquipToState();
    renderInventoryStatus();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });

  // Botão remover
  tr.querySelector('.del').addEventListener('click', function() {
    tr.remove();
    syncEquipToState();
    renderInventoryStatus();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
}

/**
 * Encontra o índice no state.equip de um item baseado em sua row TR.
 */
export function getItemIndexFromRow(tr, local) {
  var tbody = (local === 'equipado') ? eqBodyEquipado : eqBodyMochila;
  if (!tbody) return -1;
  var rows = Array.from(tbody.querySelectorAll('tr'));
  var rowIdx = rows.indexOf(tr);
  if (rowIdx === -1) return -1;
  // Contar itens no state com esse local até achar o índice correto
  var count = 0;
  for (var i = 0; i < state.equip.length; i++) {
    if ((state.equip[i].local || 'mochila') === local) {
      if (count === rowIdx) return i;
      count++;
    }
  }
  return -1;
}

export function syncEquipToState() {
  var items = [];
  // Equipados
  if (eqBodyEquipado) {
    Array.from(eqBodyEquipado.querySelectorAll('tr')).forEach(function(tr) {
      items.push({
        nome: tr.querySelector('.eq-nome').value,
        peso: Number(tr.querySelector('.eq-peso').value) || 0,
        qtd: Number(tr.querySelector('.eq-qtd').value) || 1,
        efeito: tr.querySelector('.eq-ef').value,
        local: 'equipado'
      });
    });
  }
  // Mochila
  if (eqBodyMochila) {
    Array.from(eqBodyMochila.querySelectorAll('tr')).forEach(function(tr) {
      items.push({
        nome: tr.querySelector('.eq-nome').value,
        peso: Number(tr.querySelector('.eq-peso').value) || 0,
        qtd: Number(tr.querySelector('.eq-qtd').value) || 1,
        efeito: tr.querySelector('.eq-ef').value,
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

export function addLink(data) {
  data = data || { nome: "", arcana: "", rank: 1, obs: "" };
  if (!linkBody) return;
  var tr = document.createElement("tr");
  tr.innerHTML = '<td><input class="lk-n" placeholder="Nome do NPC"/></td>' +
    '<td><select class="lk-a"></select></td>' +
    '<td><input class="lk-r" type="number" min="1" max="10" value="1"/></td>' +
    '<td><textarea class="lk-o" rows="1" placeholder="Observações"></textarea></td>' +
    '<td class="row-actions"><button class="mini del">Remover</button></td>';
  linkBody.appendChild(tr);
  var asel = tr.querySelector('.lk-a');
  ARCANAS.forEach(function(a) { var o = document.createElement('option'); o.textContent = a; o.value = a; asel.appendChild(o); });
  tr.querySelector('.lk-n').value = data.nome || "";
  asel.value = data.arcana || "";
  tr.querySelector('.lk-r').value = data.rank || 1;
  tr.querySelector('.lk-o').value = data.obs || "";
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncLinksToState(); });
}

export function syncLinksToState() {
  state.links = linkBody ? Array.from(linkBody.querySelectorAll('tr')).map(function(tr) {
    return {
      nome: tr.querySelector('.lk-n').value,
      arcana: tr.querySelector('.lk-a').value,
      rank: clampInt(tr.querySelector('.lk-r').value, 1, 10),
      obs: tr.querySelector('.lk-o').value
    };
  }) : [];
}

// =============================================
// PISTAS
// =============================================

export function addClue(data) {
  data = data || { titulo: "", desc: "", evid: "", status: "Aberta" };
  if (!clueBody) return;
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input class="cl-t" placeholder="Título"/></td>' +
    '<td><textarea class="cl-d" rows="1" placeholder="Descrição / Ancoragem"></textarea></td>' +
    '<td><textarea class="cl-e" rows="1" placeholder="Evidência (onde/quem/como)"></textarea></td>' +
    '<td><select class="cl-s"><option>Aberta</option><option>Em andamento</option><option>Resolvida</option></select></td>' +
    '<td class="row-actions"><button class="mini del">Remover</button></td>';
  clueBody.appendChild(tr);
  tr.querySelector('.cl-t').value = data.titulo || "";
  tr.querySelector('.cl-d').value = data.desc || "";
  tr.querySelector('.cl-e').value = data.evid || "";
  tr.querySelector('.cl-s').value = data.status || "Aberta";
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncCluesToState(); });
}

export function syncCluesToState() {
  state.clues = clueBody ? Array.from(clueBody.querySelectorAll('tr')).map(function(tr) {
    return {
      titulo: tr.querySelector('.cl-t').value,
      desc: tr.querySelector('.cl-d').value,
      evid: tr.querySelector('.cl-e').value,
      status: tr.querySelector('.cl-s').value
    };
  }) : [];
}

// =============================================
// CONTATOS
// =============================================

export function addCtt(data) {
  data = data || { nome: "", tipo: "NPC", obs: "" };
  if (!cttBody) return;
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><input class="ct-n" placeholder="Nome"/></td>' +
    '<td><select class="ct-t"><option>NPC</option><option>Local</option><option>Clube</option><option>Comércio</option></select></td>' +
    '<td><textarea class="ct-o" rows="1" placeholder="Observações / pistas / horários"></textarea></td>' +
    '<td class="row-actions"><button class="mini del">Remover</button></td>';
  cttBody.appendChild(tr);
  tr.querySelector('.ct-n').value = data.nome || "";
  tr.querySelector('.ct-t').value = data.tipo || "NPC";
  tr.querySelector('.ct-o').value = data.obs || "";
  tr.querySelector('.del').addEventListener('click', function() { tr.remove(); syncContactsToState(); });
}

export function syncContactsToState() {
  state.contacts = cttBody ? Array.from(cttBody.querySelectorAll('tr')).map(function(tr) {
    return {
      nome: tr.querySelector('.ct-n').value,
      tipo: tr.querySelector('.ct-t').value,
      obs: tr.querySelector('.ct-o').value
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
  if (linkBody) { linkBody.innerHTML = ''; (state.links || []).forEach(addLink); }
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
  if (addLinkBtn) addLinkBtn.addEventListener('click', function() { addLink(); syncLinksToState(); });

  var addClueBtn = document.querySelector('#add-clue');
  if (addClueBtn) addClueBtn.addEventListener('click', function() { addClue(); syncCluesToState(); });

  var addCttBtn = document.querySelector('#add-ctt');
  if (addCttBtn) addCttBtn.addEventListener('click', function() { addCtt(); syncContactsToState(); });
}
