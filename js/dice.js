// =============================================
// SISTEMA DE ROLAGEM DE DADOS
// Depende de: state.js, constants.js, calculations.js, ui.js
// Responsabilidade exclusiva:
//   - rolagens de teste (1d20 + atributo)
//   - rolagens de dano (fórmulas ATRIBUTOdDADO)
//   - parser de fórmula de dano
//   - histórico de rolagens
//   - integração com a interface
// =============================================

import { state } from './state.js';
import { SOCIAL_IDS, SOCIAL_SKILL_META } from './constants.js';
import { calcSocialTier } from './calculations.js';
import { showToast } from './ui.js';

// =============================================
// CONSTANTES
// =============================================

export var COMBAT_ATTRS = ['STR', 'MAG', 'TEC', 'AGI', 'VIT', 'LCK'];
export var DAMAGE_DICE = [4, 6, 8, 10, 12];
var MAX_DICE = 50;          // limite de segurança
var HISTORY_LIMIT = 20;     // últimas N rolagens

var COMBAT_LABELS = {
  STR: 'Força (STR)', MAG: 'Magia (MAG)', TEC: 'Técnica (TEC)',
  AGI: 'Agilidade (AGI)', VIT: 'Vitalidade (VIT)', LCK: 'Sorte (LCK)'
};

// =============================================
// HELPERS DE SEGURANÇA
// =============================================

/** Escapa HTML para evitar injeção via strings do jogador (fórmulas etc.). */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// =============================================
// PRIMITIVAS DE ROLAGEM
// =============================================

/**
 * Rola um único dado.
 * @param {number} sides - número de faces (>= 2)
 * @returns {number} resultado entre 1 e sides
 */
export function rollDie(sides) {
  var s = Math.max(2, Math.trunc(sides) || 2);
  return Math.floor(Math.random() * s) + 1;
}

/**
 * Rola vários dados iguais.
 * @param {number} quantity - quantidade de dados
 * @param {number} sides - número de faces
 * @returns {number[]} lista de resultados individuais
 */
export function rollDice(quantity, sides) {
  var q = Math.max(0, Math.trunc(quantity) || 0);
  var out = [];
  for (var i = 0; i < q; i++) out.push(rollDie(sides));
  return out;
}

/**
 * Rolagem de teste: 1d20 + atributo + modificador extra.
 * @param {number} attributeValue - valor final do atributo (ou Tier social)
 * @param {number} extraModifier - modificador manual opcional
 * @returns {object} { die, attribute, extra, total, crit, fail }
 */
export function rollTest(attributeValue, extraModifier) {
  var die = rollDie(20);
  var attr = Math.trunc(Number(attributeValue) || 0);
  var extra = Math.trunc(Number(extraModifier) || 0);
  return {
    die: die,
    attribute: attr,
    extra: extra,
    total: die + attr + extra,
    crit: die === 20,
    fail: die === 1
  };
}

// =============================================
// PARSER DE FÓRMULA DE DANO
// =============================================

/**
 * Interpreta uma fórmula de dano no formato ATRIBUTOdDADO (ex.: MAGd6, strd8).
 * Aceita minúsculas e converte para maiúsculas.
 * @param {string} formula
 * @returns {object} { ok:true, attr, sides, normalized } ou { ok:false, error }
 */
export function parseDamageFormula(formula) {
  var raw = String(formula == null ? '' : formula).trim();
  var ERR = 'Fórmula inválida. Use algo como MAGd6, STRd8 ou TECd10.';
  if (!raw) return { ok: false, error: ERR };

  var m = raw.match(/^([A-Za-z]{3})\s*[dD]\s*(\d{1,2})$/);
  if (!m) return { ok: false, error: ERR };

  var attr = m[1].toUpperCase();
  var sides = parseInt(m[2], 10);

  if (COMBAT_ATTRS.indexOf(attr) === -1) return { ok: false, error: ERR };
  if (DAMAGE_DICE.indexOf(sides) === -1) return { ok: false, error: ERR };

  return { ok: true, attr: attr, sides: sides, normalized: attr + 'd' + sides };
}

// =============================================
// ATRIBUTOS FINAIS COMPUTADOS
// =============================================

/**
 * Retorna os atributos de combate finais (state._computed.modded),
 * com fallback para os valores base caso ainda não haja cálculo.
 */
export function getComputedStats() {
  var comp = state._computed;
  if (comp && comp.modded) return comp.modded;
  return {
    STR: state.CharSTR || 0, MAG: state.CharMAG || 0, TEC: state.CharTEC || 0,
    AGI: state.CharAGI || 0, VIT: state.CharVIT || 0, LCK: state.CharLCK || 0
  };
}

/**
 * Rola dano a partir de uma fórmula, usando os atributos finais.
 * @param {string} formula - ex.: 'MAGd6'
 * @param {object} computedStats - atributos finais {STR,MAG,...}
 * @param {number} extraBonus - bônus fixo somado ao total
 * @returns {object} resultado detalhado ou { ok:false, error }
 */
export function rollDamageFormula(formula, computedStats, extraBonus) {
  var parsed = parseDamageFormula(formula);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  var stats = computedStats || getComputedStats();
  var attrValue = Math.max(0, Math.trunc(Number(stats[parsed.attr]) || 0));
  var extra = Math.trunc(Number(extraBonus) || 0);

  var limited = false;
  var quantity = attrValue;
  if (quantity > MAX_DICE) { quantity = MAX_DICE; limited = true; }

  var dice = rollDice(quantity, parsed.sides);
  var diceSum = dice.reduce(function(a, b) { return a + b; }, 0);

  return {
    ok: true,
    attr: parsed.attr,
    sides: parsed.sides,
    normalized: parsed.normalized,
    attrValue: attrValue,
    quantity: quantity,
    dice: dice,
    diceSum: diceSum,
    extra: extra,
    total: diceSum + extra,
    limited: limited
  };
}

// =============================================
// HISTÓRICO
// =============================================

/** Garante que state.rollHistory existe como array. */
function ensureHistory() {
  if (!Array.isArray(state.rollHistory)) state.rollHistory = [];
  return state.rollHistory;
}

/** Retorna hora curta HH:MM. */
function shortTime() {
  var d = new Date();
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

/**
 * Adiciona uma entrada ao histórico (mantém apenas as últimas 20).
 */
export function addRollToHistory(entry) {
  var hist = ensureHistory();
  entry.time = entry.time || shortTime();
  hist.unshift(entry);
  if (hist.length > HISTORY_LIMIT) hist.length = HISTORY_LIMIT;
  renderDiceHistory();
  if (window.debouncedAutoSave) window.debouncedAutoSave();
}

/**
 * Renderiza o histórico de rolagens no container #dice-history.
 */
export function renderDiceHistory() {
  var el = document.getElementById('dice-history');
  if (!el) return;
  var hist = ensureHistory();
  if (hist.length === 0) {
    el.innerHTML = '<p class="dice-empty">Nenhuma rolagem ainda.</p>';
    return;
  }
  el.innerHTML = hist.map(function(h) {
    var cls = 'dice-hist-item';
    if (h.crit) cls += ' dice-hist-crit';
    if (h.fail) cls += ' dice-hist-fail';
    var tag = h.kind === 'test' ? 'Teste' : 'Dano';
    var diceStr = (h.dice && h.dice.length) ? h.dice.join(', ') : '—';
    var lines = '';
    if (h.kind === 'test') {
      lines =
        '<div class="dice-hist-line">1d20: <b>' + esc(h.die) + '</b>' +
          (h.attribute != null ? ' · ' + esc(h.attrLabel || 'atributo') + ': +' + esc(h.attribute) : '') +
          (h.extra ? ' · extra: ' + (h.extra >= 0 ? '+' : '') + esc(h.extra) : '') +
          (h.tier != null ? ' · Tier: ' + ['0','I','II','III','IV','V'][h.tier] : '') + '</div>' +
        (h.crit ? '<div class="dice-hist-flag dice-flag-crit">Crítico!</div>' : '') +
        (h.fail ? '<div class="dice-hist-flag dice-flag-fail">Falha crítica!</div>' : '');
    } else {
      lines =
        '<div class="dice-hist-line">Dados (' + esc(h.quantity) + 'd' + esc(h.sides) + '): ' + esc(diceStr) + '</div>' +
        '<div class="dice-hist-line">Soma: <b>' + esc(h.diceSum) + '</b>' +
          (h.extra ? ' · extra: ' + (h.extra >= 0 ? '+' : '') + esc(h.extra) : '') + '</div>';
    }
    return '<div class="' + cls + '">' +
      '<div class="dice-hist-head">' +
        '<span class="dice-hist-tag">' + tag + '</span>' +
        '<span class="dice-hist-formula">' + esc(h.label) + '</span>' +
        '<span class="dice-hist-total">' + esc(h.total) + '</span>' +
        '<span class="dice-hist-time">' + esc(h.time) + '</span>' +
      '</div>' + lines +
    '</div>';
  }).join('');
}

// =============================================
// AÇÕES DE ALTO NÍVEL (usadas pela UI e por botões externos)
// =============================================

/**
 * Executa uma rolagem de teste (1d20 + atributo) e registra no histórico.
 * @param {string} category - 'combat' ou 'social'
 * @param {string} attrKey - chave do atributo (STR..) ou id social (KNOPts..)
 * @param {number} extraModifier
 * @returns {object} resultado do teste
 */
export function performTestRoll(category, attrKey, extraModifier) {
  var attrValue, label, attrLabel;
  if (category === 'social') {
    var meta = SOCIAL_SKILL_META[attrKey];
    // Rolagem social usa os PONTOS totais da habilidade (não o Tier).
    attrValue = Math.trunc(Number(state[attrKey]) || 0);
    var tier = calcSocialTier(state[attrKey] || 0);
    attrLabel = meta ? meta.name : attrKey;
    label = attrLabel + ' — 1d20 + ' + attrValue + ' (Tier ' + ['0','I','II','III','IV','V'][tier] + ')';
  } else {
    var stats = getComputedStats();
    attrValue = Math.trunc(Number(stats[attrKey]) || 0);
    attrLabel = attrKey;
    label = attrKey + ' — 1d20 + ' + attrValue;
  }

  var res = rollTest(attrValue, extraModifier);
  addRollToHistory({
    kind: 'test',
    label: label,
    attrLabel: attrLabel,
    die: res.die,
    attribute: res.attribute,
    extra: res.extra,
    total: res.total,
    crit: res.crit,
    fail: res.fail,
    tier: (category === 'social') ? calcSocialTier(state[attrKey] || 0) : null
  });
  showTestResult(res, category, attrKey, res.extra);
  return res;
}

/**
 * Executa uma rolagem de dano a partir de uma fórmula e registra no histórico.
 * Usada pela UI, pelos botões de magia e pelo botão de arma.
 * @param {string} formula - ex.: 'MAGd6'
 * @param {number} extraBonus - bônus extra opcional
 * @param {string} sourceLabel - rótulo de origem (ex.: nome da magia/arma)
 * @returns {object} resultado ou { ok:false }
 */
export function performDamageRoll(formula, extraBonus, sourceLabel) {
  var res = rollDamageFormula(formula, getComputedStats(), extraBonus);
  if (!res.ok) {
    showToast(res.error, 'error', 3500);
    return res;
  }
  if (res.limited) {
    showToast('Quantidade de dados limitada a ' + MAX_DICE + ' por segurança.', 'info', 3500);
  }
  var prefix = sourceLabel ? (sourceLabel + ' — ') : '';
  addRollToHistory({
    kind: 'damage',
    label: prefix + res.normalized,
    attr: res.attr,
    sides: res.sides,
    quantity: res.quantity,
    attrValue: res.attrValue,
    dice: res.dice,
    diceSum: res.diceSum,
    extra: res.extra,
    total: res.total
  });
  showDamageResult(res);
  return res;
}

/**
 * Rolagem de dano de conveniência para fontes externas (magias, arma).
 * @param {string} formula
 * @param {string} sourceLabel
 */
export function rollDamage(formula, sourceLabel) {
  return performDamageRoll(formula, 0, sourceLabel);
}

// =============================================
// INTERFACE
// =============================================

/** Preenche o select de atributos conforme a categoria escolhida. */
function populateAttrSelect(sel, category) {
  if (!sel) return;
  var prev = sel.value;
  sel.innerHTML = '';
  var opts = [];
  if (category === 'social') {
    SOCIAL_IDS.forEach(function(id) {
      var meta = SOCIAL_SKILL_META[id];
      opts.push({ value: id, label: meta ? meta.name : id });
    });
  } else {
    COMBAT_ATTRS.forEach(function(a) {
      opts.push({ value: a, label: COMBAT_LABELS[a] || a });
    });
  }
  opts.forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  });
  // Preserva seleção se ainda válida
  if (Array.prototype.some.call(sel.options, function(o) { return o.value === prev; })) {
    sel.value = prev;
  }
}

/** Renderiza o resultado detalhado da última rolagem. */
function showTestResult(res, category, attrKey, extra) {
  var out = document.getElementById('dice-result');
  if (!out) return;
  var attrLabel, attrShown, tierInfo = '';
  if (category === 'social') {
    var meta = SOCIAL_SKILL_META[attrKey];
    // Rolagem social soma os PONTOS da habilidade; o Tier é apenas informativo.
    attrLabel = (meta ? meta.name : attrKey) + ' (pontos)';
    var tier = calcSocialTier(state[attrKey] || 0);
    tierInfo = '<span class="dice-result-tier">Tier atual: ' + ['0','I','II','III','IV','V'][tier] + '</span>';
  } else {
    attrLabel = attrKey + ' final';
  }
  attrShown = res.attribute;
  var flag = res.crit ? '<div class="dice-flag dice-flag-crit">Crítico!</div>'
           : res.fail ? '<div class="dice-flag dice-flag-fail">Falha crítica!</div>' : '';
  out.className = 'dice-result' + (res.crit ? ' is-crit' : res.fail ? ' is-fail' : '');
  out.innerHTML =
    '<div class="dice-result-formula">1d20 + ' + esc(attrLabel) + '</div>' +
    '<div class="dice-result-lines">' +
      '<span>Dado: <b>' + esc(res.die) + '</b></span>' +
      '<span>' + esc(attrLabel) + ': +' + esc(attrShown) + '</span>' +
      (extra ? '<span>Mod. extra: ' + (extra >= 0 ? '+' : '') + esc(extra) + '</span>' : '') +
      tierInfo +
    '</div>' +
    flag +
    '<div class="dice-result-total">Total: <b>' + esc(res.total) + '</b></div>';
}

/** Renderiza o resultado detalhado de uma rolagem de dano. */
function showDamageResult(res) {
  var out = document.getElementById('dice-result');
  if (!out) return;
  out.className = 'dice-result';
  out.innerHTML =
    '<div class="dice-result-formula">' + esc(res.normalized) + '</div>' +
    '<div class="dice-result-lines">' +
      '<span>' + esc(res.attr) + ' final: ' + esc(res.attrValue) + '</span>' +
      '<span>Rolagem: ' + esc(res.quantity) + 'd' + esc(res.sides) + '</span>' +
    '</div>' +
    '<div class="dice-result-dice">Dados: ' + esc(res.dice.join(', ') || '—') + '</div>' +
    '<div class="dice-result-lines">' +
      '<span>Soma dos dados: <b>' + esc(res.diceSum) + '</b></span>' +
      (res.extra ? '<span>Bônus extra: ' + (res.extra >= 0 ? '+' : '') + esc(res.extra) + '</span>' : '') +
    '</div>' +
    '<div class="dice-result-total">Total: <b>' + esc(res.total) + '</b></div>';
}

/**
 * Cria (uma única vez) o card de Rolagem de Dados na view Acesso Rápido.
 * Idempotente.
 */
export function buildDicePanel() {
  if (document.getElementById('dice-card')) return;
  var mainEl = document.querySelector('#acessorapido main');
  if (!mainEl) return;

  var card = document.createElement('section');
  card.className = 'card';
  card.id = 'dice-card';
  card.innerHTML =
    '<div class="section-title"><div class="bar"></div><h2>Rolagem de Dados</h2></div>' +
    '<div class="dice-controls">' +
      '<div class="dice-field">' +
        '<label for="dice-type">Tipo</label>' +
        '<select id="dice-type">' +
          '<option value="test">Teste (1d20 + atributo)</option>' +
          '<option value="damage">Dano (fórmula)</option>' +
        '</select>' +
      '</div>' +
      '<div class="dice-field" id="dice-cat-wrap">' +
        '<label for="dice-cat">Categoria</label>' +
        '<select id="dice-cat">' +
          '<option value="combat">Combate</option>' +
          '<option value="social">Social</option>' +
        '</select>' +
      '</div>' +
      '<div class="dice-field" id="dice-attr-wrap">' +
        '<label for="dice-attr">Atributo</label>' +
        '<select id="dice-attr"></select>' +
      '</div>' +
      '<div class="dice-field" id="dice-formula-wrap" style="display:none;">' +
        '<label for="dice-formula">Fórmula</label>' +
        '<input id="dice-formula" placeholder="MAGd6" autocomplete="off"/>' +
      '</div>' +
      '<div class="dice-field">' +
        '<label for="dice-extra">Mod. extra</label>' +
        '<input id="dice-extra" type="number" value="0" step="1"/>' +
      '</div>' +
      '<div class="dice-field dice-field-btn">' +
        '<button type="button" id="dice-roll" class="btn-feedback">Rolar</button>' +
      '</div>' +
    '</div>' +
    '<div id="dice-result" class="dice-result"><p class="dice-empty">Configure e clique em <b>Rolar</b>.</p></div>' +
    '<div class="dice-history-header">' +
      '<span>Histórico (últimas ' + HISTORY_LIMIT + ')</span>' +
      '<button type="button" id="dice-clear-history" class="mini">Limpar</button>' +
    '</div>' +
    '<div id="dice-history" class="dice-history"></div>';

  // Inserir logo após o Resumo Automático (se existir), senão antes das Ações
  var summary = document.getElementById('auto-summary-card');
  if (summary && summary.nextSibling) {
    mainEl.insertBefore(card, summary.nextSibling);
  } else {
    var acoes = Array.from(mainEl.querySelectorAll('section.card')).find(function(c) {
      return c.querySelector('#save');
    });
    if (acoes) mainEl.insertBefore(card, acoes);
    else mainEl.appendChild(card);
  }
}

/**
 * Inicializa o sistema de dados: constrói o painel, popula selects,
 * conecta eventos e renderiza o histórico salvo.
 */
export function initDiceSystem() {
  buildDicePanel();

  var typeSel  = document.getElementById('dice-type');
  var catSel   = document.getElementById('dice-cat');
  var attrSel  = document.getElementById('dice-attr');
  var formEl   = document.getElementById('dice-formula');
  var extraEl  = document.getElementById('dice-extra');
  var rollBtn  = document.getElementById('dice-roll');
  var clearBtn = document.getElementById('dice-clear-history');
  var catWrap  = document.getElementById('dice-cat-wrap');
  var attrWrap = document.getElementById('dice-attr-wrap');
  var formWrap = document.getElementById('dice-formula-wrap');

  if (!typeSel || !rollBtn) return;

  populateAttrSelect(attrSel, catSel ? catSel.value : 'combat');

  function refreshMode() {
    var isDamage = typeSel.value === 'damage';
    if (catWrap)  catWrap.style.display  = isDamage ? 'none' : '';
    if (attrWrap) attrWrap.style.display = isDamage ? 'none' : '';
    if (formWrap) formWrap.style.display = isDamage ? '' : 'none';
  }
  refreshMode();

  typeSel.addEventListener('change', refreshMode);
  if (catSel) catSel.addEventListener('change', function() {
    populateAttrSelect(attrSel, catSel.value);
  });

  rollBtn.addEventListener('click', function() {
    var extra = Number(extraEl ? extraEl.value : 0) || 0;
    if (typeSel.value === 'damage') {
      performDamageRoll(formEl ? formEl.value : '', extra, '');
    } else {
      var category = catSel ? catSel.value : 'combat';
      var attrKey = attrSel ? attrSel.value : 'STR';
      performTestRoll(category, attrKey, extra);
    }
  });

  if (clearBtn) clearBtn.addEventListener('click', function() {
    state.rollHistory = [];
    renderDiceHistory();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });

  renderDiceHistory();
}
