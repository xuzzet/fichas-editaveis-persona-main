// =============================================
// UI - CAMPOS E BADGES
// Renderizacao de campos simples e badges de atributos.
// =============================================
import { state, FIELD_IDS } from '../state.js';
import { ids } from './dom-cache.js';

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
