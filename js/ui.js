// =============================================
// RENDERIZAÇÃO DA UI
// Depende de: state.js, constants.js, calculations.js, social-skills.js, inventory.js
// =============================================

import { state, FIELD_IDS, _rendering, setRendering } from './state.js';
import { ELEMENTS, EL_IDS, RELS, ARCANAS } from './constants.js';
import { feitoIsActive } from './calculations.js';
import { renderSocial } from './social-skills.js';
import { renderInventoryStatus } from './inventory.js';

// =============================================
// CACHE DE ELEMENTOS DOM
// =============================================

export const ids = {
  CharClass:   document.getElementById('CharClass'),
  CharLvl:     document.getElementById('CharLvl'),
  CharArcana:  document.getElementById('CharArcana'),
  CharPlayer:  document.getElementById('CharPlayer'),
  CharSTR:     document.getElementById('CharSTR'),
  CharMAG:     document.getElementById('CharMAG'),
  CharTEC:     document.getElementById('CharTEC'),
  CharAGI:     document.getElementById('CharAGI'),
  CharVIT:     document.getElementById('CharVIT'),
  CharLCK:     document.getElementById('CharLCK'),
  MaxHP:       document.getElementById('MaxHP'),
  CurrentHP:   document.getElementById('CurrentHP'),
  EnergyMax:   document.getElementById('EnergyMax'),
  CurrentPM:   document.getElementById('CurrentPM'),
  DmgRed:      document.getElementById('DmgRed'),
  KNOPts:      document.getElementById('KNOPts'),
  DISPts:      document.getElementById('DISPts'),
  EMPpts:      document.getElementById('EMPpts'),
  EXPPts:      document.getElementById('EXPPts'),
  COUPts:      document.getElementById('COUPts'),
  CHAPts:      document.getElementById('CHAPts'),
  Aspectos:    document.getElementById('Aspectos'),
  AspectPoints:document.getElementById('AspectPoints'),
  Buffs:       document.getElementById('Buffs'),
  PerName:     document.getElementById('PerName'),
  PerArcana:   document.getElementById('PerArcana'),
  PerNotes:    document.getElementById('PerNotes'),
  Conviction:  document.getElementById('Conviction'),
  PerLvl:      document.getElementById('PerLvl'),
  PerSP:       document.getElementById('PerSP'),
  PerTypes:    document.getElementById('PerTypes'),
  Weapon:      document.getElementById('Weapon'),
  WeaponDmg:   document.getElementById('WeaponDmg'),
  WeaponReach: document.getElementById('WeaponReach'),
  WeaponEffect:document.getElementById('WeaponEffect'),
  Armor:       document.getElementById('Armor'),
  ArmorDmgRed: document.getElementById('ArmorDmgRed'),
  ArmorEffect: document.getElementById('ArmorEffect'),
  Accessory:   document.getElementById('Accessory'),
  AccessoryEffect: document.getElementById('AccessoryEffect'),
  Resistances: document.getElementById('Resistances'),
  NotesDiary:  document.getElementById('NotesDiary'),
  NotesGoals:  document.getElementById('NotesGoals')
};

// =============================================
// RENDER SIMPLES (campos + badges + social + inventário + resumo)
// =============================================

/**
 * Renderiza campos simples + badges a partir do state.
 * Para renderização completa (tabelas, feitos, etc.) use renderAll em app.js.
 */
export function render() {
  setRendering(true);
  try {
    renderFields();
    renderBadges();
    renderSocial();
    renderInventoryStatus();
    renderAutoSummary();
  } finally {
    setRendering(false);
  }
}

export function renderFields() {
  FIELD_IDS.forEach(function(key) {
    var el = ids[key];
    if (!el) return;
    var val = state[key];
    if (val === undefined || val === null) val = '';
    if (el.value !== String(val)) el.value = val;
  });
}

export function renderBadges() {
  var comp = state._computed;
  if (!comp) return;
  var baseVals = comp.baseVals;
  var modded = comp.modded;
  ['STR','MAG','TEC','AGI','VIT','LCK'].forEach(function(k) {
    var el = document.getElementById('b' + k);
    if (el) el.textContent = modded[k] !== baseVals[k] ? (modded[k] + ' (' + baseVals[k] + ')') : baseVals[k];
  });
}

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
        return '<div class="autos-row autos-row-social">\u2b50 ' + mod.nome + ': ' + sign + mod.valor + ' ' + mod.alvo + '</div>';
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

  content.innerHTML =
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
}

// =============================================
// RETRATO E BACKGROUND
// =============================================

export function renderPortrait() {
  var prev = document.getElementById('portraitPreview');
  if (!prev) return;
  if (state.portrait && state.portrait.src) {
    prev.innerHTML = '';
    var img = document.createElement('img');
    img.src = state.portrait.src;
    img.alt = 'Retrato';
    img.style.cssText = 'max-width:180px;max-height:220px;border-radius:12px;border:2px solid var(--accent);';
    prev.appendChild(img);
  } else {
    prev.innerHTML = '';
  }
}

export function renderBackground() {
  if (!state.background) return;
  Object.entries(state.background).forEach(function(entry) {
    var el = document.getElementById(entry[0]);
    if (el) el.value = entry[1] || '';
  });
}

// =============================================
// AFINIDADES
// =============================================

export function initArcanaSelects() {
  var arcSel1 = document.getElementById('CharArcana');
  var arcSel2 = document.getElementById('PerArcana');
  [arcSel1, arcSel2].forEach(function(sel) {
    if (sel) ARCANAS.forEach(function(a) { var o = document.createElement('option'); o.value = a; o.textContent = a; sel.appendChild(o); });
  });
}

export function buildAffinityTable() {
  var afBody = document.getElementById('af-body');
  if (!afBody) return;
  afBody.innerHTML = '';
  for (var i = 0; i < ELEMENTS.length; i += 2) {
    var left = ELEMENTS[i]; var right = ELEMENTS[i + 1];
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + left + '</td><td><select id="AF_' + EL_IDS[left] + '"></select></td>' +
      (right ? '<td>' + right + '</td><td><select id="AF_' + EL_IDS[right] + '"></select></td>' : '<td></td><td></td>');
    afBody.appendChild(tr);
  }
  var sels = Array.from(document.querySelectorAll("[id^='AF_']"));
  RELS.forEach(function(r) { sels.forEach(function(sel) { var o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); }); });
  // Sincronizar com state quando mudar
  sels.forEach(function(sel) {
    sel.addEventListener('change', function() {
      syncAffinityToState();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    });
  });
}

export function syncAffinityToState() {
  var affin = {};
  ELEMENTS.forEach(function(e) {
    var sel = document.getElementById('AF_' + EL_IDS[e]);
    affin[e] = sel ? sel.value : 'Normal';
  });
  state.affinities = affin;
}

export function renderAffinities() {
  ELEMENTS.forEach(function(e) {
    var sel = document.getElementById('AF_' + EL_IDS[e]);
    if (sel && state.affinities[e]) sel.value = state.affinities[e];
  });
}

// =============================================
// TOAST
// =============================================

export function showToast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3000;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function() {
    setTimeout(function() {
      toast.classList.add('out');
      setTimeout(function() { toast.remove(); }, 300);
    }, duration);
  });
}

// =============================================
// AUTO-RESIZE TEXTAREAS
// =============================================

export function autoResizeTextarea(textarea) {
  if (!textarea || textarea.tagName !== 'TEXTAREA') return;
  if (textarea.offsetParent === null) return;
  textarea.style.overflowY = 'auto';
  textarea.style.height = 'auto';
  var maxHeight = 420;
  var style = window.getComputedStyle(textarea);
  var minHeight = parseFloat(style.minHeight) || textarea.offsetHeight || 0;
  var newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = Math.max(newHeight, minHeight) + 'px';
}

export function initAutoResizeTextareas() {
  Array.from(document.querySelectorAll('textarea')).forEach(function(textarea) {
    autoResizeTextarea(textarea);
    if (textarea.dataset.autoresizeInit !== '1') {
      textarea.addEventListener('input', function() { autoResizeTextarea(textarea); });
      textarea.dataset.autoresizeInit = '1';
    }
  });
}
