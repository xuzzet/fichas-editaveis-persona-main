// =============================================
// CÁLCULOS PUROS DO SISTEMA
// Depende de: state.js, constants.js, utils.js
// =============================================

import { state } from './state.js';
import {
  MOD_TARGETS, CONDITIONS_LIST, SOCIAL_IDS, SOCIAL_EFFECTS, SOCIAL_SKILL_META,
  SOCIAL_ATTR_TO_ID, CHOICE_VALUE_TO_ATTR, CONDITION_ROLL_EFFECTS
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

/**
 * Rótulos legíveis para cada origem de modificador (campo `source`).
 * Usado pela UI de detalhamento para mostrar de onde vem cada número.
 */
export var MOD_SOURCE_LABELS = {
  base:    'Base',
  equip:   'Equipamento',
  feito:   'Feito',
  arcana:  'Arcana',
  social:  'Habilidade Social',
  global:  'Modificador Global'
};

/**
 * Constrói o detalhamento ("de onde veio cada número") por alvo, reproduzindo
 * EXATAMENTE a mesma ordem de aplicação de applyModifiers (flats → percentuais,
 * arredondando e com clamp mínimo 0). Por isso `final` sempre coincide com o
 * valor retornado por applyModifiers para o mesmo alvo.
 *
 * @param {object} baseValues - valores base por alvo
 * @param {Array} modifiers - lista de modificadores (com source/kind opcionais)
 * @param {Array} [targets] - alvos a detalhar (default: MOD_TARGETS)
 * @returns {object} mapa alvo → { base, final, entries:[{nome,source,kind,tipo,valor,delta}] }
 */
export function buildBreakdown(baseValues, modifiers, targets) {
  targets = targets || MOD_TARGETS;
  var actives = (modifiers || []).filter(function(m) { return m.ativo && m.valor !== 0; });
  var breakdown = {};
  targets.forEach(function(t) {
    var base = baseValues[t] || 0;
    var running = base;
    var entries = [];
    // Flats primeiro (ordem irrelevante — soma é comutativa)
    actives.filter(function(m) { return m.alvo === t && m.tipo !== 'percentual'; }).forEach(function(m) {
      running += m.valor;
      entries.push({ nome: m.nome, source: m.source || 'global', kind: m.kind || 'temporario', tipo: 'flat', valor: m.valor, delta: m.valor });
    });
    // Percentuais depois (multiplicativos, aplicados sobre o subtotal com flats)
    actives.filter(function(m) { return m.alvo === t && m.tipo === 'percentual'; }).forEach(function(m) {
      var before = running;
      running = Math.round(running * (1 + m.valor / 100));
      entries.push({ nome: m.nome, source: m.source || 'global', kind: m.kind || 'temporario', tipo: 'percentual', valor: m.valor, delta: running - before });
    });
    if (running < 0) running = 0;
    breakdown[t] = { base: base, final: running, entries: entries };
  });
  return breakdown;
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
    var alvoValido = MOD_TARGETS.indexOf(alvo) !== -1 || SOCIAL_IDS.indexOf(alvo) !== -1;
    if (!alvo || !alvoValido || valor === 0) return;
    mods.push({
      nome: (item.nome || 'Equipamento') + ' (' + alvo + ')',
      tipo: item.bonusTipo === 'percentual' ? 'percentual' : 'flat',
      valor: valor,
      alvo: alvo,
      ativo: true,
      source: 'equip',
      kind: 'permanente'
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
    mods.push({ nome: 'Longe do Fim', tipo: 'flat', valor: 5 * lvl, alvo: 'PM', ativo: true, source: 'feito', kind: 'permanente' });
  }

  // Hábil: usa feitoConfig para bônus configurados pelo jogador
  var habilConfigs = (state.feitoConfig && state.feitoConfig.habil) || [];
  habilConfigs.forEach(function(cfg) {
    if (!cfg || !cfg.alvo || !cfg.valor) return;
    mods.push({ nome: 'Hábil (' + cfg.alvo + ')', tipo: 'flat', valor: Number(cfg.valor) || 0, alvo: cfg.alvo, ativo: true, source: 'feito', kind: 'permanente' });
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
      ativo: true,
      source: 'arcana',
      kind: 'permanente'
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
      ativo: true,
      source: 'arcana',
      kind: 'permanente'
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
        ativo: true,
        source: 'arcana',
        kind: 'permanente'
      });
    }
  });
  return mods;
}

/**
 * Calcula o movimento do personagem em metros.
 * Considera Atleta (STR ao invés de AGI), Prodígio em Corrida (×2) e condição Congelado (÷2).
 */
export function computeMovement(moddedStats) {
  var iAtleta  = feitoIsActive('atleta');
  var iCorrida = feitoIsActive('prodigio_corrida');
  var iLento   = !!(state.conditions || []).find(function(c) { return c.id === 'congelado' && c.ativa !== false; });
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
    derrubado: ['Incapaz de esquivar do próximo efeito direcionado a ele'],
    queimando: ['Perde 10% da Vida Atual como Dano de Fogo por turno', 'Recuperação: 33%', 'Ampliado (Vento/Nuclear): +10% de dano, até 2× (máx. 30%)'],
    congelado: ['Movimento reduzido à metade (automático)', 'Desvantagem em testes de Agilidade', 'Recuperação: 33%', 'Ampliado (Físico/Arma/Raio): +50% de dano e consome o efeito'],
    choque:    ['Recebe automaticamente a próxima Ofensiva de Dano contra ele', 'Se for Ofensiva Física, o atacante também fica em Choque', 'Recuperação: 33%', 'Ampliado (Nuclear): alvos adjacentes ficam em Choque por 1 rodada'],
    atordoado: ['Desvantagem em todo teste direcionado a alvos inimigos', 'Recuperação: 33%', 'Ampliado (Físico/Arma): torna-se Derrubado automaticamente'],
    esquecimento: ['Incapaz de utilizar qualquer Magia', 'Recuperação: 33%', 'Ampliado (Psy): perde uma magia aleatória do Deck até o próximo descanso curto (acumulável)'],
    sono:      ['Adormecido: incapaz de agir e reagir até ser atingido', 'Enquanto dorme: recupera 25+VIT de HP e MAG×2 de mana', 'Recuperação: 33%', 'Ampliado (qualquer dano): sofre Derrubado por 1 rodada'],
    confusao:  ['Ao agir, rola 1d6 para determinar a ação (aleatória)', 'Recuperação: 33%', 'Ampliado (Psy): ataca a si ou aliados com magia aleatória do Deck (custo dobrado)'],
    medo:      ['Desvantagem para reagir à fonte de Medo', '50% de chance de não agir na rodada (25% vs Resistência Tirânica)', 'Recuperação: 33%', 'Ampliado (Psy): o Medo se torna Desespero'],
    desespero: ['Incapaz de tomar qualquer ação', 'Perde 10 de PM no início de cada rodada', 'Após 3 rodadas: Incapacitado (0 de PV)', 'Recuperação: 33%', 'Ampliado (Psy): reduz em -1 o contador de Desespero'],
    furia:     ['Só pode usar o Ataque Básico', 'Dano físico causado e recebido +50%', '-5 de bônus em acerto e esquiva', 'Recuperação: 33%', 'Ampliado (Psy): bônus vira 100% e não pode reagir a ataques físicos'],
    charme:    ['Sob controle do Narrador (ataca aliados / cura inimigos)', 'Recuperação: 33%', 'Ampliado (Psy): 1×/rodada interpõe ataque contra a fonte do Charme']
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
 * Efeitos automáticos das condições ativas sobre uma rolagem de teste de combate.
 * Retorna o modo do d20 (normal/vantagem/desvantagem), a penalidade fixa somada
 * e os rótulos das condições que influenciaram, para exibição.
 * @param {string} category - 'combat' | 'social' (condições afetam só combate)
 * @param {string} attrKey - atributo do teste (STR, MAG, TEC, AGI, VIT, LCK)
 * @returns {{mode:string, penalty:number, sources:string[]}}
 */
export function getConditionRollEffects(category, attrKey) {
  var out = { mode: 'normal', penalty: 0, sources: [] };
  if (category !== 'combat') return out;
  (state.conditions || []).forEach(function(c) {
    if (c.ativa === false) return;
    var eff = CONDITION_ROLL_EFFECTS[c.id];
    if (!eff) return;
    var hit = false;
    if (eff.dis && (eff.dis === 'all' || eff.dis === attrKey)) { out.mode = 'dis'; hit = true; }
    if (typeof eff.penalty === 'number' && eff.penalty !== 0) { out.penalty += eff.penalty; hit = true; }
    if (hit) out.sources.push(eff.name + (eff.note ? ' (' + eff.note + ')' : ''));
  });
  return out;
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
          ativo: true,
          source: 'social',
          kind: 'permanente'
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
  // Modificadores globais definidos pelo jogador. Etiquetados como origem
  // 'global' e categoria 'temporario' (buffs/debuffs) sem mutar o state.
  var globalMods = (state.modifiers || []).map(function(m) {
    return {
      nome: m.nome, tipo: m.tipo, valor: m.valor, alvo: m.alvo, ativo: m.ativo,
      source: 'global', kind: m.kind || 'temporario'
    };
  });

  // --- Pontos sociais EFETIVOS ---
  // base (pontos comprados) + modificadores que miram habilidades sociais
  // (Habilidades Naturais, equipamentos, feitos, modificadores globais).
  // O orçamento (pontos restantes) continua baseado apenas nos pontos comprados.
  var socialBase = {};
  SOCIAL_IDS.forEach(function(id) { socialBase[id] = clampInt(state[id] || 0, 0, 999); });
  var socialTargetMods = equipMods
    .concat(feitoMods)
    .concat(naturalMods)
    .concat(globalMods)
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
    .concat(globalMods);
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
    // Detalhamento por alvo (origem de cada número) — atributos/HP/PM e sociais.
    breakdown: buildBreakdown(baseVals, allMods),
    socialBreakdown: buildBreakdown(socialBase, socialTargetMods, SOCIAL_IDS),
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
