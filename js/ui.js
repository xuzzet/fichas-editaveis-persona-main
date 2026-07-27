// =============================================
// UI - BARREL (API PUBLICA)
// Reexporta os modulos de UI e define render() (orquestrador de
// campos + badges + social + inventario + resumo).
// =============================================
import { setRendering } from './state.js';
import { renderFields, renderBadges } from './ui/fields.js';
import { renderSocial } from './social-skills.js';
import { renderInventoryStatus } from './inventory.js';
import { renderAutoSummary } from './ui/auto-summary.js';

export * from './ui/dom-cache.js';
export * from './ui/fields.js';
export * from './ui/auto-summary.js';
export * from './ui/portrait-bg.js';
export * from './ui/affinities.js';
export * from './ui/toast.js';
export * from './ui/textareas.js';

/**
 * Renderiza campos simples + badges a partir do state.
 * Para renderizacao completa (tabelas, feitos, etc.) use renderAll em app.js.
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
