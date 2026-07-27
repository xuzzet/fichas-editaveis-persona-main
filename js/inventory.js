// =============================================
// INVENTARIO — BARREL / ORQUESTRACAO
// Reune os modulos de dominio (itens, magias, vinculos, pistas, contatos)
// e preserva a API publica usada por app.js, storage.js e ui.js.
// =============================================

import { state } from './state.js';
import { migrateEquipItem, addInventoryItem, renderInventoryStatus, syncEquipToState, eqBodyEquipado, eqBodyMochila } from './inventory/items.js';
import { addSpell, syncSpellsToState, initSpellFilters, _updateSpellEmpty, spellBody } from './inventory/spells.js';
import { addLink, renderLinkSummary, syncLinksToState, linkBody } from './inventory/links.js';
import { addClue, syncCluesToState, clueBody } from './inventory/clues.js';
import { addCtt, syncContactsToState, cttBody } from './inventory/contacts.js';

export * from './inventory/items.js';
export * from './inventory/spells.js';
export * from './inventory/links.js';
export * from './inventory/clues.js';
export * from './inventory/contacts.js';

// =============================================
// RENDER TODAS AS TABELAS A PARTIR DO STATE
// =============================================

export function renderTables() {
  // Inventário: migrar e renderizar nas duas seções
  if (eqBodyEquipado) eqBodyEquipado.innerHTML = '';
  if (eqBodyMochila) eqBodyMochila.innerHTML = '';
  (state.equip || []).forEach(function(item) {
    var migrated = migrateEquipItem(item);
    addInventoryItem(migrated, migrated.local);
  });
  renderInventoryStatus();

  if (spellBody) { spellBody.innerHTML = ''; (state.spells || []).forEach(addSpell); }
  if (linkBody) { linkBody.innerHTML = ''; (state.links || []).forEach(addLink); renderLinkSummary(); }
  if (clueBody) { clueBody.innerHTML = ''; (state.clues || []).forEach(addClue); }
  if (cttBody) { cttBody.innerHTML = ''; (state.contacts || []).forEach(addCtt); }
}

// =============================================
// BOTÕES DE ADICIONAR LINHAS
// =============================================

export function initInventoryButtons() {
  var addEqEquipadoBtn = document.querySelector('#add-eq-equipado');
  if (addEqEquipadoBtn) addEqEquipadoBtn.addEventListener('click', function() {
    addInventoryItem({}, 'equipado');
    syncEquipToState();
    renderInventoryStatus();
  });

  var addEqMochilaBtn = document.querySelector('#add-eq-mochila');
  if (addEqMochilaBtn) addEqMochilaBtn.addEventListener('click', function() {
    addInventoryItem({}, 'mochila');
    syncEquipToState();
    renderInventoryStatus();
  });

  var addSpellBtn = document.querySelector('#add-spell');
  if (addSpellBtn) addSpellBtn.addEventListener('click', function() {
    addSpell();
    syncSpellsToState();
  });

  initSpellFilters();
  _updateSpellEmpty();

  var addLinkBtn = document.querySelector('#add-link');
  if (addLinkBtn) addLinkBtn.addEventListener('click', function() { addLink(); syncLinksToState(); renderLinkSummary(); });

  var addClueBtn = document.querySelector('#add-clue');
  if (addClueBtn) addClueBtn.addEventListener('click', function() { addClue(); syncCluesToState(); });

  var addCttBtn = document.querySelector('#add-ctt');
  if (addCttBtn) addCttBtn.addEventListener('click', function() { addCtt(); syncContactsToState(); });
}
