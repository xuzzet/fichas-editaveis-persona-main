// =============================================
// UI - AFINIDADES E ARCANOS
// =============================================
import { state } from '../state.js';
import { ELEMENTS, EL_IDS, RELS, ARCANAS } from '../constants.js';

// =============================================
// AFINIDADES
// =============================================

var AF_ICONS = {
  'Físico':    './Elements/Physical.png',
  'Fogo':       './Elements/Fire.png',
  'Gelo':       './Elements/Ice.png',
  'Vento':      './Elements/Wind.png',
  'Raio':       './Elements/Electric.png',
  'Nuclear':    './Elements/Nuclar.png',
  'PSY':        './Elements/Psi.png',
  'Luz':        './Elements/Bless.png',
  'Trevas':     './Elements/Curse.png',
  'Onipotente': './Elements/Almighty.png'
};

var AF_REL_CLASS = {
  'Normal': 'af--normal', 'Fraco': 'af--fraco', 'Resiste': 'af--resiste',
  'Anula': 'af--anula', 'Reflete': 'af--reflete', 'Absorve': 'af--absorve'
};

export function initArcanaSelects() {
  var arcSel1 = document.getElementById('CharArcana');
  var arcSel2 = document.getElementById('PerArcana');
  [arcSel1, arcSel2].forEach(function(sel) {
    if (sel) ARCANAS.forEach(function(a) { var o = document.createElement('option'); o.value = a; o.textContent = a; sel.appendChild(o); });
  });
}

export function buildAffinityTable() {
  var grid = document.getElementById('af-grid');
  if (!grid) return;
  grid.innerHTML = '';

  ELEMENTS.forEach(function(el) {
    var selId = 'AF_' + EL_IDS[el];

    var card = document.createElement('div');
    card.className = 'af-card af--normal';
    card.id = 'af-card-' + EL_IDS[el];
    card.dataset.element = el;

    var icon = document.createElement('div');
    icon.className = 'af-icon';
    var iconSrc = AF_ICONS[el];
    if (iconSrc) {
      var img = document.createElement('img');
      img.src = iconSrc;
      img.alt = el;
      img.className = 'af-icon-img';
      icon.appendChild(img);
    } else {
      icon.textContent = '◆';
    }

    var name = document.createElement('div');
    name.className = 'af-name';
    name.textContent = el;

    var sel = document.createElement('select');
    sel.id = selId;
    sel.className = 'af-select';
    RELS.forEach(function(r) {
      var o = document.createElement('option');
      o.value = r;
      o.textContent = r;
      sel.appendChild(o);
    });

    var badge = document.createElement('div');
    badge.className = 'af-badge';
    badge.textContent = 'Normal';

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(sel);
    card.appendChild(badge);
    grid.appendChild(card);

    sel.addEventListener('change', function() {
      _updateAffinityCard(card, sel.value);
      syncAffinityToState();
      renderAffinitySummary();
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    });
  });
}

function _updateAffinityCard(card, rel) {
  var cls = AF_REL_CLASS[rel] || 'af--normal';
  var classes = card.className.split(' ').filter(function(c) { return !/^af--/.test(c); });
  classes.push(cls);
  card.className = classes.join(' ');
  var badge = card.querySelector('.af-badge');
  if (badge) badge.textContent = rel;
}

export function syncAffinityToState() {
  var affin = {};
  ELEMENTS.forEach(function(e) {
    var sel = document.getElementById('AF_' + EL_IDS[e]);
    affin[e] = sel ? sel.value : 'Normal';
  });
  state.affinities = affin;
}

export function renderAffinities() {
  ELEMENTS.forEach(function(e) {
    var sel = document.getElementById('AF_' + EL_IDS[e]);
    if (sel && state.affinities[e]) {
      sel.value = state.affinities[e];
      var card = document.getElementById('af-card-' + EL_IDS[e]);
      if (card) _updateAffinityCard(card, state.affinities[e]);
    }
  });
  renderAffinitySummary();
}

export function renderAffinitySummary() {
  var summaryEl = document.getElementById('af-summary');
  if (!summaryEl) return;

  var RELS_SUMMARY = ['Fraco', 'Resiste', 'Anula', 'Reflete', 'Absorve'];
  var LABELS = {
    'Fraco': 'Fraquezas', 'Resiste': 'Resiste', 'Anula': 'Anula',
    'Reflete': 'Reflete', 'Absorve': 'Absorve'
  };
  var groups = {};
  RELS_SUMMARY.forEach(function(r) { groups[r] = []; });

  ELEMENTS.forEach(function(el) {
    var rel = (state.affinities && state.affinities[el]) || 'Normal';
    if (groups[rel]) groups[rel].push(el);
  });

  var anyRendered = RELS_SUMMARY.some(function(r) { return groups[r].length > 0; });
  if (!anyRendered) {
    summaryEl.innerHTML = '';
    return;
  }

  var sumGrid = document.createElement('div');
  sumGrid.className = 'af-sum-grid';

  RELS_SUMMARY.forEach(function(rel) {
    if (groups[rel].length === 0) return;
    var item = document.createElement('div');
    item.className = 'af-sum-item af-sum--' + rel.toLowerCase();

    var label = document.createElement('span');
    label.className = 'af-sum-label';
    label.textContent = LABELS[rel];

    var val = document.createElement('span');
    val.className = 'af-sum-val';
    val.textContent = groups[rel].join(', ');

    item.appendChild(label);
    item.appendChild(val);
    sumGrid.appendChild(item);
  });

  summaryEl.innerHTML = '';
  summaryEl.appendChild(sumGrid);
}
