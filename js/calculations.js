// =============================================
// CÁLCULOS PUROS DO SISTEMA
// Depende de: state.js, constants.js, utils.js
// =============================================

import { state } from './state.js';
import {
  MOD_TARGETS, CONDITIONS_LIST, SOCIAL_IDS, SOCIAL_EFFECTS, SOCIAL_SKILL_META
} from './constants.js';
import { clampInt } from './utils.js';

/**
 * Aplica modificadores sobre valores base.
 * @param {object} baseValues - {STR, MAG, TEC, AGI, VIT, LCK, HP, PM}
 * @param {Array} modifiers - lista de {nome, tipo, valor, alvo, ativo}
 * @returns {object} valores modificados
 */
export function applyModifiers(baseValues, modifiers) {
  var result = {};
  MOD_TARGETS.forEach(function(t) { result[t] = baseValues[t] || 0; });
  var actives = (modifiers || []).filter(function(m) { return m.ativo && m.valor !== 0; });
  // Flat primeiro
  actives.filter(function(m) { return m.tipo === 'flat'; }).forEach(function(m) {
    if (result[m.alvo] !== undefined) result[m.alvo] += m.valor;
  });
  // Percentual depois
  actives.filter(function(m) { return m.tipo === 'percentual'; }).forEach(function(m) {
    if (result[m.alvo] !== undefined) result[m.alvo] = Math.round(result[m.alvo] * (1 + m.valor / 100));
  });
  // Clamp mínimo 0
  MOD_TARGETS.forEach(function(t) { if (result[t] < 0) result[t] = 0; });
  return result;
}

/** Verifica se um feito está ativo no state. */
export function feitoIsActive(id) {
  return !!(state.feitos || []).find(function(f) { return f.id === id && f.ativo !== false; });
}

/**
 * Calcula modificadores automáticos derivados de Feitos ativos.
 * Retorna array no mesmo formato de state.modifiers.
 * NUNCA modifica state.modifiers — lista separada que é combinada no recalcState.
 */
export function computeFeitoModifiers() {
  var mods = [];
  var lvl = clampInt(state.CharLvl || 1, 1, 99);

  // Longe do Fim: +5 PM por nível
  if (feitoIsActive('longe_do_fim')) {
    mods.push({ nome: 'Longe do Fim', tipo: 'flat', valor: 5 * lvl, alvo: 'PM', ativo: true });
  }

  // Hábil: usa feitoConfig para bônus configurados pelo jogador
  var habilConfigs = (state.feitoConfig && state.feitoConfig.habil) || [];
  habilConfigs.forEach(function(cfg) {
    if (!cfg || !cfg.alvo || !cfg.valor) return;
    mods.push({ nome: 'Hábil (' + cfg.alvo + ')', tipo: 'flat', valor: Number(cfg.valor) || 0, alvo: cfg.alvo, ativo: true });
  });

  return mods;
}

/**
 * Calcula o movimento do personagem em metros.
 * Considera Atleta (STR ao invés de AGI), Prodígio em Corrida (×2) e condição Lento (÷2).
 */
export function computeMovement(moddedStats) {
  var iAtleta  = feitoIsActive('atleta');
  var iCorrida = feitoIsActive('prodigio_corrida');
  var iLento   = !!(state.conditions || []).find(function(c) { return c.id === 'lento' && c.ativa !== false; });
  var base  = iAtleta ? (moddedStats.STR + 3) : (moddedStats.AGI + 3);
  var final = iCorrida ? base * 2 : base;
  if (iLento) final = Math.floor(final / 2);
  return { base: base, final: final, doubled: iCorrida, halved: iLento };
}

/**
 * Retorna alertas mecânicos das condições ativas para exibição na ficha.
 */
export function computeConditionAlerts() {
  var EFFECTS = {
    charme:    ['Personagem sob controle do Narrador', 'Recuperação: 33%'],
    panico:    ['Sem uso de Persona ou habilidades especiais', 'Recuperação: 33%'],
    medo:      ['Desvantagem nas esquivas (2 dados, pior)', 'Recuperação: 33% — se falhar: perde uso de magia ou 1 PM'],
    furia:     ['Dano físico causado e recebido +50%', 'Desvantagem no ataque (2 dados, pior)', 'Recuperação: 33%'],
    atordoado: ['Desvantagem na esquiva (2 dados, pior)', 'Sem Ações Livres, Rápidas ou de Interromper', 'Recuperação: 33%'],
    choque:    ['Ataques recebidos acertam automaticamente', 'Ataques contra você: vantagem para crítico', 'Recupera automaticamente no fim do turno'],
    lento:     ['Movimento reduzido à metade (automático)', 'Desvantagem no ataque (2 dados, pior)', 'Recuperação: 33%'],
    veneno:    ['Perde 20% do PV máximo por turno', 'Recuperação: 33%'],
    derrubado: ['Esquiva: 3 dados, pega o pior', 'Recupera no fim do turno ou por aliado (ação de movimento)']
  };
  var alerts = [];
  (state.conditions || []).forEach(function(c) {
    if (c.ativa === false) return;
    var meta = CONDITIONS_LIST.find(function(x) { return x.id === c.id; });
    var effects = EFFECTS[c.id] || [];
    if (meta) alerts.push({ id: c.id, name: meta.name, effects: effects });
  });
  return alerts;
}

/**
 * Calcula o tier de uma habilidade social a partir de seus pontos.
 * Fórmula: min(5, floor(pts / 5))
 */
export function calcSocialTier(pts) {
  return Math.min(5, Math.floor(Math.max(0, pts || 0) / 5));
}

/**
 * Retorna modificadores automáticos derivados de todas as habilidades sociais.
 * Os tiers são acumulativos: tier atual inclui todos os tiers anteriores.
 * Retorna array no mesmo formato de state.modifiers.
 */
export function computeSocialModifiers() {
  var mods = [];
  SOCIAL_IDS.forEach(function(skillId) {
    var pts  = state[skillId] || 0;
    var tier = calcSocialTier(pts);
    var effects = SOCIAL_EFFECTS[skillId];
    if (!effects) return;
    // Acumula do tier 0 até o tier atual
    for (var t = 0; t <= tier; t++) {
      var entry = effects[t];
      if (!entry || !entry.auto) continue;
      entry.auto.forEach(function(eff) {
        mods.push({
          nome:  eff.label || (SOCIAL_SKILL_META[skillId].name + ' T' + t),
          tipo:  eff.tipo  || 'flat',
          valor: eff.valor || 0,
          alvo:  eff.alvo,
          ativo: true
        });
      });
    }
  });
  return mods;
}

/**
 * Retorna todos os efeitos desbloqueados (automáticos + manuais) de todas as
 * habilidades sociais, organizados por habilidade e tier.
 * Usado apenas para exibição — não afeta cálculos.
 */
export function computeSocialEffects() {
  var result = [];
  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V'];
  SOCIAL_IDS.forEach(function(skillId) {
    var pts  = state[skillId] || 0;
    var tier = calcSocialTier(pts);
    if (tier === 0) {
      var e0 = SOCIAL_EFFECTS[skillId] && SOCIAL_EFFECTS[skillId][0];
      var hasContent = e0 && ((e0.auto && e0.auto.length) || (e0.manual && e0.manual.length));
      if (!hasContent) return; // sem nada a mostrar no tier 0
    }
    var meta = SOCIAL_SKILL_META[skillId];
    var skillEntry = { id: skillId, name: meta.name, tier: tier, tierRoman: ROMAN[tier], tiers: [] };
    for (var t = 1; t <= tier; t++) {
      var effects = SOCIAL_EFFECTS[skillId][t];
      if (!effects) continue;
      var hasAuto   = effects.auto   && effects.auto.length   > 0;
      var hasManual = effects.manual && effects.manual.length > 0;
      if (!hasAuto && !hasManual) continue;
      skillEntry.tiers.push({
        tier:     t,
        roman:    ROMAN[t],
        title:    meta.titles[t] || '',
        auto:     effects.auto   || [],
        manual:   effects.manual || [],
        isCurrent: (t === tier)
      });
    }
    if (skillEntry.tiers.length > 0) result.push(skillEntry);
  });
  return result;
}

/**
 * Recalcula HP/PM máximos e valores de badges a partir do state.
 * Escreve diretamente em state.MaxHP, state.EnergyMax, state._computed.
 */
export function recalcState() {
  var lvl = clampInt(state.CharLvl || 1, 1, 99);
  var vit = clampInt(state.CharVIT || 1, 1, 12);
  var mag = clampInt(state.CharMAG || 1, 1, 12);

  // HP: 25 + ((5 + VIT) * Nível)
  var baseHP = 25 + ((5 + vit) * lvl);
  // PM: 15 + ((MAG + 5) * 2) + ((Nível - 1) * 5)
  var basePM = 15 + ((mag + 5) * 2) + ((lvl - 1) * 5);

  var baseVals = {
    STR: clampInt(state.CharSTR || 1, 1, 12),
    MAG: mag,
    TEC: clampInt(state.CharTEC || 1, 1, 12),
    AGI: clampInt(state.CharAGI || 1, 1, 12),
    VIT: vit,
    LCK: clampInt(state.CharLCK || 1, 1, 12),
    HP: baseHP,
    PM: basePM
  };
  // Combina modificadores do jogador + modificadores automáticos de feitos + habilidades sociais
  var feitoMods  = computeFeitoModifiers();
  var socialMods = computeSocialModifiers();
  var allMods = (state.modifiers || []).concat(feitoMods).concat(socialMods);
  var modded = applyModifiers(baseVals, allMods);

  state.MaxHP = modded.HP;
  state.EnergyMax = modded.PM;
  state._computed = {
    baseVals: baseVals,
    modded: modded,
    feitoMods: feitoMods,
    socialMods: socialMods,
    movement: computeMovement(modded),
    conditionAlerts: computeConditionAlerts(),
    socialEffects: computeSocialEffects(),
    flags: {
      rdUniversal:   feitoIsActive('prodigio_protecao'),
      tecReplaceAgi: feitoIsActive('prodigio_defesa')
    }
  };
}

/**
 * Garante que os valores de HP/PM são válidos (não NaN, dentro dos limites).
 */
export function validateState() {
  state.MaxHP = Math.max(0, Math.trunc(state.MaxHP || 0));
  state.CurrentHP = Math.max(0, Math.min(Math.trunc(state.CurrentHP || 0), state.MaxHP));
  state.EnergyMax = Math.max(0, Math.trunc(state.EnergyMax || 0));
  state.CurrentPM = Math.max(0, Math.min(Math.trunc(state.CurrentPM || 0), state.EnergyMax));
}
