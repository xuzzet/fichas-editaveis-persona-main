// =============================================
// DADOS — MOTOR DE ROLAGEM (SYSTEMS)
// Logica pura: primitivas de rolagem, parser e motor de formulas.
// Sem DOM. Depende apenas de state.js.
// =============================================

import { state } from '../state.js';

// =============================================
// CONSTANTES
// =============================================

export var COMBAT_ATTRS = ['STR', 'MAG', 'TEC', 'AGI', 'VIT', 'LCK'];
export var DAMAGE_DICE = [4, 6, 8, 10, 12];
export var MAX_DICE = 50;          // limite de segurança

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
 * @param {string} [mode] - 'normal' | 'adv' (vantagem) | 'dis' (desvantagem)
 * @returns {object} { die, dice, mode, attribute, extra, total, crit, fail }
 */
export function rollTest(attributeValue, extraModifier, mode) {
  var attr = Math.trunc(Number(attributeValue) || 0);
  var extra = Math.trunc(Number(extraModifier) || 0);
  var die, dice;
  if (mode === 'adv' || mode === 'dis') {
    var a = rollDie(20), b = rollDie(20);
    die = (mode === 'adv') ? Math.max(a, b) : Math.min(a, b);
    dice = [a, b];
  } else {
    mode = 'normal';
    die = rollDie(20);
    dice = [die];
  }
  return {
    die: die,
    dice: dice,
    mode: mode,
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
