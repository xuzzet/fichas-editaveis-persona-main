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
    var color = HX.colors[s.id] || 'var(--accent)';

    // Update target radius for animation
    var targetR = HX.tipR(tier);
    if (Math.abs(HX.targetRadii[i] - targetR) > 0.1) {
      HX.targetRadii[i] = targetR;
      tierChanged = true;
    }

    // Dot cresce e halo intensifica conforme o tier.
    var dotEl = document.getElementById(s.id + '-hx-dot');
    if (dotEl) { dotEl.setAttribute('r', (3.5 + tier * 0.9).toFixed(1)); dotEl.setAttribute('fill', color); }
    var haloEl = document.getElementById(s.id + '-hx-halo');
    if (haloEl) { haloEl.setAttribute('opacity', (0.06 + tier * 0.03).toFixed(2)); haloEl.setAttribute('fill', color); }

    // Número de pontos por eixo (oculto quando zero).
    var valEl = document.getElementById(s.id + '-hx-val');
    if (valEl) valEl.textContent = val > 0 ? String(val) : '';

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

    // Rótulo acessível do alvo de clique/foco.
    var hitEl = document.getElementById(s.id + '-hx-hit');
    if (hitEl) {
      hitEl.setAttribute('aria-label',
        meta.name + ', Tier ' + ROMAN[tier] + ' — ' +
        (meta.titles[tier] || meta.titles[meta.titles.length - 1]));
    }

    // Burst de brilho ao SUBIR de tier (não dispara no 1º render/carregamento).
    if (HX.prevInit && tier > HX.prevTiers[i]) {
      var burst = document.getElementById(s.id + '-hx-burst');
      if (burst) {
        burst.classList.remove('hx-burst-go');
        void burst.getBoundingClientRect();
        burst.classList.add('hx-burst-go');
      }
    }
    HX.prevTiers[i] = tier;

    sum += val;
  });

  HX.prevInit = true;

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
