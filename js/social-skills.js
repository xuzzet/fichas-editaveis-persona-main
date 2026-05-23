// =============================================
// HEXAGRAMA E HABILIDADES SOCIAIS UI
// Depende de: state.js, constants.js
// =============================================

import { state } from './state.js';
import { SOCIAL_SKILL_META, SOCIAL_IDS, INITIAL_SOCIAL_POINTS } from './constants.js';

// =============================================
// HEXAGRAMA — LAYOUT & ANIMAÇÃO
// =============================================

export var HX = {
  CX: 310, CY: 280,    // SVG centre
  R:   135,            // outer radius  = Tier V
  Rmin: 15,            // inner radius  = Tier 0
  Ri:   70,            // inner decorative hexagon
  LR:  218,            // label anchor radius
  W: 660, H: 580,
  TIER_MAX: 5,
  skills: null,        // populated below
  animRadii:   null,
  targetRadii: null,
  animRunning: false,
  rad: function(d) { return d * Math.PI / 180; },
  tipR: function(tier) { return HX.Rmin + (tier / HX.TIER_MAX) * (HX.R - HX.Rmin); }
};

(function _initHX() {
  HX.skills = [
    { id: 'KNOPts', angle: 90,   anchor: 'middle' },
    { id: 'DISPts', angle: 30,   anchor: 'start'  },
    { id: 'EMPpts', angle: -30,  anchor: 'start'  },
    { id: 'EXPPts', angle: -90,  anchor: 'middle' },
    { id: 'COUPts', angle: -150, anchor: 'end'    },
    { id: 'CHAPts', angle: 150,  anchor: 'end'    }
  ];
  HX.skills.forEach(function(s) {
    var ar = HX.rad(s.angle);
    s.tx  = HX.CX + HX.R  * Math.cos(ar);  // outer tip pos (Tier V)
    s.ty  = HX.CY - HX.R  * Math.sin(ar);
    s.lx  = HX.CX + HX.LR * Math.cos(ar);  // label anchor
    s.ly  = HX.CY - HX.LR * Math.sin(ar);
    s.cos = Math.cos(ar);
    s.sin = Math.sin(ar);
  });
  HX.animRadii   = HX.skills.map(function() { return HX.Rmin; });
  HX.targetRadii = HX.skills.map(function() { return HX.Rmin; });
}());

/** Flush current animRadii into the SVG (fill polygon + moving dots/halos). */
function hxUpdateProgress() {
  var fillEl   = document.getElementById('hx-progress-fill');
  var strokeEl = document.getElementById('hx-progress-stroke');
  if (!fillEl) return;
  var pts = HX.skills.map(function(s, i) {
    return (HX.CX + HX.animRadii[i] * s.cos).toFixed(2) + ',' +
           (HX.CY - HX.animRadii[i] * s.sin).toFixed(2);
  }).join(' ');
  fillEl.setAttribute('points', pts);
  if (strokeEl) strokeEl.setAttribute('points', pts);
  HX.skills.forEach(function(s, i) {
    var cx = (HX.CX + HX.animRadii[i] * s.cos).toFixed(2);
    var cy = (HX.CY - HX.animRadii[i] * s.sin).toFixed(2);
    var dot  = document.getElementById(s.id + '-hx-dot');
    var halo = document.getElementById(s.id + '-hx-halo');
    if (dot)  { dot.setAttribute('cx',  cx); dot.setAttribute('cy',  cy); }
    if (halo) { halo.setAttribute('cx', cx); halo.setAttribute('cy', cy); }
  });
}

/** RAF-based exponential ease-out interpolation toward targetRadii. */
function hxAnimate() {
  var done = true;
  HX.skills.forEach(function(s, i) {
    var diff = HX.targetRadii[i] - HX.animRadii[i];
    if (Math.abs(diff) > 0.3) {
      HX.animRadii[i] += diff * 0.18;
      done = false;
    } else {
      HX.animRadii[i] = HX.targetRadii[i];
    }
  });
  hxUpdateProgress();
  if (done) {
    HX.animRunning = false;
  } else {
    requestAnimationFrame(hxAnimate);
  }
}

export function hxStartAnimation() {
  if (HX.animRunning) return;
  HX.animRunning = true;
  requestAnimationFrame(hxAnimate);
}

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

// =============================================
// CONSTRUÇÃO DO HEXAGRAMA UI
// =============================================

export function buildSocialUI() {
  var container = document.getElementById('social-tier-list');
  var remainingEl = document.getElementById('social-remaining');
  if (!container || !remainingEl) return;

  container.innerHTML = '';

  var NS = 'http://www.w3.org/2000/svg';
  var CX = HX.CX, CY = HX.CY, R = HX.R;
  var skills = HX.skills;

  function mk(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function(k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  // Regular hexagon polygon points centred at (cx,cy) with radius r
  function hexPts(cx, cy, r) {
    return [0,1,2,3,4,5].map(function(i) {
      var a = HX.rad(90 - i * 60);
      return (cx + r * Math.cos(a)).toFixed(2) + ',' + (cy - r * Math.sin(a)).toFixed(2);
    }).join(' ');
  }

  // Initial progress polygon (all tips at Rmin)
  function fillPts0() {
    return skills.map(function(s) {
      return (CX + HX.Rmin * s.cos).toFixed(2) + ',' + (CY - HX.Rmin * s.sin).toFixed(2);
    }).join(' ');
  }

  var svg = mk('svg', { viewBox: '0 0 ' + HX.W + ' ' + HX.H, width: '100%', 'aria-hidden': 'true' });
  svg.style.cssText = 'max-width:640px;display:block;margin:0 auto;overflow:visible;';

  // DEFS -- single glow used for tip dots
  var defs = mk('defs', {});
  var fGlow = mk('filter', { id: 'hx-glow', x: '-80%', y: '-80%', width: '260%', height: '260%' });
  fGlow.appendChild(mk('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '3', result: 'blur' }));
  var fMerge = mk('feMerge', {});
  fMerge.appendChild(mk('feMergeNode', { in: 'blur' }));
  fMerge.appendChild(mk('feMergeNode', { in: 'SourceGraphic' }));
  fGlow.appendChild(fMerge);
  defs.appendChild(fGlow);
  svg.appendChild(defs);

  // -- LAYER 1: Tier rings (T1..T4 subtle guides + T5 outer boundary) --
  for (var t = 1; t <= 5; t++) {
    var rT = HX.tipR(t);
    var isOuter = (t === 5);
    svg.appendChild(mk('polygon', {
      points: hexPts(CX, CY, rT),
      fill: 'none',
      stroke: 'var(--stroke)',
      'stroke-width': isOuter ? '1.5' : '0.9',
      'stroke-opacity': isOuter ? '0.55' : '0.25',
      'stroke-linejoin': 'round'
    }));
  }

  // -- LAYER 2: Radial spokes from centre to each outer tip --
  skills.forEach(function(s) {
    svg.appendChild(mk('line', {
      x1: CX, y1: CY,
      x2: s.tx.toFixed(2), y2: s.ty.toFixed(2),
      stroke: 'var(--stroke)',
      'stroke-width': '0.9',
      'stroke-opacity': '0.30'
    }));
  });

  // -- LAYER 3: Progress fill polygon --
  svg.appendChild(mk('polygon', {
    id: 'hx-progress-fill',
    points: fillPts0(),
    fill: 'var(--accent)',
    'fill-opacity': '0.18',
    stroke: 'none'
  }));

  // -- LAYER 4: Progress stroke polygon --
  svg.appendChild(mk('polygon', {
    id: 'hx-progress-stroke',
    points: fillPts0(),
    fill: 'none',
    stroke: 'var(--accent)',
    'stroke-width': '2.5',
    'stroke-opacity': '0.85',
    'stroke-linejoin': 'round'
  }));

  // -- LAYER 5: Central node (no text) --
  svg.appendChild(mk('circle', { cx: CX, cy: CY, r: '6', fill: 'var(--accent)', opacity: '0.50', filter: 'url(#hx-glow)' }));
  svg.appendChild(mk('circle', { cx: CX, cy: CY, r: '4', fill: 'var(--accent)' }));

  // -- LAYER 6: Dynamic tip halos + dots (repositioned by hxUpdateProgress) --
  skills.forEach(function(s) {
    var ix = (CX + HX.Rmin * s.cos).toFixed(2);
    var iy = (CY - HX.Rmin * s.sin).toFixed(2);
    svg.appendChild(mk('circle', {
      id: s.id + '-hx-halo',
      cx: ix, cy: iy, r: '14',
      fill: 'var(--accent)', opacity: '0.12', filter: 'url(#hx-glow)'
    }));
    svg.appendChild(mk('circle', {
      id: s.id + '-hx-dot',
      cx: ix, cy: iy, r: '4',
      fill: 'var(--accent)', filter: 'url(#hx-glow)'
    }));
  });

  // -- LAYER 7: Labels at fixed outer positions --
  skills.forEach(function(s) {
    var meta = SOCIAL_SKILL_META[s.id];
    var g = mk('g', { id: s.id + '-hx-label-g', class: 'hx-tip' });

    var nameEl = mk('text', {
      x: s.lx.toFixed(2), y: (s.ly - 16).toFixed(2),
      'text-anchor': s.anchor,
      'font-size': '13', 'font-weight': '900', 'letter-spacing': '0.10em',
      fill: 'var(--ink)'
    });
    nameEl.textContent = meta.name.toUpperCase();
    g.appendChild(nameEl);

    var tierEl = mk('text', {
      id: s.id + '-hx-tier',
      x: s.lx.toFixed(2), y: (s.ly + 4).toFixed(2),
      'text-anchor': s.anchor,
      'font-size': '12', 'font-weight': '700', 'letter-spacing': '0.16em',
      fill: 'var(--accent)'
    });
    tierEl.textContent = 'TIER 0';
    g.appendChild(tierEl);

    var titleEl = mk('text', {
      id: s.id + '-hx-title',
      x: s.lx.toFixed(2), y: (s.ly + 22).toFixed(2),
      'text-anchor': s.anchor,
      'font-size': '11', 'font-weight': '400', 'letter-spacing': '0.05em',
      fill: 'var(--ink-dim)'
    });
    titleEl.textContent = meta.titles[0];
    g.appendChild(titleEl);

    svg.appendChild(g);
  });

  // -- LAYER 8: Click targets for skill selection --

  // Detail panel (below the SVG inside container)
  var detailEl = document.createElement('div');
  detailEl.id = 'hx-detail';
  detailEl.innerHTML = '<p class="hx-detail-empty">Selecione uma habilidade social no hexagrama para ver seus detalhes.</p>';

  var ROMAN_HX = ['0', 'I', 'II', 'III', 'IV', 'V'];

  function getSkillInfo(skillId) {
    var meta = SOCIAL_SKILL_META[skillId];
    var inp  = document.getElementById(skillId);
    var pts  = inp ? (parseInt(inp.value, 10) || 0) : 0;
    // Same formula used everywhere else in the system
    var tier = Math.min(5, Math.floor(pts / 5));
    var title = meta.titles[tier] || meta.titles[meta.titles.length - 1] || skillId;
    var desc  = meta.desc[tier] || 'Descrição não disponível para este tier.';
    // Collect all unlocked tiers (0 through current) for history display
    var unlockedTiers = [];
    for (var t = 0; t <= tier; t++) {
      unlockedTiers.push({
        tier: t,
        roman: ROMAN_HX[t] || String(t),
        title: meta.titles[t] || '',
        desc: meta.desc[t] || '',
        isCurrent: (t === tier)
      });
    }
    return {
      name:   meta.name,
      tier:   tier,
      roman:  ROMAN_HX[tier] || String(tier),
      title:  title,
      desc:   desc,
      unlockedTiers: unlockedTiers
    };
  }

  function renderPanel(info) {
    var tiersHtml = (info.unlockedTiers || [{ tier: info.tier, roman: info.roman, title: info.title, desc: info.desc, isCurrent: true }]).map(function(t) {
      var cls = t.isCurrent ? 'hx-tier-entry hx-tier-current' : 'hx-tier-entry hx-tier-past';
      return '<div class="' + cls + '">' +
        '<div class="hx-tier-entry-badge">Tier ' + t.roman + ' — ' + t.title.toUpperCase() + '</div>' +
        '<p class="hx-tier-entry-desc">' + t.desc + '</p>' +
      '</div>';
    }).join('');
    detailEl.innerHTML =
      '<div class="hx-detail-header">' +
        '<span class="hx-detail-name">' + info.name.toUpperCase() + '</span>' +
        '<span class="hx-detail-tier">TIER ' + info.roman + ' — ' + info.title.toUpperCase() + '</span>' +
      '</div>' +
      '<div class="hx-detail-tiers">' + tiersHtml + '</div>';
  }

  function resetPanel() {
    detailEl.innerHTML = '<p class="hx-detail-empty">Selecione uma habilidade social no hexagrama para ver seus detalhes.</p>';
  }

  // Track which skill is currently selected
  var selectedSkillId = null;

  // Per-skill selection ring (subtle highlight, drawn before hit targets)
  skills.forEach(function(s) {
    var selRing = mk('circle', {
      id: s.id + '-hx-sel',
      cx: s.lx.toFixed(2), cy: s.ly.toFixed(2),
      r: '48',
      fill: 'var(--accent)',
      'fill-opacity': '0.08',
      stroke: 'var(--accent)',
      'stroke-width': '2',
      opacity: '0',
      'pointer-events': 'none'
    });
    svg.appendChild(selRing);
  });

  function hxSelect(skillId) {
    // Deselect all rings
    skills.forEach(function(sk) {
      var r = document.getElementById(sk.id + '-hx-sel');
      if (r) r.setAttribute('opacity', '0');
    });
    selectedSkillId = skillId;
    if (skillId) {
      var r = document.getElementById(skillId + '-hx-sel');
      if (r) r.setAttribute('opacity', '1');
      renderPanel(getSkillInfo(skillId));
    } else {
      resetPanel();
    }
  }

  // Expose refresh so renderSocial can update the panel when points change
  window._hxRefreshPanel = function() {
    if (selectedSkillId) renderPanel(getSkillInfo(selectedSkillId));
  };

  skills.forEach(function(s) {
    var hitCirc = mk('circle', {
      id: s.id + '-hx-hit',
      cx: s.lx.toFixed(2), cy: s.ly.toFixed(2),
      r: '42', fill: 'transparent', cursor: 'pointer'
    });
    svg.appendChild(hitCirc);

    var halo = document.getElementById(s.id + '-hx-halo');
    var selRing = document.getElementById(s.id + '-hx-sel');

    // Hover: light ring preview (no panel change)
    [hitCirc, halo].forEach(function(el) {
      if (!el) return;
      el.addEventListener('mouseenter', function() {
        if (selectedSkillId !== s.id && selRing) selRing.setAttribute('opacity', '0.35');
      });
      el.addEventListener('mouseleave', function() {
        if (selectedSkillId !== s.id && selRing) selRing.setAttribute('opacity', '0');
      });
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        if (selectedSkillId === s.id) {
          hxSelect(null);
        } else {
          hxSelect(s.id);
        }
      });
    });
  });

  // Click on SVG background deselects
  svg.addEventListener('click', function(e) {
    var tid = e.target && e.target.getAttribute && e.target.getAttribute('id');
    if (!tid || tid === 'hx-progress-fill' || tid === 'hx-progress-stroke') {
      hxSelect(null);
    }
  });

  container.appendChild(svg);
  container.appendChild(detailEl);

  // Re-center selection rings and hit circles on actual label bounding boxes
  skills.forEach(function(s) {
    var labelG = document.getElementById(s.id + '-hx-label-g');
    var ring   = document.getElementById(s.id + '-hx-sel');
    var hit    = document.getElementById(s.id + '-hx-hit');
    if (!labelG) return;
    try {
      var box = labelG.getBBox();
      var cx  = (box.x + box.width  / 2).toFixed(2);
      var cy  = (box.y + box.height / 2).toFixed(2);
      if (ring) { ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); }
      if (hit)  { hit.setAttribute('cx',  cx); hit.setAttribute('cy',  cy); }
    } catch(e) { /* getBBox unavailable (hidden tab) — keep original position */ }
  });
}
