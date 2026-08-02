// =============================================
// CÁLCULOS PUROS DO SISTEMA
// Depende de: state.js, constants.js, utils.js
// =============================================

import { state } from './state.js';
import {
  MOD_TARGETS, CONDITIONS_LIST, SOCIAL_IDS, SOCIAL_EFFECTS, SOCIAL_SKILL_META,
  SOCIAL_ATTR_TO_ID, CHOICE_VALUE_TO_ATTR
} from './constants.js';
import { clampInt } from './utils.js';
import { getArcanaInfo } from './data/awakening-data.js';
import { getNaturalAbilities } from './data/natural-abilities-data.js';

/**
 * Aplica modificadores sobre valores base.
 * @param {object} baseValues - {STR, MAG, TEC, AGI, VIT, LCK, HP, PM}
 * @param {Array} modifiers - lista de {nome, tipo, valor, alvo, ativo}
 * @param {Array} [targets] - lista de alvos válidos (default: MOD_TARGETS)
 * @returns {object} valores modificados
 */
export function applyModifiers(baseValues, modifiers, targets) {
  targets = targets || MOD_TARGETS;
  var result = {};
  targets.forEach(function(t) { result[t] = baseValues[t] || 0; });
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
  targets.forEach(function(t) { if (result[t] < 0) result[t] = 0; });
  return result;
}

/** Verifica se um feito está ativo no state. */
export function feitoIsActive(id) {
  return !!(state.feitos || []).find(function(f) { return f.id === id && f.ativo !== false; });
}

/**
 * Calcula modificadores automáticos derivados de equipamentos.
 * Itens de inventário podem ter campos opcionais de bônus:
 *   bonusAlvo (STR/MAG/.../HP/PM), bonusTipo ('flat'|'percentual'),
 *   bonusValor (número), bonusAtivo (boolean).
 * Retorna array no mesmo formato de state.modifiers.
 * NUNCA modifica state.equip.
 */
export function computeEquipModifiers() {
  var mods = [];
  (state.equip || []).forEach(function(item) {
    if (!item || !item.bonusAtivo) return;
    var alvo = item.bonusAlvo;
    var valor = Number(item.bonusValor) || 0;
    if (!alvo || MOD_TARGETS.indexOf(alvo) === -1 || valor === 0) return;
    mods.push({
      nome: (item.nome || 'Equipamento') + ' (' + alvo + ')',
      tipo: item.bonusTipo === 'percentual' ? 'percentual' : 'flat',
      valor: valor,
      alvo: alvo,
      ativo: true
    });
  });
  return mods;
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
 * Calcula modificadores automáticos derivados das Habilidades Naturais da
 * Arcana selecionada (state.PerArcana).
 *
 * Normaliza as diferentes formas de mecânica (mechanic{}) em modificadores:
 *  • Vida máx.: mechanic.maxHPPercentBonus / mechanic.effect==='maxHPMultiplier'
 *    → modificador percentual em HP.
 *  • Atributos (sociais e VIT): mechanic.attribute (string ou array) + value,
 *    ou as chaves nomeadas disciplineBonus / charmBonus / initialCourageBonus,
 *    ou mechanic.attributeBonus combinado a um bloco 'choice' (o atributo é lido
 *    de state.naturalAbilityConfig[arcanaKey][configKey]) → modificador flat.
 *
 * Os alvos sociais (Conhecimento, Disciplina, Empatia, Expressão, Coragem,
 * Charme) são tratados como alvos de modificador (ver SOCIAL_IDS): o bônus soma
 * aos pontos efetivos e conta para o Tier.
 *
 * NUNCA modifica os dados estáticos das Arcanas.
 * Retorna array no mesmo formato de state.modifiers.
 */
export function computeNaturalAbilityModifiers() {
  var mods = [];
  var info = getArcanaInfo(state.PerArcana);
  if (!info) return mods;
  var pack = getNaturalAbilities(info.key);
  if (!pack || !Array.isArray(pack.abilities)) return mods;

  var arcanaLabel = info.display || info.name;
  var cfg = (state.naturalAbilityConfig && state.naturalAbilityConfig[info.key]) || {};
  var hpPercent = 0;

  // Acumula bônus flat por alvo (ex.: DISPts +2 de duas habilidades → +4).
  function pushAttrBonus(attrName, value) {
    if (!attrName || !value) return;
    var alvo = SOCIAL_ATTR_TO_ID[attrName];
    if (!alvo) return;
    mods.push({
      nome:  'Arcana ' + arcanaLabel + ' (' + attrName + ')',
      tipo:  'flat',
      valor: value,
      alvo:  alvo,
      ativo: true
    });
  }

  pack.abilities.forEach(function(ab) {
    var mech = ab && ab.mechanic;
    if (!mech) return;

    // --- Vida máxima (percentual) ---
    if (typeof mech.maxHPPercentBonus === 'number') hpPercent += mech.maxHPPercentBonus;
    if (mech.effect === 'maxHPMultiplier' && typeof mech.value === 'number') hpPercent += mech.value;

    // --- Atributos: mechanic.attribute (string|array) + value ---
    if (mech.attribute && typeof mech.value === 'number') {
      var attrs = Array.isArray(mech.attribute) ? mech.attribute : [mech.attribute];
      attrs.forEach(function(a) { pushAttrBonus(a, mech.value); });
    }

    // --- Atributos: chaves nomeadas ---
    if (typeof mech.disciplineBonus === 'number') pushAttrBonus('Disciplina', mech.disciplineBonus);
    if (typeof mech.charmBonus === 'number') pushAttrBonus('Charme', mech.charmBonus);
    if (typeof mech.initialCourageBonus === 'number') pushAttrBonus('Coragem', mech.initialCourageBonus);

    // --- Atributos: escolha do jogador (attributeBonus + bloco choice) ---
    if (typeof mech.attributeBonus === 'number' && Array.isArray(ab.blocks)) {
      var choice = ab.blocks.find(function(b) { return b.kind === 'choice' && b.configKey; });
      if (choice) {
        var chosen = cfg[choice.configKey];
        var attrName = chosen && CHOICE_VALUE_TO_ATTR[chosen];
        if (attrName) pushAttrBonus(attrName, mech.attributeBonus);
      }
    }
  });

  if (hpPercent !== 0) {
    mods.push({
      nome: 'Arcana ' + arcanaLabel + ' (Vida máx.)',
      tipo: 'percentual',
      valor: hpPercent,
      alvo: 'HP',
      ativo: true
    });
  }
  return mods;
}

/**
 * Bônus de PM derivado de Habilidades Naturais que concedem
 * "PM bônus = soma de atributos" (ex.: Hierofante — Conhecimento + Charme).
 * Depende dos pontos sociais EFETIVOS, por isso é calculado à parte,
 * após o cálculo de socialEff em recalcState().
 * @param {object} socialEff - pontos sociais efetivos por id
 * @returns {Array} modificadores no formato de state.modifiers
 */
export function computeNaturalPMBonus(socialEff) {
  var mods = [];
  var info = getArcanaInfo(state.PerArcana);
  if (!info) return mods;
  var pack = getNaturalAbilities(info.key);
  if (!pack || !Array.isArray(pack.abilities)) return mods;

  var arcanaLabel = info.display || info.name;

  pack.abilities.forEach(function(ab) {
    var mech = ab && ab.mechanic;
    if (!mech || !Array.isArray(mech.bonusPM)) return;
    var total = 0;
    mech.bonusPM.forEach(function(attrName) {
      var alvo = SOCIAL_ATTR_TO_ID[attrName];
      if (!alvo) return;
      if (SOCIAL_IDS.indexOf(alvo) >= 0) {
        total += (socialEff && socialEff[alvo] !== undefined)
          ? socialEff[alvo]
          : Math.max(0, Number(state[alvo]) || 0);
      }
    });
    if (total > 0) {
      mods.push({
        nome:  'Arcana ' + arcanaLabel + ' (PM bônus)',
        tipo:  'flat',
        valor: total,
        alvo:  'PM',
        ativo: true
      });
    }
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
export function computeSocialModifiers(socialValues) {
  var mods = [];
  SOCIAL_IDS.forEach(function(skillId) {
    var pts  = socialValues ? (socialValues[skillId] || 0) : (state[skillId] || 0);
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
export function computeSocialEffects(socialValues) {
  var result = [];
  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V'];
  SOCIAL_IDS.forEach(function(skillId) {
    var pts  = socialValues ? (socialValues[skillId] || 0) : (state[skillId] || 0);
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
  // Combina modificadores na ordem de cálculo definida:
  // 1) equipamentos → 2) feitos automáticos → 3) Habilidades Naturais →
  // 4) habilidades sociais → 5) modificadores globais
  var equipMods   = computeEquipModifiers();
  var feitoMods   = computeFeitoModifiers();
  var naturalMods = computeNaturalAbilityModifiers();

  // --- Pontos sociais EFETIVOS ---
  // base (pontos comprados) + modificadores que miram habilidades sociais
  // (Habilidades Naturais, equipamentos, feitos, modificadores globais).
  // O orçamento (pontos restantes) continua baseado apenas nos pontos comprados.
  var socialBase = {};
  SOCIAL_IDS.forEach(function(id) { socialBase[id] = clampInt(state[id] || 0, 0, 999); });
  var socialTargetMods = equipMods
    .concat(feitoMods)
    .concat(naturalMods)
    .concat(state.modifiers || [])
    .filter(function(m) { return SOCIAL_IDS.indexOf(m.alvo) >= 0; });
  var socialEff = applyModifiers(socialBase, socialTargetMods, SOCIAL_IDS);

  // Efeitos automáticos de Tier (HP/PM/…) usam os pontos EFETIVOS.
  var socialMods  = computeSocialModifiers(socialEff);
  // Bônus de PM que dependem de atributos sociais efetivos
  // (ex.: Hierofante — PM bônus = Conhecimento + Charme).
  var naturalPMMods = computeNaturalPMBonus(socialEff);
  var allMods = equipMods
    .concat(feitoMods)
    .concat(naturalMods)
    .concat(naturalPMMods)
    .concat(socialMods)
    .concat(state.modifiers || []);
  var modded = applyModifiers(baseVals, allMods);

  state.MaxHP = modded.HP;
  state.EnergyMax = modded.PM;
  state._computed = {
    baseVals: baseVals,
    modded: modded,
    equipMods: equipMods,
    feitoMods: feitoMods,
    naturalMods: naturalMods.concat(naturalPMMods),
    socialMods: socialMods,
    socialBase: socialBase,
    socialEff: socialEff,
    movement: computeMovement(modded),
    conditionAlerts: computeConditionAlerts(),
    socialEffects: computeSocialEffects(socialEff),
    flags: {
      rdUniversal:   feitoIsActive('prodigio_protecao'),
      tecReplaceAgi: feitoIsActive('prodigio_defesa')
    }
  };
}

/**
 * Retorna os pontos EFETIVOS de uma habilidade social (base + modificadores).
 * Usado por render/rolagens. Faz fallback para os pontos-base se o recálculo
 * ainda não tiver populado state._computed.socialEff.
 */
export function getEffectiveSocial(skillId) {
  var eff = state._computed && state._computed.socialEff;
  if (eff && eff[skillId] !== undefined) return eff[skillId];
  return Math.max(0, Number(state[skillId]) || 0);
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
