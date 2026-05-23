// =============================================
// ENTRY POINT — JS/APP.JS
// Importa e inicializa todos os módulos
// =============================================

import { state, FIELD_IDS, NUMBER_FIELDS, RECALC_FIELDS, _rendering, setRendering } from './state.js';
import { SOCIAL_IDS } from './constants.js';
import { recalcState, validateState } from './calculations.js';
import {
  ids, render, renderFields, renderBadges, renderAffinities, renderPortrait,
  renderBackground, buildAffinityTable, showToast, buildAutoSummaryPanel,
  renderAutoSummary, initArcanaSelects, autoResizeTextarea, initAutoResizeTextareas
} from './ui.js';
import { renderSocial, buildSocialUI } from './social-skills.js';
import {
  renderTables, initInventoryButtons,
  addInventoryItem, addSpell, addLink, addClue, addCtt,
  syncEquipToState, syncSpellsToState, syncLinksToState,
  syncCluesToState, syncContactsToState, renderInventoryStatus
} from './inventory.js';
import { buildFeitosUI, renderFeitos } from './feats.js';
import { buildConditionsUI, renderConditions } from './conditions.js';
import { buildModifiersUI, renderModifiers, renderModSummary } from './modifiers.js';
import { snapshot, applySnapshot, setRenderAll } from './storage.js';
import { initTheme } from './themes.js';
import { initTabs } from './tabs.js';
import { initImportExport } from './import-export.js';

// =============================================
// RENDERIZAÇÃO COMPLETA
// =============================================

export function renderAll() {
  setRendering(true);
  try {
    renderFields();
    renderBadges();
    renderSocial();
    renderTables();
    renderFeitos();
    renderConditions();
    renderModifiers();
    renderAffinities();
    renderPortrait();
    renderBackground();
    renderModSummary();
    buildAutoSummaryPanel();
    renderAutoSummary();
    initAutoResizeTextareas();
  } finally {
    setRendering(false);
  }
}

// Injetar renderAll em storage.js (evita dependência circular)
setRenderAll(renderAll);

// =============================================
// setState / getState
// =============================================

export function setState(partial, options) {
  if (!partial || typeof partial !== 'object') return;
  options = options || {};
  var needsRecalc = false;
  Object.keys(partial).forEach(function(key) {
    if (key.charAt(0) === '_') return;
    state[key] = NUMBER_FIELDS.has(key) ? (Number(partial[key]) || 0) : partial[key];
    if (RECALC_FIELDS.has(key)) needsRecalc = true;
  });
  if (needsRecalc && !options.skipRecalc) recalcState();
  validateState();
  if (!options.skipRender) render(options.renderOptions || {});
  if (!options.skipSave && window.debouncedAutoSave) window.debouncedAutoSave();
}

export function getState() {
  var copy = {};
  Object.keys(state).forEach(function(k) {
    if (k.charAt(0) === '_') return;
    var v = state[k];
    copy[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
  });
  return copy;
}

// =============================================
// RESET DA FICHA
// =============================================

function resetFicha() {
  if (!confirm('Tem certeza que deseja resetar a ficha?\nTodos os dados serão perdidos permanentemente.')) return;

  FIELD_IDS.forEach(function(key) {
    state[key] = NUMBER_FIELDS.has(key) ? (RECALC_FIELDS.has(key) ? 1 : 0) : '';
  });
  state.CharLvl = 1; state.PerLvl = 1;
  state.spells = []; state.equip = []; state.links = [];
  state.clues = []; state.contacts = [];
  state.feitos = []; state.conditions = []; state.modifiers = [];
  state.feitoConfig = {};
  state.affinities = {};
  state.portrait = { src: '' };
  state.background = {};

  recalcState();
  state.CurrentHP = state.MaxHP;
  state.CurrentPM = state.EnergyMax;
  validateState();

  var afGrid = document.getElementById('af-grid');
  if (afGrid) afGrid.innerHTML = '';
  var afSum = document.getElementById('af-summary');
  if (afSum) afSum.innerHTML = '';
  buildAffinityTable();

  renderAll();

  var testsOut = document.getElementById('tests-out');
  if (testsOut) testsOut.textContent = 'Clique em Testes para rodar as verificações.';

  try { localStorage.removeItem('ficha-yby-p3r-skin'); } catch (e) {}
  showToast('Ficha resetada', 'info');
}

// =============================================
// PORTRAIT
// =============================================

function initPortrait() {
  var portraitBtn = document.getElementById('portraitBtn');
  var portraitInput = document.getElementById('portraitInput');
  var portraitPreview = document.getElementById('portraitPreview');
  var portraitZoomBtn = document.getElementById('portraitZoomBtn');
  var portraitModal = document.getElementById('portraitModal');
  var portraitModalImg = document.getElementById('portraitModalImg');
  var portraitModalClose = document.getElementById('portraitModalClose');
  var portraitImgSrc = '';

  if (portraitBtn && portraitInput && portraitPreview) {
    portraitBtn.addEventListener('click', function() { portraitInput.click(); });
    portraitInput.addEventListener('change', function() {
      var file = portraitInput.files[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          portraitImgSrc = e.target.result;
          portraitPreview.innerHTML = '';
          var img = document.createElement('img');
          img.src = portraitImgSrc;
          img.alt = 'Retrato';
          img.style.cssText = 'max-width:180px;max-height:220px;border-radius:12px;border:2px solid var(--accent);';
          portraitPreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      } else {
        portraitImgSrc = '';
        portraitPreview.innerHTML = '';
      }
    });
  }

  if (portraitZoomBtn && portraitModal && portraitModalImg && portraitModalClose) {
    portraitZoomBtn.addEventListener('click', function() {
      var imgEl = portraitPreview ? portraitPreview.querySelector('img') : null;
      var src = (imgEl && imgEl.src) || portraitImgSrc;
      if (src) {
        portraitModalImg.src = src;
        portraitModal.style.display = 'flex';
      }
    });
    portraitModalClose.addEventListener('click', function() {
      portraitModal.style.display = 'none';
      portraitModalImg.src = '';
    });
    portraitModal.addEventListener('click', function(e) {
      if (e.target === portraitModal) {
        portraitModal.style.display = 'none';
        portraitModalImg.src = '';
      }
    });
  }
}

// =============================================
// INICIALIZAÇÃO DA APP
// =============================================

function initApp() {
  // Tabs e tema são críticos — inicializar primeiro
  try { initTheme(); } catch(e) { console.error('[initApp] initTheme:', e); }
  try { initTabs(); } catch(e) { console.error('[initApp] initTabs:', e); }

  try { initArcanaSelects(); } catch(e) { console.error('[initApp] initArcanaSelects:', e); }
  try { buildAffinityTable(); } catch(e) { console.error('[initApp] buildAffinityTable:', e); }
  try { buildFeitosUI(); } catch(e) { console.error('[initApp] buildFeitosUI:', e); }
  try { buildConditionsUI(); } catch(e) { console.error('[initApp] buildConditionsUI:', e); }
  try { buildSocialUI(); } catch(e) { console.error('[initApp] buildSocialUI:', e); }
  try { buildModifiersUI(); } catch(e) { console.error('[initApp] buildModifiersUI:', e); }
  try { buildAutoSummaryPanel(); } catch(e) { console.error('[initApp] buildAutoSummaryPanel:', e); }
  try { initInventoryButtons(); } catch(e) { console.error('[initApp] initInventoryButtons:', e); }
  try { initPortrait(); } catch(e) { console.error('[initApp] initPortrait:', e); }
  try { initImportExport(); } catch(e) { console.error('[initApp] initImportExport:', e); }
}
initApp();

// =============================================
// EXPAND BUTTONS
// =============================================

(function() {
  Array.from(document.querySelectorAll('.expand-btn')).forEach(function(btn) {
    var targetId = btn.dataset.target;
    var target = document.getElementById(targetId);
    if (!target) return;
    btn.addEventListener('click', function() {
      target.classList.toggle('expanded');
      btn.textContent = target.classList.contains('expanded') ? '\u2922' : '\u2921';
      if (target.classList.contains('expanded')) target.focus();
    });
  });
})();

// =============================================
// AUTO-RESIZE TEXTAREAS
// =============================================

window.autoResizeTextarea = autoResizeTextarea;
window.initAutoResizeTextareas = initAutoResizeTextareas;
initAutoResizeTextareas();

var textareaObserver = new MutationObserver(function() { initAutoResizeTextareas(); });
textareaObserver.observe(document.body, { childList: true, subtree: true });

// =============================================
// EVENTOS — CAMPOS SIMPLES
// =============================================

// Atributos de combate (range sliders + nível): disparam recalc via setState
['CharLvl','CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK'].forEach(function(key) {
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = el.value;
    setState(partial);
  });
});

// Habilidades sociais: mudança de pontos também dispara recalc (tiers afetam atributos)
SOCIAL_IDS.forEach(function(key) {
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = Number(el.value) || 0;
    setState(partial);
  });
});

// HP/PM máximos: atualiza state sem recalc
['MaxHP','EnergyMax'].forEach(function(key) {
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = el.value;
    setState(partial, { skipRecalc: true });
  });
});

// HP/PM atuais: atualiza state sem recalc, valida clamp
['CurrentHP','CurrentPM'].forEach(function(key) {
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = el.value;
    setState(partial, { skipRecalc: true });
  });
});

// Todos os outros campos simples
FIELD_IDS.forEach(function(key) {
  if (RECALC_FIELDS.has(key)) return;
  if (SOCIAL_IDS.indexOf(key) >= 0) return;
  if (['MaxHP','CurrentHP','EnergyMax','CurrentPM'].indexOf(key) >= 0) return;
  var el = ids[key];
  if (!el) return;
  el.addEventListener('input', function() {
    if (_rendering) return;
    var partial = {};
    partial[key] = NUMBER_FIELDS.has(key) ? (Number(el.value) || 0) : el.value;
    setState(partial, { skipRecalc: true });
  });
});

// Cálculo inicial
recalcState();
state.CurrentHP = state.MaxHP;
state.CurrentPM = state.EnergyMax;
validateState();
render();

// =============================================
// BOTÕES DE AÇÃO
// =============================================

var resetBtn = document.getElementById('reset');
if (resetBtn) resetBtn.addEventListener('click', resetFicha);

var saveBtn = document.getElementById('save');
if (saveBtn) saveBtn.addEventListener('click', function() {
  var required = [
    { el: ids.CharClass,  label: 'Classe' },
    { el: ids.CharPlayer, label: 'Nome do Personagem' },
    { el: ids.PerName,    label: 'Nome da Persona' }
  ];
  var faltando = required.filter(function(r) { return r.el && !r.el.value.trim(); });
  if (faltando.length > 0) {
    faltando.forEach(function(r) {
      r.el.classList.add('input-error');
      if (r.el.offsetParent !== null) r.el.focus();
      setTimeout(function() { r.el.classList.remove('input-error'); }, 2000);
    });
    showToast('Preencha: ' + faltando.map(function(r) { return r.label; }).join(', '), 'error', 3500);
    return;
  }
  try {
    localStorage.setItem('ficha-yby-p3r-skin', JSON.stringify(snapshot()));
    showToast('\u2713 Ficha salva com sucesso', 'success');
  } catch (e) {
    console.error('[Salvar] Erro ao salvar ficha:', e);
    if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || (e.code && e.code === 22))) {
      showToast('Espa\u00e7o insuficiente no navegador (retrato muito grande?)', 'error', 5000);
    } else {
      showToast('Erro ao salvar a ficha', 'error');
    }
  }
});

var loadBtn = document.getElementById('load');
if (loadBtn) loadBtn.addEventListener('click', function() {
  var raw = localStorage.getItem('ficha-yby-p3r-skin');
  if (!raw) return showToast('Nenhuma ficha salva', 'info');
  try { applySnapshot(JSON.parse(raw)); showToast('\u2713 Ficha carregada', 'success'); }
  catch (e) { showToast('Erro ao carregar ficha', 'error'); }
});

// =============================================
// TESTES
// =============================================

function runTests() {
  var out = document.getElementById('tests-out');
  var card = document.getElementById('tests-card');
  if (card) card.style.display = 'block';
  var logs = [];
  function ok(name, cond, expect, got) {
    logs.push((cond ? '\u2705' : '\u274C') + ' ' + name + (cond ? '' : ' \u2014 esperado ' + expect + ', obtido ' + got));
  }

  var backup = snapshot();

  // Teste 1: HP/PM lvl1
  setState({ CharLvl: 1, CharVIT: 1, CharMAG: 1, CharAGI: 2 }, { skipSave: true });
  ok('PV lvl1/VIT1 = 31', state.MaxHP === 31, 31, state.MaxHP);
  ok('PM lvl1/MAG1 = 27', state.EnergyMax === 27, 27, state.EnergyMax);

  // Teste 2: HP/PM lvl10
  setState({ CharLvl: 10, CharVIT: 4, CharMAG: 3, CharAGI: 3 }, { skipSave: true });
  ok('PV lvl10/VIT4 = 115', state.MaxHP === 115, 115, state.MaxHP);
  ok('PM lvl10/MAG3 = 76', state.EnergyMax === 76, 76, state.EnergyMax);

  // Badge check
  var bAGI = document.getElementById('bAGI');
  ok('Init = AGI (badge bAGI)', Number((bAGI || {}).textContent || 0) === 3, 3, (bAGI || {}).textContent || '');

  // Afinidades
  var afCount = document.querySelectorAll('[id^="AF_"]').length;
  ok('Afinidades \u2014 10 selects', afCount === 10, 10, afCount);

  // State integration check
  ok('getState() retorna objeto', typeof getState() === 'object', 'object', typeof getState());
  ok('state.CharLvl === 10', state.CharLvl === 10, 10, state.CharLvl);

  // Restaurar
  applySnapshot(backup);

  if (out) out.innerHTML = logs.map(function(l) { return '<div>' + l + '</div>'; }).join('');
}

var testsBtn = document.getElementById('tests');
if (testsBtn) testsBtn.addEventListener('click', runTests);

// =============================================
// SEED (linhas vazias iniciais)
// =============================================

function seed() {
  addInventoryItem({}, 'mochila'); syncEquipToState(); renderInventoryStatus();
  addSpell(); syncSpellsToState();
  addLink(); syncLinksToState();
  addClue(); syncCluesToState();
  addCtt(); syncContactsToState();
}

// =============================================
// AUTO-LOAD
// =============================================

var _autoLoaded = false;
try {
  var raw = localStorage.getItem('ficha-yby-p3r-skin');
  if (raw) {
    var data = JSON.parse(raw);
    if (data && typeof data === 'object' && data.id === 'ficha-yby-p3r-skin') {
      applySnapshot(data);
      _autoLoaded = true;
    } else {
      console.warn('[Auto-load] Dados inválidos no localStorage, ignorando.');
    }
  }
} catch (e) {
  console.warn('[Auto-load] Erro ao carregar:', e);
}
if (!_autoLoaded) seed();

// =============================================
// AUTO-SAVE
// =============================================

var saveIndicator = document.createElement('div');
saveIndicator.id = 'auto-save-indicator';
saveIndicator.style.cssText = 'position:fixed;bottom:16px;right:16px;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:700;color:#fff;background:rgba(30,30,30,0.85);opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9999;backdrop-filter:blur(6px);';
document.body.appendChild(saveIndicator);
var saveIndicatorTimer = null;

function showSaveStatus(text, duration) {
  saveIndicator.textContent = text;
  saveIndicator.style.opacity = '1';
  if (saveIndicatorTimer) clearTimeout(saveIndicatorTimer);
  if (duration) {
    saveIndicatorTimer = setTimeout(function() { saveIndicator.style.opacity = '0'; }, duration);
  }
}

var _saving = false;
function autoSave() {
  if (_saving || _rendering) return;
  _saving = true;
  try {
    showSaveStatus('Salvando...');
    var json = JSON.stringify(snapshot());
    localStorage.setItem('ficha-yby-p3r-skin', json);
    showSaveStatus('Salvo \u2714', 2000);
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || (e.code && e.code === 22))) {
      console.warn('[Auto-save] localStorage cheio (retrato muito grande?):', e);
      showSaveStatus('Espa\u00e7o insuficiente', 4000);
    } else {
      console.warn('[Auto-save] Erro ao salvar:', e);
      showSaveStatus('Erro ao salvar', 3000);
    }
  } finally {
    _saving = false;
  }
}

function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    var self = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(self, args); }, delay);
  };
}

var debouncedAutoSave = debounce(autoSave, 500);
window.debouncedAutoSave = debouncedAutoSave;

// Eventos globais de auto-save
document.addEventListener('input', function() { if (!_rendering) debouncedAutoSave(); });
document.addEventListener('change', function() { if (!_rendering) debouncedAutoSave(); });

// Observer para tabelas dinâmicas e spell-grid
var autoSaveTableIds = ['tbl-eq-equipado','tbl-eq-mochila','tbl-link','tbl-clue','tbl-ctt','tbl-mod'];
var tableObserver = new MutationObserver(function() { setTimeout(debouncedAutoSave, 100); });
autoSaveTableIds.forEach(function(id) {
  var tbody = document.querySelector('#' + id + ' tbody');
  if (tbody) tableObserver.observe(tbody, { childList: true, subtree: true });
});
var spellGrid = document.getElementById('spell-grid');
if (spellGrid) tableObserver.observe(spellGrid, { childList: true, subtree: true });

// Safety net: salvar ao fechar
window.addEventListener('beforeunload', function() {
  try { localStorage.setItem('ficha-yby-p3r-skin', JSON.stringify(snapshot())); } catch (e) {}
});

// =============================================
// EXPOR API GLOBAL (para debugging e interoperabilidade)
// =============================================

window.state = state;
window.setState = setState;
window.getState = getState;
window.autoSave = autoSave;
