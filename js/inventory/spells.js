// =============================================
// INVENTARIO — MAGIAS
// =============================================

import { state } from '../state.js';
import { rollSpellFormula, formulaNeedsHab, COMBAT_ATTRS } from '../dice.js';

function _escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export var spellBody      = document.querySelector('#spell-grid');

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

export function _updateSpellEmpty() {
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
  var habOpts = COMBAT_ATTRS.map(function(a) {
    return '<option value="' + a + '">' + a + '</option>';
  }).join('');

  card.innerHTML =
    '<div class="spell-card-header">' +
      '<div class="spell-card-name-row">' +
        '<input class="sp-n spell-name-input" placeholder="Nome da Magia / Técnica">' +
        '<div class="spell-card-actions">' +
          '<button type="button" class="mini roll-dmg" title="Rolar / Calcular Fórmula">Rolar</button>' +
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
      '<label class="spell-stat"><span class="spell-stat-label">Fórmula</span>' +
        '<input class="sp-dmg spell-stat-input" placeholder="MAGd8 + MAG"></label>' +
    '</div>' +
    '<div class="spell-hab-row" style="display:none;">' +
      '<label class="spell-hab-label">Atributo para HAB' +
        '<select class="sp-hab">' + habOpts + '</select>' +
      '</label>' +
    '</div>' +
    '<div class="spell-card-desc">' +
      '<label class="spell-desc-label">Efeito / Descrição</label>' +
      '<textarea class="sp-e spell-desc-textarea" rows="2" placeholder="Descreva o efeito…"></textarea>' +
    '</div>' +
    '<div class="spell-card-obs-wrap">' +
      '<button type="button" class="spell-obs-toggle">Observações <span class="spell-obs-arrow">▾</span></button>' +
      '<textarea class="sp-obs spell-obs-textarea" rows="1" placeholder="Notas adicionais…"></textarea>' +
    '</div>' +
    '<div class="spell-roll-result">' +
      '<div class="spell-roll-result__title">' +
        '<span class="spell-roll-title-label">Última Rolagem</span>' +
        '<button type="button" class="mini spell-roll-clear" title="Limpar última rolagem">Limpar</button>' +
      '</div>' +
      '<div class="spell-roll-result__content"><span class="spell-roll-empty">Nenhuma rolagem feita ainda.</span></div>' +
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
  card.querySelector('.sp-dmg').value        = data.damageFormula || '';
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

  // Seletor de HAB: aparece apenas quando a fórmula usa HAB
  var habRow = card.querySelector('.spell-hab-row');
  var habSel = card.querySelector('.sp-hab');
  function refreshSpellHab() {
    var needs = formulaNeedsHab((card.querySelector('.sp-dmg') || {}).value || '');
    if (habRow) habRow.style.display = needs ? '' : 'none';
  }
  card.querySelector('.sp-dmg').addEventListener('input', refreshSpellHab);
  refreshSpellHab();

  // Rolar / Calcular Fórmula — usa o parser do módulo de dados (js/dice.js).
  // O resultado vai para o histórico geral E é renderizado dentro deste card.
  card.querySelector('.roll-dmg').addEventListener('click', function() {
    var formula = (card.querySelector('.sp-dmg') || {}).value || '';
    var nome    = ((card.querySelector('.sp-n') || {}).value || '').trim() || 'Magia';
    var habAttr = (habRow && habRow.style.display !== 'none' && habSel) ? habSel.value : null;
    var res = rollSpellFormula(formula, nome, habAttr);
    renderSpellRollResult(card, res);
  });

  // Limpar apenas a "Última Rolagem" deste card (não afeta o histórico geral)
  var clearBtn = card.querySelector('.spell-roll-clear');
  if (clearBtn) clearBtn.addEventListener('click', function() {
    resetSpellRollResult(card);
  });

  _updateSpellCount();
  _updateSpellEmpty();
}

/** Restaura a área "Última Rolagem" de um card ao estado inicial (sem rolagem). */
export function resetSpellRollResult(card) {
  if (!card) return;
  var wrap    = card.querySelector('.spell-roll-result');
  var titleEl = card.querySelector('.spell-roll-title-label');
  var content = card.querySelector('.spell-roll-result__content');
  if (wrap) wrap.className = 'spell-roll-result';
  if (titleEl) titleEl.textContent = 'Última Rolagem';
  if (content) content.innerHTML = '<span class="spell-roll-empty">Nenhuma rolagem feita ainda.</span>';
}

/**
 * Renderiza o resultado da última rolagem/cálculo dentro do card da magia.
 * @param {HTMLElement} card
 * @param {object} res - resultado de rollSpellFormula (dice.js)
 */
export function renderSpellRollResult(card, res) {
  if (!card) return;
  var wrap    = card.querySelector('.spell-roll-result');
  var titleEl = card.querySelector('.spell-roll-title-label');
  var content = card.querySelector('.spell-roll-result__content');
  if (!wrap || !content) return;

  wrap.className = 'spell-roll-result';

  // Erro / fórmula inválida ou vazia
  if (!res || res.ok === false) {
    wrap.classList.add('spell-roll-result--error');
    if (titleEl) titleEl.textContent = 'Última Rolagem';
    content.innerHTML = '<span class="spell-roll-err">' +
      _escHtml((res && res.error) ? res.error : 'Fórmula inválida.') + '</span>';
    return;
  }

  var TYPE_CLASS = {
    damage: 'spell-roll-result--damage', heal: 'spell-roll-result--healing',
    pm: 'spell-roll-result--healing', percent: 'spell-roll-result--percent',
    generic: 'spell-roll-result--generic'
  };
  wrap.classList.add(TYPE_CLASS[res.type] || 'spell-roll-result--generic');
  if (titleEl) titleEl.textContent = (res.type === 'percent') ? 'Último Cálculo' : 'Última Rolagem';

  var groups = res.diceGroups || [];
  var diceRolled = groups.length ? groups.map(function(g) { return g.label; }).join(' + ') : '';
  var allDice = groups.length ? groups.map(function(g) { return g.rolls.join(', ') || '—'; }).join(' | ') : '';

  var TYPE_LABEL = { damage: 'Dano', heal: 'Recuperação de PV', pm: 'Recuperação de PM', percent: 'Porcentagem', generic: 'Resultado' };
  var rows = [];
  rows.push('<div class="spell-roll-line"><b>Tipo:</b> ' + _escHtml(TYPE_LABEL[res.type] || 'Resultado') + '</div>');
  rows.push('<div class="spell-roll-line"><b>Fórmula:</b> ' + _escHtml(res.label) + '</div>');
  if (res.usedHab) rows.push('<div class="spell-roll-line"><b>HAB escolhido:</b> ' + _escHtml(res.usedHab) + '</div>');

  if (res.type === 'percent') {
    rows.push('<div class="spell-roll-line"><b>Cálculo:</b> ' + _escHtml(res.resolved) + '</div>');
    rows.push('<div class="spell-roll-total">Resultado: <b>' + _escHtml(res.total) + '%</b></div>');
  } else {
    rows.push('<div class="spell-roll-line"><b>Rolagem:</b> ' + _escHtml(res.resolved) + '</div>');
    if (diceRolled) rows.push('<div class="spell-roll-line"><b>Dados:</b> ' + _escHtml(allDice) + '</div>');
    if (res.type === 'heal') rows.push('<div class="spell-roll-total">Total recuperado: <b>' + _escHtml(res.total) + '</b> PV</div>');
    else if (res.type === 'pm') rows.push('<div class="spell-roll-total">Total recuperado: <b>' + _escHtml(res.total) + '</b> PM</div>');
    else rows.push('<div class="spell-roll-total">Total: <b>' + _escHtml(res.total) + '</b></div>');
  }
  content.innerHTML = rows.join('');
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
      damageFormula: (card.querySelector('.sp-dmg') || {}).value || '',
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

