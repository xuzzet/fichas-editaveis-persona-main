// =============================================
// UI - RETRATO, BACKGROUND E LORE
// =============================================
import { state } from '../state.js';

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

export function initLoreCollapse() {
  document.querySelectorAll('.lore-collapse-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var targetId = btn.getAttribute('data-target');
      var body = document.getElementById(targetId);
      if (!body) return;
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      body.classList.toggle('lore-collapsed', expanded);
    });
  });
}
