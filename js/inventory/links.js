// =============================================
// INVENTARIO — VINCULOS
// =============================================

import { state } from '../state.js';
import { ARCANAS } from '../constants.js';
import { clampInt } from '../utils.js';

export var linkBody       = document.getElementById('tbl-link');

// =============================================
// VÍNCULOS
// =============================================

var LINK_STATUS_CLASSES = {
  'Ativo':     'link--ativo',
  'Pausado':   'link--pausado',
  'Conclu\u00eddo': 'link--concluido',
  'Bloqueado': 'link--bloqueado',
  'Rompido':   'link--rompido'
};

export function renderLinkSummary() {
  var cards = linkBody ? Array.from(linkBody.querySelectorAll('.link-card')) : [];
  var totalEl  = document.getElementById('lsumm-total');
  var activeEl = document.getElementById('lsumm-active');
  var rankEl   = document.getElementById('lsumm-maxrank');
  var arcEl    = document.getElementById('lsumm-arcanas');

  var maxRank = 0;
  var active  = 0;
  var arcanaSet = {};
  cards.forEach(function(c) {
    var r = clampInt((c.querySelector('.lk-r') || {}).value || 1, 1, 10);
    if (r > maxRank) maxRank = r;
    if ((c.querySelector('.lk-s') || {}).value === 'Ativo') active++;
    var arc = (c.querySelector('.lk-a') || {}).value;
    if (arc) arcanaSet[arc] = true;
  });

  if (totalEl)  totalEl.textContent  = cards.length;
  if (activeEl) activeEl.textContent = active;
  if (rankEl)   rankEl.textContent   = cards.length > 0 ? maxRank : '\u2014';
  if (arcEl) {
    var arcList = Object.keys(arcanaSet);
    if (arcList.length === 0) {
      arcEl.textContent = '\u2014';
    } else {
      arcEl.innerHTML = '';
      arcList.forEach(function(a) {
        var chip = document.createElement('span');
        chip.className = 'link-arcana-chip';
        chip.textContent = a.replace(/^[IVXLC\d]+ - /, '');
        arcEl.appendChild(chip);
      });
    }
  }
}

function _buildRankPips(rank) {
  var html = '<div class="link-rank-pips">';
  for (var i = 1; i <= 10; i++) {
    html += '<span class="link-pip' + (i <= rank ? ' link-pip--filled' : '') + '"></span>';
  }
  return html + '</div>';
}

function applyLinkFilters() {
  if (!linkBody) return;
  var searchEl = document.getElementById('link-search');
  var arcanaEl = document.getElementById('link-filter-arcana');
  var statusEl = document.getElementById('link-filter-status');
  var sortEl   = document.getElementById('link-sort');

  var q      = searchEl ? searchEl.value.trim().toLowerCase() : '';
  var arcana = arcanaEl ? arcanaEl.value : '';
  var status = statusEl ? statusEl.value : '';
  var sort   = sortEl   ? sortEl.value   : 'none';

  var cards = Array.from(linkBody.querySelectorAll('.link-card'));
  cards.forEach(function(card) {
    var nome   = (card.querySelector('.lk-n') || {}).value || '';
    var cArc   = (card.querySelector('.lk-a') || {}).value || '';
    var cSt    = (card.querySelector('.lk-s') || {}).value || '';
    var show   = (!q      || nome.toLowerCase().includes(q)) &&
                 (!arcana || cArc === arcana) &&
                 (!status || cSt  === status);
    card.style.display = show ? '' : 'none';
  });

  if (sort !== 'none') {
    var vis = cards.filter(function(c) { return c.style.display !== 'none'; });
    vis.sort(function(a, b) {
      var ra = clampInt((a.querySelector('.lk-r') || {}).value || 1, 1, 10);
      var rb = clampInt((b.querySelector('.lk-r') || {}).value || 1, 1, 10);
      var na = (a.querySelector('.lk-n') || {}).value || '';
      var nb = (b.querySelector('.lk-n') || {}).value || '';
      if (sort === 'rank-desc') return rb - ra;
      if (sort === 'rank-asc')  return ra - rb;
      return na.localeCompare(nb);
    });
    vis.forEach(function(c) { linkBody.appendChild(c); });
  }
}

export function initLinkFilters() {
  var arcanaEl = document.getElementById('link-filter-arcana');
  if (arcanaEl) {
    ARCANAS.filter(function(a) { return a; }).forEach(function(a) {
      var opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      arcanaEl.appendChild(opt);
    });
  }
  var searchEl = document.getElementById('link-search');
  var statusEl = document.getElementById('link-filter-status');
  var sortEl   = document.getElementById('link-sort');
  if (searchEl) searchEl.addEventListener('input',  applyLinkFilters);
  if (arcanaEl) arcanaEl.addEventListener('change', applyLinkFilters);
  if (statusEl) statusEl.addEventListener('change', applyLinkFilters);
  if (sortEl)   sortEl.addEventListener('change',   applyLinkFilters);
}

export function addLink(data) {
  data = data || {};
  if (!linkBody) return;
  var rank       = clampInt(data.rank || 1, 1, 10);
  var status     = data.status || 'Ativo';
  var statusCls  = LINK_STATUS_CLASSES[status] || 'link--ativo';

  var card = document.createElement('div');
  card.className = 'link-card ' + statusCls;

  var arcanaOpts = ARCANAS.map(function(a) {
    return '<option value="' + a + '">' + (a || '\u2014 Arcana \u2014') + '</option>';
  }).join('');
  var statusOpts = Object.keys(LINK_STATUS_CLASSES).map(function(s) {
    return '<option value="' + s + '">' + s + '</option>';
  }).join('');

  card.innerHTML =
    '<div class="link-card-header">' +
      _buildRankPips(rank) +
      '<div class="link-card-header-main">' +
        '<input class="lk-n link-name-input" placeholder="Nome do V\u00ednculo"/>' +
        '<div class="link-card-header-right">' +
          '<select class="lk-s link-status-select">' + statusOpts + '</select>' +
          '<button class="mini del">\u2715</button>' +
        '</div>' +
      '</div>' +
      '<div class="link-card-arcana-row">' +
        '<span class="link-arcana-label">Arcana</span>' +
        '<select class="lk-a link-arcana-select">' + arcanaOpts + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="link-card-body">' +
      '<div class="link-card-fields-row">' +
        '<label class="link-field">' +
          '<span class="link-field-label">Rank</span>' +
          '<input class="lk-r link-rank-input" type="number" min="1" max="10" value="1"/>' +
        '</label>' +
        '<label class="link-field link-field--grow">' +
          '<span class="link-field-label">Rela\u00e7\u00e3o</span>' +
          '<input class="lk-rel link-rel-input" placeholder="Ex: Colega de turma, Rival\u2026"/>' +
        '</label>' +
      '</div>' +
      '<label class="link-field link-field--full">' +
        '<span class="link-field-label">Descri\u00e7\u00e3o</span>' +
        '<textarea class="lk-d link-desc-ta" rows="2" placeholder="Hist\u00f3ria, personalidade, como se conheceram\u2026"></textarea>' +
      '</label>' +
      '<label class="link-field link-field--full">' +
        '<span class="link-field-label link-benefit-label">\u2605 Benef\u00edcio</span>' +
        '<textarea class="lk-b link-benefit-ta" rows="1" placeholder="Benef\u00edcio mec\u00e2nico deste v\u00ednculo (opcional)\u2026"></textarea>' +
      '</label>' +
      '<label class="link-field link-field--full">' +
        '<span class="link-field-label">Observa\u00e7\u00f5es</span>' +
        '<textarea class="lk-o link-obs-ta" rows="1" placeholder="Notas livres\u2026"></textarea>' +
      '</label>' +
    '</div>';

  linkBody.appendChild(card);

  card.querySelector('.lk-n').value   = data.nome      || '';
  card.querySelector('.lk-a').value   = data.arcana    || '';
  card.querySelector('.lk-r').value   = rank;
  card.querySelector('.lk-s').value   = status;
  card.querySelector('.lk-rel').value = data.relacao   || '';
  card.querySelector('.lk-d').value   = data.desc      || '';
  card.querySelector('.lk-b').value   = data.beneficio || '';
  card.querySelector('.lk-o').value   = data.obs       || '';

  function updatePips() {
    var r = clampInt(card.querySelector('.lk-r').value, 1, 10);
    card.querySelectorAll('.link-pip').forEach(function(pip, i) {
      pip.classList.toggle('link-pip--filled', i < r);
    });
  }
  function updateStatusCls() {
    var s = card.querySelector('.lk-s').value;
    Object.values(LINK_STATUS_CLASSES).forEach(function(c) { card.classList.remove(c); });
    card.classList.add(LINK_STATUS_CLASSES[s] || 'link--ativo');
  }

  card.querySelector('.lk-r').addEventListener('input', function() {
    updatePips(); syncLinksToState(); renderLinkSummary();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  card.querySelector('.lk-s').addEventListener('change', function() {
    updateStatusCls(); syncLinksToState(); renderLinkSummary();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  card.querySelector('.lk-a').addEventListener('change', function() {
    syncLinksToState(); renderLinkSummary();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  ['lk-n','lk-rel','lk-d','lk-b','lk-o'].forEach(function(cls) {
    var el = card.querySelector('.' + cls);
    if (el) el.addEventListener('input', function() { syncLinksToState(); renderLinkSummary(); });
  });
  card.querySelector('.del').addEventListener('click', function() {
    card.remove(); syncLinksToState(); renderLinkSummary(); applyLinkFilters();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
}

export function syncLinksToState() {
  state.links = linkBody ? Array.from(linkBody.querySelectorAll('.link-card')).map(function(card) {
    return {
      nome:      card.querySelector('.lk-n').value,
      arcana:    card.querySelector('.lk-a').value,
      rank:      clampInt(card.querySelector('.lk-r').value, 1, 10),
      status:    card.querySelector('.lk-s').value,
      relacao:   card.querySelector('.lk-rel').value,
      desc:      card.querySelector('.lk-d').value,
      beneficio: card.querySelector('.lk-b').value,
      obs:       card.querySelector('.lk-o').value
    };
  }) : [];
}

