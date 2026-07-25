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
  renderAutoSummary, initArcanaSelects, autoResizeTextarea, initAutoResizeTextareas,
  initLoreCollapse
} from './ui.js';
import { renderSocial, buildSocialUI } from './social-skills.js';
import {
  renderTables, initInventoryButtons,
  addInventoryItem, addSpell, addLink, addClue, addCtt,
  syncEquipToState, syncSpellsToState, syncLinksToState,
  syncCluesToState, syncContactsToState, renderInventoryStatus,
  initLinkFilters, renderLinkSummary
} from './inventory.js';
import { buildFeitosUI, renderFeitos } from './feats.js';
import { buildConditionsUI, renderConditions } from './conditions.js';
import { buildModifiersUI, renderModifiers, renderModSummary } from './modifiers.js';
import { snapshot, applySnapshot, setRenderAll } from './storage.js';
import {
  loadProfileStore, getActiveProfile, saveActiveSnapshot,
  createProfile, duplicateProfile, deleteProfile, renameProfile,
  setProfileAvatar, switchProfile, getActiveId, isFull
} from './profiles.js';
import { initProfilesUI, refreshProfilesUI } from './profiles-ui.js';
import { initTheme } from './themes.js';
import { initTabs } from './tabs.js';
import { initImportExport } from './import-export.js';
import { saveSafetyBackup, getSafetyBackup } from './backup.js';
import { initHistory, recordHistory, undo, redo } from './history.js';
import { initDiceSystem, renderDiceHistory, rollDamage, rollQuick } from './dice.js';
import { initAwakening, renderAwakening } from './awakening.js';

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
    renderDiceHistory();
    renderAwakening();
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

// Recalcula atributos finais + valida + renderiza.
// Exposto para módulos que alteram fontes de bônus fora do fluxo de setState
// (ex.: bônus automáticos de equipamentos no inventário).
window.recalcAndRender = function() {
  recalcState();
  validateState();
  render();
};

// =============================================
// RESET / ESTADO PADRÃO DA FICHA
// =============================================

// Zera o `state` para os valores padrão de uma ficha nova.
// NÃO mexe em localStorage nem na interface — apenas nos dados.
function resetStateToDefaults() {
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
  state.rollHistory = [];
  state.personaAwakenings = {};

  recalcState();
  state.CurrentHP = state.MaxHP;
  state.CurrentPM = state.EnergyMax;
  validateState();
}

// Reconstrói a tabela de afinidades (selects) e re-renderiza tudo.
function rebuildSheetUI() {
  var afGrid = document.getElementById('af-grid');
  if (afGrid) afGrid.innerHTML = '';
  var afSum = document.getElementById('af-summary');
  if (afSum) afSum.innerHTML = '';
  buildAffinityTable();
  renderAll();
}

function resetFicha() {
  if (!confirm('Tem certeza que deseja resetar a ficha?\nTodos os dados serão perdidos permanentemente.')) return;

  // Backup de segurança antes de destruir os dados (restaurável depois).
  try { saveSafetyBackup(snapshot()); } catch (e) {}

  resetStateToDefaults();
  rebuildSheetUI();

  var testsOut = document.getElementById('tests-out');
  if (testsOut) testsOut.textContent = 'Clique em Testes para rodar as verificações.';

  // Persiste a ficha resetada no perfil ativo (não remove outros perfis).
  try { saveActiveSnapshot(snapshot()); } catch (e) {}
  refreshProfilesUI();
  showToast('Ficha resetada', 'info');
}

// =============================================
// FLUXOS DE PERFIL
// =============================================

// Troca de perfil: salva o atual, carrega o alvo, re-renderiza.
function switchToProfile(id) {
  if (id === getActiveId()) return true;
  try {
    saveActiveSnapshot(snapshot());
    var r = switchProfile(id);
    if (!r || !r.ok) return false;
    applySnapshot(r.sheetData || {});
    return true;
  } catch (e) {
    console.error('[Perfil] Erro ao trocar de perfil:', e);
    showToast('Erro ao trocar de perfil', 'error');
    return false;
  }
}

// Cria um novo perfil com ficha limpa (não copia o personagem ativo).
function createNewProfile(name, avatarDataUrl) {
  if (isFull()) return { ok: false, error: 'limit' };
  try {
    // 1. Salva o estado atual no perfil ativo.
    saveActiveSnapshot(snapshot());
    // 2. Ficha limpa nos valores padrão.
    resetStateToDefaults();
    if (name) state.CharPlayer = name;
    state.portrait = { src: avatarDataUrl || '' };
    // 3. Atualiza a UI para refletir a ficha limpa antes de fotografar.
    rebuildSheetUI();
    // 4. Cria o perfil a partir do snapshot já limpo.
    var res = createProfile(name || 'Novo Personagem', avatarDataUrl || '', snapshot());
    return res;
  } catch (e) {
    console.error('[Perfil] Erro ao criar ficha:', e);
    return { ok: false, error: 'exception' };
  }
}

// Duplica um perfil existente.
function duplicateExistingProfile(id) {
  // Garante que o perfil ativo esteja salvo antes de copiar.
  try { saveActiveSnapshot(snapshot()); } catch (e) {}
  return duplicateProfile(id);
}

// Exclui um perfil; se era o ativo, carrega o novo ativo.
function deleteExistingProfile(id) {
  var wasActive = (id === getActiveId());
  var res = deleteProfile(id);
  if (res && res.ok && res.switched && res.newActive) {
    applySnapshot(res.newActive.sheetData || {});
  }
  return res;
}

// Renomeia; se for o perfil ativo, reflete no estado ao vivo.
function renameExistingProfile(id, name) {
  var res = renameProfile(id, name);
  if (res && res.ok && id === getActiveId()) {
    setState({ CharPlayer: res.profile.name });
  }
  return res;
}

// Altera o avatar; se for o perfil ativo, reflete no retrato ao vivo.
function changeProfileAvatar(id, dataUrl) {
  var res = setProfileAvatar(id, dataUrl);
  if (res && res.ok && id === getActiveId()) {
    state.portrait = { src: dataUrl || '' };
    renderPortrait();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  }
  return res;
}


// =============================================
// PORTRAIT
// =============================================

function initPortrait() {
  var portraitBtn        = document.getElementById('portraitBtn');
  var portraitInput      = document.getElementById('portraitInput');
  var portraitPreview    = document.getElementById('portraitPreview');
  var portraitZoomBtn    = document.getElementById('portraitZoomBtn');
  var portraitModal      = document.getElementById('portraitModal');
  var portraitModalImg   = document.getElementById('portraitModalImg');
  var portraitModalClose = document.getElementById('portraitModalClose');
  var backdrop = portraitModal ? portraitModal.querySelector('.portrait-modal__backdrop') : null;

  // ── Upload ──────────────────────────────────────────────
  if (portraitBtn && portraitInput) {
    portraitBtn.addEventListener('click', function () { portraitInput.click(); });
  }
  if (portraitInput && portraitPreview) {
    portraitInput.addEventListener('change', function () {
      var file = portraitInput.files[0];
      if (!file) { portraitPreview.innerHTML = ''; return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        portraitPreview.innerHTML = '';
        var img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Retrato';
        portraitPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Abrir modal ──────────────────────────────────────────
  function openModal() {
    if (!portraitModal || !portraitModalImg) return;
    var imgEl = portraitPreview ? portraitPreview.querySelector('img') : null;
    if (!imgEl) return;
    var src = imgEl.getAttribute('src') || '';
    if (!src || !src.startsWith('data:')) return;
    portraitModalImg.src = src;
    portraitModal.classList.add('is-open');
    portraitModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  // ── Fechar modal ─────────────────────────────────────────
  function closeModal() {
    if (!portraitModal) return;
    portraitModal.classList.remove('is-open');
    portraitModal.setAttribute('aria-hidden', 'true');
    if (portraitModalImg) portraitModalImg.src = '';
    document.body.classList.remove('modal-open');
  }

  // Botão "Ampliar Imagem"
  if (portraitZoomBtn) {
    portraitZoomBtn.addEventListener('click', openModal);
  }

  // Clique direto no preview da imagem
  if (portraitPreview) {
    portraitPreview.addEventListener('click', function (e) {
      if (e.target.tagName === 'IMG') openModal();
    });
  }

  // Botão X do modal
  if (portraitModalClose) {
    portraitModalClose.addEventListener('click', closeModal);
  }

  // Clique no backdrop (fora da imagem)
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }

  // Tecla Esc
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && portraitModal && portraitModal.classList.contains('is-open')) {
      closeModal();
    }
  });
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
  try { initDiceSystem(); } catch(e) { console.error('[initApp] initDiceSystem:', e); }
  try { initAwakening(); } catch(e) { console.error('[initApp] initAwakening:', e); }
  try { initInventoryButtons(); } catch(e) { console.error('[initApp] initInventoryButtons:', e); }
  try { initLinkFilters(); } catch(e) { console.error('[initApp] initLinkFilters:', e); }
  try { initLoreCollapse(); } catch(e) { console.error('[initApp] initLoreCollapse:', e); }
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

// =============================================
// ROLAGEM POR CLIQUE — clicar no NOME de um atributo/habilidade
// Combate: 1d20 + atributo final · Social: 1d20 + pontos atuais
// Delegação no document (labels são estáticos no HTML).
// =============================================
document.addEventListener('click', function(e) {
  var t = e.target;
  if (!t || !t.closest) return;
  var attrEl = t.closest('.attr-roll');
  if (attrEl && attrEl.dataset && attrEl.dataset.attr) {
    e.preventDefault();
    rollQuick('combat', attrEl.dataset.attr);
    return;
  }
  var socEl = t.closest('.social-roll');
  if (socEl && socEl.dataset && socEl.dataset.social) {
    e.preventDefault();
    rollQuick('social', socEl.dataset.social);
  }
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

// Restaurar o backup de segurança (criado antes de resetar/importar).
var restoreBackupBtn = document.getElementById('restore-backup');
if (restoreBackupBtn) restoreBackupBtn.addEventListener('click', function() {
  var bk = getSafetyBackup();
  if (!bk || !bk.sheetData) {
    showToast('Nenhum backup de seguran\u00e7a dispon\u00edvel', 'info');
    return;
  }
  var quando = '';
  try { quando = new Date(bk.savedAt).toLocaleString(); } catch (e) {}
  if (!confirm('Restaurar o backup de seguran\u00e7a' + (quando ? ' de ' + quando : '') + '?\nA ficha atual ser\u00e1 substitu\u00edda.')) return;
  try {
    applySnapshot(bk.sheetData);
    saveActiveSnapshot(snapshot());
    refreshProfilesUI();
    showToast('\u2713 Backup restaurado', 'success');
  } catch (e) {
    console.error('[Backup] Erro ao restaurar:', e);
    showToast('Erro ao restaurar backup', 'error');
  }
});

// Rolar Dano da Arma — usa o campo WeaponDmg como fórmula (ex.: STRd8)
var rollWeaponBtn = document.getElementById('roll-weapon-dmg');
if (rollWeaponBtn) rollWeaponBtn.addEventListener('click', function() {
  var formula = (ids.WeaponDmg ? ids.WeaponDmg.value : '') || '';
  var nome = (ids.Weapon && ids.Weapon.value.trim()) ? ids.Weapon.value.trim() : 'Arma';
  rollDamage(formula, nome);
});

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
    saveActiveSnapshot(snapshot());
    refreshProfilesUI();
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
  var active = getActiveProfile();
  if (!active || !active.sheetData) return showToast('Nenhuma ficha salva', 'info');
  try { applySnapshot(active.sheetData); refreshProfilesUI(); showToast('\u2713 Ficha carregada', 'success'); }
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

// =============================================
// AUTO-LOAD (via sistema de perfis)
// =============================================

var _autoLoaded = false;
try {
  loadProfileStore(); // carrega perfis e migra a ficha antiga, se existir
  var _active = getActiveProfile();
  if (_active && _active.sheetData && Object.keys(_active.sheetData).length) {
    applySnapshot(_active.sheetData);
    _autoLoaded = true;
  }
} catch (e) {
  console.warn('[Auto-load] Erro ao carregar perfis:', e);
}
if (!_autoLoaded) {
  seed();
  // Cria o primeiro perfil a partir da ficha semente atual.
  try { saveActiveSnapshot(snapshot()); } catch (e) {}
}

// =============================================
// AUTO-SAVE
// =============================================

var saveIndicator = document.createElement('div');
saveIndicator.id = 'auto-save-indicator';
saveIndicator.setAttribute('role', 'status');
saveIndicator.setAttribute('aria-live', 'polite');
saveIndicator.style.cssText = 'position:fixed;bottom:16px;right:16px;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:700;color:#fff;background:rgba(30,30,30,0.85);opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9999;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);';
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
    saveActiveSnapshot(snapshot());
    refreshProfilesUI();
    showSaveStatus('Salvo \u2714', 2000);
    recordHistory();
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
  var el = document.getElementById(id);
  if (el) tableObserver.observe(el, { childList: true, subtree: true });
});
var spellGrid = document.getElementById('spell-grid');
if (spellGrid) tableObserver.observe(spellGrid, { childList: true, subtree: true });

// Safety net: salvar ao fechar
window.addEventListener('beforeunload', function() {
  try { saveActiveSnapshot(snapshot()); } catch (e) {}
});

// =============================================
// INICIALIZAÇÃO DA INTERFACE DE PERFIS
// =============================================

try {
  initProfilesUI({
    onSwitch:       switchToProfile,
    onCreate:       createNewProfile,
    onDuplicate:    duplicateExistingProfile,
    onDelete:       deleteExistingProfile,
    onRename:       renameExistingProfile,
    onAvatarChange: changeProfileAvatar,
    toast:          showToast
  });
} catch (e) {
  console.error('[Perfis] Erro ao inicializar interface de perfis:', e);
}

// =============================================
// HISTÓRICO — DESFAZER / REFAZER (camada aditiva)
// =============================================

try {
  initHistory({
    getSnapshot: snapshot,
    applySnapshot: applySnapshot,
    afterRestore: function() {
      try { saveActiveSnapshot(snapshot()); refreshProfilesUI(); } catch (e) {}
    }
  });
} catch (e) {
  console.warn('[Histórico] Falha ao inicializar:', e);
}

var undoBtn = document.getElementById('undo-btn');
if (undoBtn) undoBtn.addEventListener('click', function() {
  if (undo()) showToast('Desfeito', 'info', 1200);
});
var redoBtn = document.getElementById('redo-btn');
if (redoBtn) redoBtn.addEventListener('click', function() {
  if (redo()) showToast('Refeito', 'info', 1200);
});

// Verifica se o foco está em um campo editável (para não interceptar o
// desfazer nativo do texto).
function _isEditableTarget(el) {
  if (!el) return false;
  var tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

// Atalhos globais: Ctrl+Z (desfazer) / Ctrl+Y ou Ctrl+Shift+Z (refazer).
document.addEventListener('keydown', function(e) {
  if (!(e.ctrlKey || e.metaKey)) return;
  var k = (e.key || '').toLowerCase();
  if (k === 'z' && !e.shiftKey) {
    if (_isEditableTarget(e.target)) return; // preserva o desfazer do campo
    e.preventDefault();
    if (undo()) showToast('Desfeito', 'info', 1200);
  } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
    if (_isEditableTarget(e.target)) return;
    e.preventDefault();
    if (redo()) showToast('Refeito', 'info', 1200);
  }
});

// =============================================
// EXPOR API GLOBAL (para debugging e interoperabilidade)
// =============================================

window.state = state;
window.setState = setState;
window.getState = getState;
window.autoSave = autoSave;
