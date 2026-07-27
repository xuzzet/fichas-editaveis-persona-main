// =============================================
// APP — NUCLEO (renderAll / setState / getState)
// Fachada de estado e render completo. Injeta renderAll no storage.
// =============================================

import { state, NUMBER_FIELDS, RECALC_FIELDS, setRendering } from '../state.js';
import { recalcState, validateState } from '../calculations.js';
import {
  render, renderFields, renderBadges, renderAffinities, renderPortrait,
  renderBackground, buildAutoSummaryPanel, renderAutoSummary, initAutoResizeTextareas
} from '../ui.js';
import { renderSocial } from '../social-skills.js';
import { renderTables } from '../inventory.js';
import { renderFeitos } from '../feats.js';
import { renderConditions } from '../conditions.js';
import { renderModifiers, renderModSummary } from '../modifiers.js';
import { renderDiceHistory } from '../dice.js';
import { renderAwakening } from '../awakening.js';
import { setRenderAll } from '../storage.js';

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

// Injetar renderAll em storage.js (evita dependencia circular)
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
