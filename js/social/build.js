// =============================================
// SOCIAL - CONSTRUCAO DO HEXAGRAMA UI
// =============================================
import { SOCIAL_SKILL_META } from '../constants.js';
import { HX } from './hexagram.js';

// =============================================
// CONSTRUÇÃO DO HEXAGRAMA UI
// =============================================

export function buildSocialUI() {
  var container = document.getElementById('social-tier-list');
  var remainingEl = document.getElementById('social-remaining');
  if (!container || !remainingEl) return;

  container.innerHTML = '';

  var NS = 'http://www.w3.org/2000/svg';
  var CX = HX.CX, CY = HX.CY;
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

  // Estrela de 4 pontas (emblema central estilo P5R)
  function starPts(cx, cy, outer, inner, points) {
    var arr = [];
    var n = points * 2;
    for (var i = 0; i < n; i++) {
      var rr = (i % 2 === 0) ? outer : inner;
      var a = HX.rad(90 - i * (360 / n));
      arr.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy - rr * Math.sin(a)).toFixed(2));
    }
    return arr.join(' ');
  }

  var svg = mk('svg', { viewBox: '0 0 ' + HX.W + ' ' + HX.H, width: '100%', role: 'img', 'aria-label': 'Hexagrama de habilidades sociais' });
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
  // Gradiente radial do preenchimento (mais forte no centro).
  var grad = mk('radialGradient', { id: 'hx-fill-grad', cx: '50%', cy: '50%', r: '58%' });
  grad.appendChild(mk('stop', { offset: '0%', 'stop-color': 'var(--accent)', 'stop-opacity': '0.34' }));
  grad.appendChild(mk('stop', { offset: '100%', 'stop-color': 'var(--accent)', 'stop-opacity': '0.10' }));
  defs.appendChild(grad);
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

  // Numerais dos tiers (I..V) ao longo do eixo superior, para leitura da escala.
  var ROMAN_RING = ['0', 'I', 'II', 'III', 'IV', 'V'];
  for (var tr = 1; tr <= 5; tr++) {
    var num = mk('text', {
      x: (CX + 9).toFixed(2), y: (CY - HX.tipR(tr) + 3).toFixed(2),
      'text-anchor': 'start', 'font-size': '9', 'font-weight': '700',
      fill: 'var(--ink-dim)', opacity: '0.5', 'pointer-events': 'none'
    });
    num.textContent = ROMAN_RING[tr];
    svg.appendChild(num);
  }

  // -- LAYER 2: Radial spokes from centre to each outer tip (tracejados, cor por eixo) --
  skills.forEach(function(s) {
    svg.appendChild(mk('line', {
      class: 'hx-axis', 'data-skill': s.id,
      x1: CX, y1: CY,
      x2: s.tx.toFixed(2), y2: s.ty.toFixed(2),
      stroke: HX.colors[s.id] || 'var(--stroke)',
      'stroke-width': '1',
      'stroke-opacity': '0.28',
      'stroke-dasharray': '3 5'
    }));
  });

  // -- LAYER 3: Progress fill polygon (gradiente radial) --
  svg.appendChild(mk('polygon', {
    id: 'hx-progress-fill',
    points: fillPts0(),
    fill: 'url(#hx-fill-grad)',
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

  // -- LAYER 5: Central emblem (estrela de 4 pontas, estilo P5R) --
  svg.appendChild(mk('polygon', {
    points: starPts(CX, CY, 14, 5.2, 4),
    fill: 'var(--accent)', opacity: '0.55', filter: 'url(#hx-glow)'
  }));
  svg.appendChild(mk('polygon', {
    points: starPts(CX, CY, 9, 3.4, 4),
    fill: 'var(--accent)'
  }));

  // -- LAYER 6: Dynamic tip halos + dots + burst + número (cor por eixo) --
  skills.forEach(function(s) {
    var color = HX.colors[s.id] || 'var(--accent)';
    var ix = (CX + HX.Rmin * s.cos).toFixed(2);
    var iy = (CY - HX.Rmin * s.sin).toFixed(2);
    // Anel de burst (expande ao subir de tier)
    svg.appendChild(mk('circle', {
      id: s.id + '-hx-burst', class: 'hx-axis', 'data-skill': s.id,
      cx: ix, cy: iy, r: '4',
      fill: 'none', stroke: color, 'stroke-width': '2',
      opacity: '0', 'pointer-events': 'none'
    }));
    svg.appendChild(mk('circle', {
      id: s.id + '-hx-halo', class: 'hx-axis', 'data-skill': s.id,
      cx: ix, cy: iy, r: '14',
      fill: color, opacity: '0.12', filter: 'url(#hx-glow)'
    }));
    svg.appendChild(mk('circle', {
      id: s.id + '-hx-dot', class: 'hx-axis', 'data-skill': s.id,
      cx: ix, cy: iy, r: '4',
      fill: color, filter: 'url(#hx-glow)'
    }));
    // Número de pontos por eixo (atualizado em renderSocial)
    var valEl = mk('text', {
      id: s.id + '-hx-val', class: 'hx-axis hx-val', 'data-skill': s.id,
      x: ix, y: iy, 'text-anchor': 'middle',
      'font-size': '11', 'font-weight': '800', fill: color,
      'pointer-events': 'none'
    });
    valEl.textContent = '';
    svg.appendChild(valEl);
  });

  // -- LAYER 7: Labels at fixed outer positions --
  skills.forEach(function(s) {
    var meta = SOCIAL_SKILL_META[s.id];
    var g = mk('g', { id: s.id + '-hx-label-g', class: 'hx-tip hx-axis', 'data-skill': s.id });

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
      fill: HX.colors[s.id] || 'var(--accent)'
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

  // Destaca um eixo (raio + dot + rótulo) e esmaece os demais.
  function setAxisFocus(skillId) {
    if (skillId) svg.classList.add('hx-focusing');
    else svg.classList.remove('hx-focusing');
    skills.forEach(function(sk) {
      var on = (sk.id === skillId);
      svg.querySelectorAll('[data-skill="' + sk.id + '"]').forEach(function(el) {
        el.classList.toggle('hx-axis-active', on);
      });
      var sel = document.getElementById(sk.id + '-hx-sel');
      if (sel && sk.id !== selectedSkillId) sel.setAttribute('opacity', on ? '0.35' : '0');
    });
  }

  function focusSkillByIndex(idx) {
    var n = ((idx % skills.length) + skills.length) % skills.length;
    var hit = document.getElementById(skills[n].id + '-hx-hit');
    if (hit) hit.focus();
  }

  function toggleSelect(skillId) {
    if (selectedSkillId === skillId) hxSelect(null);
    else hxSelect(skillId);
  }

  skills.forEach(function(s, i) {
    var meta = SOCIAL_SKILL_META[s.id];
    var hitCirc = mk('circle', {
      id: s.id + '-hx-hit',
      cx: s.lx.toFixed(2), cy: s.ly.toFixed(2),
      r: '42', fill: 'transparent', cursor: 'pointer',
      tabindex: '0', role: 'button',
      'aria-label': (meta ? meta.name : s.id) + ', Tier 0'
    });
    svg.appendChild(hitCirc);

    var halo = document.getElementById(s.id + '-hx-halo');

    // Hover: destaca o eixo (apenas ponteiro fino). No toque, o realce
    // vem da seleção ao tocar.
    [hitCirc, halo].forEach(function(el) {
      if (!el) return;
      el.addEventListener('pointerenter', function(ev) {
        if (ev.pointerType === 'touch') return;
        if (selectedSkillId !== s.id) setAxisFocus(s.id);
      });
      el.addEventListener('pointerleave', function(ev) {
        if (ev.pointerType === 'touch') return;
        if (selectedSkillId !== s.id) setAxisFocus(null);
      });
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSelect(s.id);
      });
    });

    // Acessibilidade por teclado: foco realça o eixo; Enter/Espaço
    // seleciona; setas navegam entre habilidades.
    hitCirc.addEventListener('focus', function() { setAxisFocus(s.id); });
    hitCirc.addEventListener('blur', function() {
      if (selectedSkillId !== s.id) setAxisFocus(null);
    });
    hitCirc.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); toggleSelect(s.id);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault(); focusSkillByIndex(i + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); focusSkillByIndex(i - 1);
      }
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
