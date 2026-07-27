// =============================================
// SOCIAL - RENDERIZACAO DAS HABILIDADES SOCIAIS
// =============================================
import { state } from '../state.js';
import { SOCIAL_SKILL_META, INITIAL_SOCIAL_POINTS } from '../constants.js';
import { HX, hxStartAnimation } from './hexagram.js';

// =============================================
// RENDERIZAÇÃO DAS HABILIDADES SOCIAIS
// =============================================

export function renderSocial() {
  var remainingEl = document.getElementById('social-remaining');
  if (!remainingEl) return;
  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V'];
  var sum = 0;
  var tierChanged = false;

  HX.skills.forEach(function(s, i) {
    var val = Math.max(0, Number(state[s.id]) || 0);
    // Sincroniza o badge do slider social (não altera o valor de state).
    var badgeEl = document.getElementById('b' + s.id);
    if (badgeEl) badgeEl.textContent = val;
    var tier = Math.min(5, Math.floor(val / 5));
    var meta = SOCIAL_SKILL_META[s.id];
    if (!meta) return;

    // Update target radius for animation
    var targetR = HX.tipR(tier);
    if (Math.abs(HX.targetRadii[i] - targetR) > 0.1) {
      HX.targetRadii[i] = targetR;
      tierChanged = true;
    }

    // Update label text
    var hxTier  = document.getElementById(s.id + '-hx-tier');
    var hxTitle = document.getElementById(s.id + '-hx-title');
    var newTierText = 'TIER ' + ROMAN[tier];
    if (hxTier && hxTier.textContent !== newTierText) {
      hxTier.textContent = newTierText;
      hxTier.classList.remove('hx-tier-flash');
      void hxTier.offsetWidth;
      hxTier.classList.add('hx-tier-flash');
    }
    if (hxTitle) hxTitle.textContent = meta.titles[tier] || meta.titles[meta.titles.length - 1];

    sum += val;
  });

  if (tierChanged) {
    hxStartAnimation();
    // Pulse the fill polygon to signal the shape change
    var fillEl = document.getElementById('hx-progress-fill');
    if (fillEl) {
      fillEl.classList.remove('hx-fill-pulse');
      void fillEl.offsetWidth;
      fillEl.classList.add('hx-fill-pulse');
    }
  }

  remainingEl.textContent = Math.max(0, INITIAL_SOCIAL_POINTS - sum);

  // Refresh the detail panel if a skill is currently selected
  if (window._hxRefreshPanel) window._hxRefreshPanel();
}
