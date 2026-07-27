// =============================================
// SOCIAL - HEXAGRAMA: GEOMETRIA E ANIMACAO
// Objeto HX (layout/estado), atualizacao do SVG e animacao RAF.
// =============================================

var HX_REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  prevTiers:   null,   // tier anterior por eixo (p/ burst ao subir)
  prevInit:    false,  // evita burst no primeiro render/carregamento
  animRunning: false,
  // Cor por eixo (paleta de Social Links, saturada para contraste
  // AA tanto em fundo escuro quanto claro).
  colors: {
    KNOPts: '#2f7fc4', // Conhecimento — azul
    DISPts: '#7a54c0', // Disciplina — roxo
    EMPpts: '#2f9e5e', // Empatia — verde
    EXPPts: '#d1741f', // Expressão — laranja
    COUPts: '#d1453d', // Coragem — vermelho
    CHAPts: '#c23f92'  // Charme — magenta
  },
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
  HX.prevTiers   = HX.skills.map(function() { return 0; });
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
    // Anel de "burst" ao subir de tier segue a ponta.
    var burst = document.getElementById(s.id + '-hx-burst');
    if (burst) { burst.setAttribute('cx', cx); burst.setAttribute('cy', cy); }
    // Número de pontos posicionado logo à frente da ponta.
    var val = document.getElementById(s.id + '-hx-val');
    if (val) {
      var vr = HX.animRadii[i] + 14;
      val.setAttribute('x', (HX.CX + vr * s.cos).toFixed(2));
      val.setAttribute('y', (HX.CY - vr * s.sin + 3.5).toFixed(2));
    }
  });
}

/** RAF-based exponential ease-out interpolation toward targetRadii. */
function hxAnimate() {
  // Respeita preferência por menos movimento: salta direto ao alvo.
  if (HX_REDUCE.matches) {
    HX.skills.forEach(function(s, i) { HX.animRadii[i] = HX.targetRadii[i]; });
    hxUpdateProgress();
    HX.animRunning = false;
    return;
  }
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
