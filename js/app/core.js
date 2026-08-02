// =============================================
// APP — NÚCLEO (aqui eu junto renderAll / setState / getState)
// Essa é minha fachada de estado e render completo. É aqui também que
// eu injeto o renderAll lá no storage.
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
import { renderNaturalAbilities } from '../natural-abilities.js';
import { setRenderAll } from '../storage.js';

// =============================================
// RENDERIZAÇÃO COMPLETA (quando eu quero redesenhar tudo de uma vez)
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
    renderNaturalAbilities();
    initAutoResizeTextareas();
  } finally {
    setRendering(false);
  }
}

// Aqui eu injeto o renderAll dentro do storage.js — fiz assim pra fugir
// da dependência circular entre os dois módulos.
setRenderAll(renderAll);

// =============================================
// setState / getState (como eu leio e escrevo no estado)
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

// Aqui eu recalculo os atributos finais, valido e renderizo de novo.
// Deixei isso exposto pros módulos que mexem em fontes de bônus fora do
// fluxo do setState (ex.: os bônus automáticos de equipamento no inventário).
window.recalcAndRender = function() {
  recalcState();
  validateState();
  render();
};
