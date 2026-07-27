// =============================================
// DADOS — HISTORICO, ACOES E INTERFACE (UI)
// Renderizacao, historico e wiring de eventos do painel de dados.
// Depende do motor (engine.js) e do DOM.
// =============================================

import { state } from '../state.js';
import { SOCIAL_IDS, SOCIAL_SKILL_META } from '../constants.js';
import { calcSocialTier } from '../calculations.js';
import { showToast } from '../ui.js';
import { COMBAT_ATTRS, MAX_DICE, rollTest, getComputedStats, evaluateFormula, formulaNeedsHab } from './engine.js';

// =============================================
// CONSTANTES DE UI
// =============================================

var HISTORY_LIMIT = 20;     // últimas N rolagens

var COMBAT_LABELS = {
  STR: 'Força (STR)', MAG: 'Magia (MAG)', TEC: 'Técnica (TEC)',
  AGI: 'Agilidade (AGI)', VIT: 'Vitalidade (VIT)', LCK: 'Sorte (LCK)'
};

/** Escapa HTML para evitar injeção via strings do jogador (fórmulas etc.). */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
    var FORMULA_TAGS = { damage: 'Dano', heal: 'Cura', pm: 'PM', percent: '%', generic: 'Fórmula' };
    var tag = h.kind === 'test' ? 'Teste' : (h.kind === 'formula' ? (FORMULA_TAGS[h.type] || 'Fórmula') : 'Dano');
    var totalStr = (h.kind === 'formula' && h.type === 'percent') ? (h.total + '%') : h.total;
    var lines = '';
    if (h.kind === 'test') {
      lines =
        '<div class="dice-hist-line">1d20: <b>' + esc(h.die) + '</b>' +
          (h.attribute != null ? ' · ' + esc(h.attrLabel || 'atributo') + ': +' + esc(h.attribute) : '') +
          (h.extra ? ' · extra: ' + (h.extra >= 0 ? '+' : '') + esc(h.extra) : '') +
          (h.tier != null ? ' · Tier: ' + ['0','I','II','III','IV','V'][h.tier] : '') + '</div>' +
        (h.crit ? '<div class="dice-hist-flag dice-flag-crit">Crítico!</div>' : '') +
        (h.fail ? '<div class="dice-hist-flag dice-flag-fail">Falha crítica!</div>' : '');
    } else if (h.kind === 'formula') {
      var groups = h.diceGroups || [];
      var diceLine = groups.length
        ? groups.map(function(g) { return g.label + ' → ' + (g.rolls && g.rolls.length ? g.rolls.join(', ') : '—'); }).join(' | ')
        : '';
      lines =
        (h.usedHab ? '<div class="dice-hist-line">HAB = ' + esc(h.usedHab) + '</div>' : '') +
        (h.resolved ? '<div class="dice-hist-line">' + esc(h.resolved) + '</div>' : '') +
        (diceLine ? '<div class="dice-hist-line">Dados: ' + esc(diceLine) + '</div>' : '') +
        '<div class="dice-hist-line">' +
          (groups.length ? 'Soma dados: <b>' + esc(h.diceSum) + '</b>' : 'Valor') +
          (h.bonus ? ' · bônus: ' + (h.bonus >= 0 ? '+' : '') + esc(h.bonus) : '') + '</div>';
    } else {
      // compat: histórico antigo (kind 'damage')
      var diceStr = (h.dice && h.dice.length) ? h.dice.join(', ') : '—';
      lines =
        '<div class="dice-hist-line">Dados (' + esc(h.quantity) + 'd' + esc(h.sides) + '): ' + esc(diceStr) + '</div>' +
        '<div class="dice-hist-line">Soma: <b>' + esc(h.diceSum) + '</b>' +
          (h.extra ? ' · extra: ' + (h.extra >= 0 ? '+' : '') + esc(h.extra) : '') + '</div>';
    }
    return '<div class="' + cls + '">' +
      '<div class="dice-hist-head">' +
        '<span class="dice-hist-tag">' + esc(tag) + '</span>' +
        '<span class="dice-hist-formula">' + esc(h.label) + '</span>' +
        '<span class="dice-hist-total">' + esc(totalStr) + '</span>' +
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

// =============================================
// ROLAGEM RÁPIDA POR CLIQUE (nome do atributo / habilidade)
// Atualiza somente o display minimalista #last-roll.
// Não altera fórmulas, cálculos nem o painel avançado de dados.
// =============================================

/** Renderiza o resultado minimalista no card "Última Rolagem". */
function showLastRoll(name, attrValue, res) {
  var out = document.getElementById('last-roll');
  if (!out) return;
  out.className = 'last-roll' + (res.crit ? ' is-crit' : res.fail ? ' is-fail' : '');
  var flag = res.crit ? '<div class="last-roll-flag last-roll-flag--crit">Crítico!</div>'
           : res.fail ? '<div class="last-roll-flag last-roll-flag--fail">Falha crítica!</div>' : '';
  var sign = attrValue >= 0 ? ' + ' : ' - ';
  out.innerHTML =
    '<div class="last-roll-name">' + esc(name) + '</div>' +
    '<div class="last-roll-formula">1d20' + sign + esc(Math.abs(attrValue)) + '</div>' +
    flag +
    '<div class="last-roll-result">' +
      '<span class="last-roll-label">Resultado</span>' +
      '<strong class="last-roll-total">' + esc(res.total) + '</strong>' +
    '</div>';
}

/**
 * Rolagem rápida disparada pelo clique no nome de um atributo/habilidade.
 * Combate: 1d20 + atributo final (com modificadores).
 * Social:  1d20 + pontos atuais (Tier é apenas informativo).
 * @param {string} category - 'combat' | 'social'
 * @param {string} attrKey  - 'STR'.. ou 'KNOPts'..
 * @returns {object} resultado do teste
 */
export function rollQuick(category, attrKey) {
  var name, attrValue, tier = null;
  if (category === 'social') {
    var meta = SOCIAL_SKILL_META[attrKey];
    name = meta ? meta.name : attrKey;
    attrValue = Math.trunc(Number(state[attrKey]) || 0);
    tier = calcSocialTier(state[attrKey] || 0);
  } else {
    var stats = getComputedStats();
    name = attrKey;
    attrValue = Math.trunc(Number(stats[attrKey]) || 0);
  }
  var res = rollTest(attrValue, 0);
  var label = (category === 'social')
    ? name + ' — 1d20 + ' + attrValue + ' (Tier ' + ['0','I','II','III','IV','V'][tier] + ')'
    : name + ' — 1d20 + ' + attrValue;
  addRollToHistory({
    kind: 'test', label: label, attrLabel: name,
    die: res.die, attribute: res.attribute, extra: res.extra,
    total: res.total, crit: res.crit, fail: res.fail,
    tier: tier
  });
  showLastRoll(name, attrValue, res);
  return res;
}

/**
 * Executa uma rolagem/cálculo a partir de uma fórmula flexível e registra no histórico.
 * Usada pela UI, pelos botões de magia e pelo botão de arma.
 * @param {string} formula - ex.: 'MAGd8 + MAG', 'HABd10 + HAB + 5', 'Recupera MAGd8 + PNv * 4 PV', '50 + 5TEC%'
 * @param {number} extraBonus - bônus extra opcional
 * @param {string} sourceLabel - rótulo de origem (ex.: nome da magia/arma)
 * @param {string} habAttr - atributo escolhido para HAB (se a fórmula usar HAB)
 * @returns {object} resultado ou { ok:false }
 */
export function performDamageRoll(formula, extraBonus, sourceLabel, habAttr) {
  var res = evaluateFormula(formula, {
    extra: extraBonus,
    habAttr: habAttr,
    defaultType: 'damage'
  });
  if (!res.ok) {
    if (res.needsHab) { showToast('Escolha o atributo para HAB antes de rolar.', 'info', 3500); return res; }
    showToast(res.error, 'error', 4000);
    return res;
  }
  if (res.limited) {
    showToast('Quantidade de dados limitada a ' + MAX_DICE + ' por segurança.', 'info', 3500);
  }
  _recordFormulaRoll(res, sourceLabel);
  showFormulaResult(res, sourceLabel ? (sourceLabel + ' — ') : '');
  return res;
}

/** Registra o resultado de uma fórmula no histórico geral (state.rollHistory). */
function _recordFormulaRoll(res, sourceLabel) {
  var prefix = sourceLabel ? (sourceLabel + ' — ') : '';
  addRollToHistory({
    kind: 'formula',
    type: res.type,
    label: prefix + res.label,
    resolved: res.resolved,
    usedHab: res.usedHab || null,
    diceGroups: res.diceGroups,
    diceSum: res.diceSum,
    bonus: res.bonus,
    extra: res.extra,
    total: res.total
  });
}

/**
 * Rola/calcula uma fórmula de origem específica (magia/técnica), registra no
 * histórico geral e RETORNA o resultado estruturado para exibição no card.
 * Não atualiza o painel geral #dice-result.
 * @param {string} formula
 * @param {string} sourceLabel - nome da magia/técnica (rótulo do histórico)
 * @param {string} habAttr - atributo escolhido para HAB (se necessário)
 * @returns {object} resultado (ok:true) ou { ok:false, error, needsHab? }
 */
export function rollSpellFormula(formula, sourceLabel, habAttr) {
  var res = evaluateFormula(formula, { habAttr: habAttr, defaultType: 'damage' });
  if (!res.ok) return res; // { ok:false, error, needsHab? } — o card exibe o erro
  if (res.limited) {
    showToast('Quantidade de dados limitada a ' + MAX_DICE + ' por segurança.', 'info', 3500);
  }
  _recordFormulaRoll(res, sourceLabel);
  return res;
}

/**
 * Rolagem/cálculo de conveniência para fontes externas (arma).
 * Se a fórmula usar HAB, encaminha para o painel de dados para escolha do atributo.
 * @param {string} formula
 * @param {string} sourceLabel
 */
export function rollDamage(formula, sourceLabel) {
  if (formulaNeedsHab(formula)) {
    _routeFormulaToPanel(formula, sourceLabel);
    return { ok: false, needsHab: true };
  }
  return performDamageRoll(formula, 0, sourceLabel, null);
}

/** Encaminha uma fórmula com HAB para o painel de dados (escolha de atributo). */
function _routeFormulaToPanel(formula, sourceLabel) {
  var tabBtn = document.querySelector('.tab[data-view="acessorapido"]');
  if (tabBtn) tabBtn.click();
  var typeSel = document.getElementById('dice-type');
  var formEl  = document.getElementById('dice-formula');
  if (typeSel) { typeSel.value = 'damage'; typeSel.dispatchEvent(new Event('change')); }
  if (formEl)  { formEl.value = formula; formEl.dispatchEvent(new Event('input')); }
  var card = document.getElementById('dice-card');
  if (card && card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Escolha o atributo para HAB e clique em Rolar' + (sourceLabel ? ' (' + sourceLabel + ')' : '') + '.', 'info', 4500);
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

/** Renderiza o resultado detalhado de uma rolagem/cálculo de fórmula. */
function showFormulaResult(res) {
  var out = document.getElementById('dice-result');
  if (!out) return;
  out.className = 'dice-result';

  var HEADERS = { damage: 'Dano', heal: 'Recuperação', pm: 'Recuperação', percent: 'Efeito Percentual', generic: 'Resultado' };
  var header = HEADERS[res.type] || 'Resultado';
  var groups = res.diceGroups || [];
  var diceRolled = groups.length ? groups.map(function(g) { return g.label; }).join(' + ') : '';
  var allDice = groups.length ? groups.map(function(g) { return g.rolls.join(', ') || '—'; }).join(' | ') : '';

  var totalLine;
  if (res.type === 'heal') totalLine = 'Total recuperado: <b>' + esc(res.total) + '</b> PV';
  else if (res.type === 'pm') totalLine = 'Total recuperado: <b>' + esc(res.total) + '</b> PM';
  else if (res.type === 'percent') totalLine = 'Resultado: <b>' + esc(res.total) + '%</b>';
  else totalLine = 'Total: <b>' + esc(res.total) + '</b>';

  var html = '<div class="dice-result-formula">' + esc(header) + ' — ' + esc(res.label) + '</div>';
  if (res.usedHab) {
    html += '<div class="dice-result-lines"><span>HAB escolhido: <b>' + esc(res.usedHab) + '</b></span></div>';
  }
  html += '<div class="dice-result-lines"><span>Interpretada: ' + esc(res.resolved) + '</span></div>';
  if (diceRolled) {
    html += '<div class="dice-result-lines"><span>Rolagem: ' + esc(diceRolled) + '</span></div>' +
            '<div class="dice-result-dice">Dados: ' + esc(allDice) + '</div>' +
            '<div class="dice-result-lines">' +
              '<span>Soma dos dados: <b>' + esc(res.diceSum) + '</b></span>' +
              (res.bonus ? '<span>Bônus: ' + (res.bonus >= 0 ? '+' : '') + esc(res.bonus) + '</span>' : '') +
            '</div>';
  } else {
    html += '<div class="dice-result-lines"><span>Cálculo: ' + esc(res.resolved) + '</span></div>';
  }
  html += '<div class="dice-result-total">' + totalLine + '</div>';
  out.innerHTML = html;
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
          '<option value="damage">Fórmula (dano / cura / %)</option>' +
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
      '<div class="dice-field dice-field-wide" id="dice-formula-wrap" style="display:none;">' +
        '<label for="dice-formula">Fórmula</label>' +
        '<input id="dice-formula" placeholder="MAGd8 + MAG, HABd10 + HAB + 5, Recupera MAGd8 + PNv*4 PV, 50 + 5TEC%" autocomplete="off"/>' +
      '</div>' +
      '<div class="dice-field" id="dice-hab-wrap" style="display:none;">' +
        '<label for="dice-hab">Atributo p/ HAB</label>' +
        '<select id="dice-hab"></select>' +
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
  var habSel   = document.getElementById('dice-hab');
  var habWrap  = document.getElementById('dice-hab-wrap');

  if (!typeSel || !rollBtn) return;

  populateAttrSelect(attrSel, catSel ? catSel.value : 'combat');
  // Popula o seletor de HAB com os atributos de combate
  if (habSel) {
    habSel.innerHTML = '';
    COMBAT_ATTRS.forEach(function(a) {
      var opt = document.createElement('option');
      opt.value = a;
      opt.textContent = COMBAT_LABELS[a] || a;
      habSel.appendChild(opt);
    });
  }

  function refreshHab() {
    var isDamage = typeSel.value === 'damage';
    var needsHab = isDamage && formEl && formulaNeedsHab(formEl.value);
    if (habWrap) habWrap.style.display = needsHab ? '' : 'none';
  }

  function refreshMode() {
    var isDamage = typeSel.value === 'damage';
    if (catWrap)  catWrap.style.display  = isDamage ? 'none' : '';
    if (attrWrap) attrWrap.style.display = isDamage ? 'none' : '';
    if (formWrap) formWrap.style.display = isDamage ? '' : 'none';
    refreshHab();
  }
  refreshMode();

  typeSel.addEventListener('change', refreshMode);
  if (formEl) formEl.addEventListener('input', refreshHab);
  if (catSel) catSel.addEventListener('change', function() {
    populateAttrSelect(attrSel, catSel.value);
  });

  rollBtn.addEventListener('click', function() {
    var extra = Number(extraEl ? extraEl.value : 0) || 0;
    if (typeSel.value === 'damage') {
      var habAttr = (habSel && habWrap && habWrap.style.display !== 'none') ? habSel.value : null;
      performDamageRoll(formEl ? formEl.value : '', extra, '', habAttr);
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
