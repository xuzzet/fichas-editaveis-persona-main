// =============================================
// UI - PAINEL DE RESUMO AUTOMATICO
// =============================================
import { state } from '../state.js';
import { feitoIsActive } from '../calculations.js';

// =============================================
// PAINEL DE RESUMO AUTOMÁTICO
// =============================================

/**
 * Cria (uma única vez) o card de Resumo Automático no view acessorapido.
 * Idempotente — pode ser chamado várias vezes com segurança.
 */
export function buildAutoSummaryPanel() {
  if (document.getElementById('auto-summary-card')) return;
  var mainEl = document.querySelector('#acessorapido main');
  if (!mainEl) return;
  var card = document.createElement('section');
  card.className = 'card';
  card.id = 'auto-summary-card';
  card.innerHTML =
    '<div class="section-title"><div class="bar"></div><h2>Resumo Autom\u00e1tico</h2></div>' +
    '<div id="auto-summary-content"><p class="hint">Calculando...</p></div>';
  // Insere antes da section que contém o botão de salvar (Ações)
  var acoes = Array.from(mainEl.querySelectorAll('section.card')).find(function(c) {
    return c.querySelector('#save');
  });
  if (acoes) {
    mainEl.insertBefore(card, acoes);
  } else {
    mainEl.appendChild(card);
  }
}

/**
 * Atualiza o conteúdo do card de Resumo Automático com os dados de state._computed.
 */
export function renderAutoSummary() {
  var content = document.getElementById('auto-summary-content');
  if (!content) return;
  var comp = state._computed;
  if (!comp || !comp.modded) {
    content.innerHTML = '<p class="hint">Aguardando c\u00e1lculo...</p>';
    return;
  }

  var m = comp.modded;
  var b = comp.baseVals;
  var mov = comp.movement || { final: 0, doubled: false, halved: false };
  var alerts = comp.conditionAlerts || [];
  var feitoMods = comp.feitoMods || [];
  var flags = comp.flags || {};

  // Atributo com nota de base quando diferente do final
  function statStr(key) {
    var fin = m[key], bas = b[key];
    return fin !== bas
      ? '<b>' + fin + '</b><span class="autos-base"> (' + bas + ')</span>'
      : '<b>' + fin + '</b>';
  }

  // Movimento
  var movLabel = mov.final + 'm';
  if (mov.doubled && mov.halved) movLabel = mov.final + 'm <span class="autos-flag">(\u00d72, \u00f72)</span>';
  else if (mov.doubled)          movLabel = mov.final + 'm <span class="autos-flag">(\u00d72 Prod\u00edgio)</span>';
  else if (mov.halved)           movLabel = mov.final + 'm <span class="autos-flag">(\u00f72 Lento)</span>';

  // Bônus automáticos de feitos
  var feitoBonusHtml = '';
  if (feitoMods.length > 0) {
    feitoBonusHtml =
      '<div class="autos-section">' +
      '<div class="autos-label">B\u00f4nus de Feitos</div>' +
      feitoMods.map(function(mod) {
        var sign = mod.valor >= 0 ? '+' : '';
        return '<div class="autos-row">\u26a1 ' + mod.nome + ': ' + sign + mod.valor + ' ' + mod.alvo + '</div>';
      }).join('') +
      '</div>';
  }

  // Flags / efeitos passivos de feitos
  var activeFlags = [];
  if (flags.rdUniversal)   activeFlags.push('RD universal (exceto Onipotente)');
  if (flags.tecReplaceAgi) activeFlags.push('TEC substitui AGI em rea\u00e7\u00f5es');
  if (feitoIsActive('habil') && (!state.feitoConfig || !(state.feitoConfig.habil || []).length)) {
    activeFlags.push('\u26a0 Feito H\u00e1bil ativo \u2014 configure o b\u00f4nus em Modificadores Globais');
  }
  var flagsHtml = '';
  if (activeFlags.length > 0) {
    flagsHtml =
      '<div class="autos-section">' +
      '<div class="autos-label">Efeitos de Feitos</div>' +
      activeFlags.map(function(f) { return '<div class="autos-row">' + f + '</div>'; }).join('') +
      '</div>';
  }

  // Alertas de condições ativas
  var alertsHtml = '';
  if (alerts.length > 0) {
    alertsHtml =
      '<div class="autos-section">' +
      '<div class="autos-label autos-label-warn">Condi\u00e7\u00f5es Ativas</div>' +
      alerts.map(function(a) {
        return '<div class="autos-cond-block">' +
          '<div class="autos-cond-name">\u26a0 ' + a.name + '</div>' +
          a.effects.map(function(eff) {
            return '<div class="autos-cond-effect">' + eff + '</div>';
          }).join('') +
          '</div>';
      }).join('') +
      '</div>';
  }

  // Bônus automáticos de habilidades sociais
  var socialMods = comp.socialMods || [];
  var socialEffectsHtml = '';
  if (socialMods.length > 0) {
    socialEffectsHtml =
      '<div class="autos-section">' +
      '<div class="autos-label autos-label-social">B\u00f4nus de Habilidades Sociais</div>' +
      socialMods.map(function(mod) {
        var sign = mod.valor >= 0 ? '+' : '';
        return '<div class="autos-row autos-row-social">\u2605\uFE0E ' + mod.nome + ': ' + sign + mod.valor + ' ' + mod.alvo + '</div>';
      }).join('') +
      '</div>';
  }

  // Lembretes manuais de habilidades sociais desbloqueadas
  var socialEffects = comp.socialEffects || [];
  var socialManualHtml = '';
  var manualItems = [];
  socialEffects.forEach(function(skill) {
    skill.tiers.forEach(function(t) {
      t.manual.forEach(function(m) {
        manualItems.push('<div class="autos-social-reminder"><span class="autos-social-badge">' + skill.name + ' ' + t.roman + '</span> ' + m + '</div>');
      });
    });
  });
  if (manualItems.length > 0) {
    socialManualHtml =
      '<div class="autos-section">' +
      '<div class="autos-label autos-label-social">Lembretes Sociais</div>' +
      manualItems.join('') +
      '</div>';
  }

  var html =
    '<div class="autos-grid">' +
      '<div class="autos-stat"><span class="autos-key">STR</span>'   + statStr('STR') + '</div>' +
      '<div class="autos-stat"><span class="autos-key">MAG</span>'   + statStr('MAG') + '</div>' +
      '<div class="autos-stat"><span class="autos-key">TEC</span>'   + statStr('TEC') + '</div>' +
      '<div class="autos-stat"><span class="autos-key">AGI</span>'   + statStr('AGI') + '</div>' +
      '<div class="autos-stat"><span class="autos-key">VIT</span>'   + statStr('VIT') + '</div>' +
      '<div class="autos-stat"><span class="autos-key">LCK</span>'   + statStr('LCK') + '</div>' +
      '<div class="autos-stat"><span class="autos-key">PV M\u00e1x</span><b>' + state.MaxHP + '</b></div>' +
      '<div class="autos-stat"><span class="autos-key">PM M\u00e1x</span><b>' + state.EnergyMax + '</b></div>' +
      '<div class="autos-stat"><span class="autos-key">RD</span><b>' + (state.DmgRed || 0) + '</b>' +
        (flags.rdUniversal ? '<span class="autos-flag"> (univ.)</span>' : '') + '</div>' +
      '<div class="autos-stat"><span class="autos-key">Movimento</span>' + movLabel + '</div>' +
    '</div>' +
    feitoBonusHtml +
    flagsHtml +
    alertsHtml +
    socialEffectsHtml +
    socialManualHtml;

  // Dirty-check: só reescreve o DOM quando o conteúdo realmente muda.
  // Evita reparse/reflow do innerHTML a cada tecla digitada em campos
  // que não afetam o resumo (nome, notas, etc.).
  if (content._lastHtml !== html) {
    content.innerHTML = html;
    content._lastHtml = html;
  }
}
