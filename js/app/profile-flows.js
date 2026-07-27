// =============================================
// APP — FLUXOS DE FICHA E PERFIL
// Reset da ficha e orquestracao de troca/criacao/exclusao de perfis.
// =============================================

import { state, FIELD_IDS, NUMBER_FIELDS, RECALC_FIELDS } from '../state.js';
import { recalcState, validateState } from '../calculations.js';
import { buildAffinityTable, showToast, renderPortrait } from '../ui.js';
import { snapshot, applySnapshot } from '../storage.js';
import {
  saveActiveSnapshot, getActiveId, switchProfile, createProfile,
  duplicateProfile, deleteProfile, renameProfile, setProfileAvatar, isFull
} from '../profiles.js';
import { refreshProfilesUI } from '../profiles-ui.js';
import { saveSafetyBackup } from '../backup.js';
import { renderAll, setState } from './core.js';

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

export function resetFicha() {
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
export function switchToProfile(id) {
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
export function createNewProfile(name, avatarDataUrl) {
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
export function duplicateExistingProfile(id) {
  // Garante que o perfil ativo esteja salvo antes de copiar.
  try { saveActiveSnapshot(snapshot()); } catch (e) {}
  return duplicateProfile(id);
}

// Exclui um perfil; se era o ativo, carrega o novo ativo.
export function deleteExistingProfile(id) {
  var res = deleteProfile(id);
  if (res && res.ok && res.switched && res.newActive) {
    applySnapshot(res.newActive.sheetData || {});
  }
  return res;
}

// Renomeia; se for o perfil ativo, reflete no estado ao vivo.
export function renameExistingProfile(id, name) {
  var res = renameProfile(id, name);
  if (res && res.ok && id === getActiveId()) {
    setState({ CharPlayer: res.profile.name });
  }
  return res;
}

// Altera o avatar; se for o perfil ativo, reflete no retrato ao vivo.
export function changeProfileAvatar(id, dataUrl) {
  var res = setProfileAvatar(id, dataUrl);
  if (res && res.ok && id === getActiveId()) {
    state.portrait = { src: dataUrl || '' };
    renderPortrait();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  }
  return res;
}
