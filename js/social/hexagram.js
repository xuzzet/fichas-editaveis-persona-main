// =============================================
// SOCIAL - HEXAGRAMA: GEOMETRIA E ANIMACAO
// Objeto HX (layout/estado), atualizacao do SVG e animacao RAF.
// =============================================

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
