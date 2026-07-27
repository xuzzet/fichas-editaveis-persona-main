// =============================================
// PAINEL DE CONFIGURAÇÕES (roda / engrenagem)
// Agrupa temas, acessibilidade e atalho de perfis.
// Depende de: profiles-ui.js (abrir gerenciador de fichas)
// =============================================

import { openProfileManager } from './profiles-ui.js';

var gear, overlay, panel, closeBtn, profilesBtn;
var lastFocus = null;

function openPanel() {
  if (!panel) return;
  lastFocus = document.activeElement;
  overlay.hidden = false;
  panel.hidden = false;
  // Força reflow para permitir a transição de entrada.
  void panel.offsetWidth;
  document.body.classList.add('settings-open');
  gear.setAttribute('aria-expanded', 'true');
  if (closeBtn) closeBtn.focus();
  document.addEventListener('keydown', onKeydown);
}

function closePanel() {
  if (!panel || panel.hidden) return;
  document.body.classList.remove('settings-open');
  gear.setAttribute('aria-expanded', 'false');
  overlay.hidden = true;
  panel.hidden = true;
  document.removeEventListener('keydown', onKeydown);
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}

function togglePanel() {
  if (panel && panel.hidden) openPanel(); else closePanel();
}

function onKeydown(e) {
  if (e.key === 'Escape') { e.preventDefault(); closePanel(); }
}

export function initSettings() {
  gear = document.getElementById('settingsGear');
  overlay = document.getElementById('settingsOverlay');
  panel = document.getElementById('settingsPanel');
  closeBtn = document.getElementById('settingsClose');
  profilesBtn = document.getElementById('settingsProfiles');
  if (!gear || !panel) return;

  gear.addEventListener('click', togglePanel);
  if (closeBtn) closeBtn.addEventListener('click', closePanel);
  if (overlay) overlay.addEventListener('click', closePanel);

  // Atalho de perfis: fecha o painel e abre o gerenciador de fichas.
  if (profilesBtn) {
    profilesBtn.addEventListener('click', function () {
      closePanel();
      openProfileManager();
    });
  }
}
