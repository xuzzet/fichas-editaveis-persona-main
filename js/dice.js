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
// MOTOR DE FÓRMULAS FLEXÍVEIS
// Interpreta expressões com dados, atributos, níveis, HAB,
// multiplicação, porcentagem e texto narrativo. Sem eval().
// =============================================

// Aliases de atributos aceitos (HAB é tratado à parte).
var ATTR_ALIAS = {
  STR: 'STR', MAG: 'MAG', TEC: 'TEC', AGI: 'AGI', VIT: 'VIT', LCK: 'LCK',
  FOR: 'STR', SOR: 'LCK'
};
// Palavras-chave reconhecidas (as mais longas primeiro para casar corretamente).
var FORMULA_KEYWORDS = ['PNV', 'CNV', 'HAB', 'FOR', 'SOR', 'STR', 'MAG', 'TEC', 'AGI', 'VIT', 'LCK', 'NV'];

function _isLetter(c) { return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z'); }
function _isDigit(c) { return c >= '0' && c <= '9'; }

/**
 * Tokeniza uma fórmula flexível, ignorando texto narrativo.
 * Tokens: {t:'num',v} {t:'attr',name} {t:'var',name}
 *         {t:'dice',qtyKind:'num'|'attr',qty|attrName,sides} {t:'op',v} {t:'pct'}
 */
function _tokenize(str) {
  var s = String(str || '');
  var up = s.toUpperCase();
  var n = s.length;
  var tokens = [];
  var i = 0;
  while (i < n) {
    var c = s[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === '+' || c === '-' || c === '*' || c === '(' || c === ')') { tokens.push({ t: 'op', v: c }); i++; continue; }
    if (c === '%') { tokens.push({ t: 'pct' }); i++; continue; }

    if (_isDigit(c)) {
      var num = '';
      while (i < n && _isDigit(s[i])) { num += s[i]; i++; }
      // dado numérico? Ex.: 3d6
      var j = i; while (j < n && s[j] === ' ') j++;
      if (j < n && (s[j] === 'd' || s[j] === 'D')) {
        var k = j + 1; while (k < n && s[k] === ' ') k++;
        if (k < n && _isDigit(s[k])) {
          var sd = ''; while (k < n && _isDigit(s[k])) { sd += s[k]; k++; }
          tokens.push({ t: 'dice', qtyKind: 'num', qty: parseInt(num, 10), sides: parseInt(sd, 10) });
          i = k; continue;
        }
      }
      tokens.push({ t: 'num', v: parseInt(num, 10) });
      continue;
    }

    if (_isLetter(c)) {
      var matched = false;
      for (var w = 0; w < FORMULA_KEYWORDS.length; w++) {
        var kw = FORMULA_KEYWORDS[w];
        if (up.substr(i, kw.length) !== kw) continue;
        var after = i + kw.length;
        var afterChar = after < n ? s[after] : '';
        var isAttrKw = (kw === 'HAB') || !!ATTR_ALIAS[kw];
        // forma de dado: ATRIBUTOdNÚMERO
        if (isAttrKw) {
          var p = after; while (p < n && s[p] === ' ') p++;
          if (p < n && (s[p] === 'd' || s[p] === 'D')) {
            var q = p + 1; while (q < n && s[q] === ' ') q++;
            if (q < n && _isDigit(s[q])) {
              var sd2 = ''; while (q < n && _isDigit(s[q])) { sd2 += s[q]; q++; }
              tokens.push({ t: 'dice', qtyKind: 'attr', attrName: (kw === 'HAB' ? 'HAB' : ATTR_ALIAS[kw]), sides: parseInt(sd2, 10) });
              i = q; matched = true; break;
            }
          }
        }
        // palavra-chave simples — rejeita se fizer parte de uma palavra maior
        if (!_isLetter(afterChar)) {
          if (kw === 'PNV' || kw === 'CNV' || kw === 'NV') tokens.push({ t: 'var', name: kw });
          else tokens.push({ t: 'attr', name: (kw === 'HAB' ? 'HAB' : ATTR_ALIAS[kw]) });
          i = after; matched = true; break;
        }
      }
      if (matched) continue;
      // texto narrativo: ignora a palavra inteira
      while (i < n && _isLetter(s[i])) i++;
      continue;
    }

    // qualquer outro caractere (pontuação etc.) é ignorado
    i++;
  }
  return tokens;
}

/** Resolve o valor final de um atributo (HAB usa o atributo escolhido). */
function _resolveAttrValue(name, stats, habAttr) {
  var a = (name === 'HAB') ? habAttr : name;
  if (!a) return null;
  return Math.max(0, Math.trunc(Number(stats[a]) || 0));
}

/** Aplica um operador binário sobre a pilha de saída (RPN). */
function _applyOp(stack, op) {
  var b = stack.length ? stack.pop() : 0;
  var a = stack.length ? stack.pop() : 0;
  if (op === '+') stack.push(a + b);
  else if (op === '-') stack.push(a - b);
  else if (op === '*') stack.push(a * b);
  else stack.push(0);
}

/** Classifica o tipo de resultado a partir do texto da fórmula. */
function _classifyType(str, def, hasPct) {
  if (hasPct) return 'percent';
  if (/\bPM\b/i.test(str)) return 'pm';
  if (/recupera|cura|\bPV\b/i.test(str)) return 'heal';
  if (/dano|causa/i.test(str)) return 'damage';
  return def || 'generic';
}

/** Indica se uma fórmula usa HAB (exige escolha de atributo). */
export function formulaNeedsHab(formula) {
  var toks = _tokenize(String(formula || ''));
  return toks.some(function(t) {
    return (t.t === 'attr' && t.name === 'HAB') ||
           (t.t === 'dice' && t.qtyKind === 'attr' && t.attrName === 'HAB');
  });
}

/**
 * Avalia uma fórmula flexível e (quando houver dados) rola-os.
 * @param {string} formula
 * @param {object} opts - { extra, habAttr, stats, defaultType }
 * @returns {object} resultado detalhado ou { ok:false, error, needsHab? }
 */
export function evaluateFormula(formula, opts) {
  opts = opts || {};
  var raw = String(formula == null ? '' : formula).trim();
  var ERR = 'Fórmula inválida. Use exemplos como MAGd8 + MAG, HABd10 + HAB + 5 ou Recupera MAGd8 + PNv * 4 PV.';
  if (!raw) return { ok: false, error: 'Informe uma fórmula. ' + ERR };

  var tokens = _tokenize(raw);
  if (!tokens.length) return { ok: false, error: ERR };

  var usesHab = tokens.some(function(t) {
    return (t.t === 'attr' && t.name === 'HAB') ||
           (t.t === 'dice' && t.qtyKind === 'attr' && t.attrName === 'HAB');
  });
  var habAttr = (opts.habAttr && ATTR_ALIAS[String(opts.habAttr).toUpperCase()])
    ? ATTR_ALIAS[String(opts.habAttr).toUpperCase()] : null;
  if (usesHab && !habAttr) return { ok: false, needsHab: true, error: 'Escolha um atributo para HAB antes de rolar.' };

  function isValue(tk) { return tk && (tk.t === 'num' || tk.t === 'attr' || tk.t === 'var' || tk.t === 'dice'); }

  // Multiplicação implícita entre valores adjacentes (ex.: 5TEC → 5 * TEC)
  var norm = [];
  for (var x = 0; x < tokens.length; x++) {
    var cur = tokens[x], prev = norm[norm.length - 1];
    if (isValue(cur) && prev && (isValue(prev) || (prev.t === 'op' && prev.v === ')'))) {
      norm.push({ t: 'op', v: '*' });
    }
    norm.push(cur);
  }
  // Sinal unário (+/- no início ou após operador/parêntese) → insere 0
  var norm2 = [];
  for (var y = 0; y < norm.length; y++) {
    var tk = norm[y], pv = norm2[norm2.length - 1];
    if (tk.t === 'op' && (tk.v === '+' || tk.v === '-')) {
      var atStart = !pv;
      var afterOp = pv && pv.t === 'op' && pv.v !== ')';
      if (atStart || afterOp) norm2.push({ t: 'num', v: 0 });
    }
    norm2.push(tk);
  }

  var stats = opts.stats || getComputedStats();
  var hasPct = tokens.some(function(t) { return t.t === 'pct'; });
  var diceGroups = [];
  var limited = false;

  // Pré-computa valores e rola cada grupo de dados uma única vez
  norm2.forEach(function(tk) {
    if (tk.t === 'dice') {
      var qty = tk.qtyKind === 'num' ? tk.qty : _resolveAttrValue(tk.attrName, stats, habAttr);
      qty = Math.max(0, Math.trunc(Number(qty) || 0));
      if (qty > MAX_DICE) { qty = MAX_DICE; limited = true; }
      var sides = Math.max(2, Math.trunc(Number(tk.sides) || 2));
      var rolls = rollDice(qty, sides);
      tk._qty = qty; tk._sides = sides; tk._rolls = rolls;
      tk._val = rolls.reduce(function(a, b) { return a + b; }, 0);
      diceGroups.push({ label: qty + 'd' + sides, qty: qty, sides: sides, rolls: rolls, sum: tk._val });
    } else if (tk.t === 'attr') {
      tk._val = _resolveAttrValue(tk.name, stats, habAttr) || 0;
    } else if (tk.t === 'var') {
      var lv = (tk.name === 'PNV') ? (state.PerLvl || 0) : (state.CharLvl || 0);
      tk._val = Math.trunc(Number(lv) || 0);
    } else if (tk.t === 'num') {
      tk._val = tk.v;
    }
  });

  // String interpretada (valores resolvidos, em ordem infixa)
  var resolved = norm2.map(function(tk) {
    if (tk.t === 'num' || tk.t === 'attr' || tk.t === 'var') return String(tk._val);
    if (tk.t === 'dice') return tk._qty + 'd' + tk._sides;
    if (tk.t === 'op') return tk.v;
    if (tk.t === 'pct') return '%';
    return '';
  }).join(' ').replace(/\s+/g, ' ').trim();

  // Shunting-yard → RPN → avaliação
  var outQ = [], opS = [];
  var prec = { '+': 1, '-': 1, '*': 2 };
  norm2.forEach(function(tk) {
    if (tk.t === 'pct') return;
    if (tk.t === 'num' || tk.t === 'attr' || tk.t === 'var' || tk.t === 'dice') { outQ.push(tk._val); return; }
    if (tk.t === 'op') {
      if (tk.v === '(') { opS.push('('); return; }
      if (tk.v === ')') {
        while (opS.length && opS[opS.length - 1] !== '(') _applyOp(outQ, opS.pop());
        if (opS.length) opS.pop();
        return;
      }
      while (opS.length && opS[opS.length - 1] !== '(' && prec[opS[opS.length - 1]] >= prec[tk.v]) {
        _applyOp(outQ, opS.pop());
      }
      opS.push(tk.v);
    }
  });
  while (opS.length) _applyOp(outQ, opS.pop());

  var total = outQ.length ? outQ[0] : 0;
  var extra = Math.trunc(Number(opts.extra) || 0);
  total = Math.round(total + extra);

  var diceSum = diceGroups.reduce(function(a, g) { return a + g.sum; }, 0);
  var bonus = total - diceSum;
  var type = _classifyType(raw, opts.defaultType, hasPct);

  return {
    ok: true,
    type: type,
    label: raw,
    resolved: resolved,
    usedHab: usesHab ? habAttr : null,
    diceGroups: diceGroups,
    diceSum: diceSum,
    bonus: bonus,
    extra: extra,
    total: total,
    limited: limited,
    isPercent: hasPct
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
