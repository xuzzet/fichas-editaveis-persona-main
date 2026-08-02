// =============================================
// HABILIDADES NATURAIS — RENDER E CONFIGURACAO
// Card proprio, exibido antes das Magias, com as habilidades naturais
// unicas de cada Arcana. Sistema aditivo: NAO altera Magias, Despertar
// Trama, atributos, combate ou calculos existentes.
// Depende de: state.js, data/natural-abilities-data.js, data/awakening-data.js
// =============================================

import { state } from './state.js';
import { getNaturalAbilities } from './data/natural-abilities-data.js';
import { getArcanaInfo, ARCANA_CARD_IMAGES } from './data/awakening-data.js';

function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// =============================================
// CONFIGURACAO PERSISTIDA POR ARCANA
// state.naturalAbilityConfig[arcanaKey] = { elementResistance: 'light'|'dark', ... }
// =============================================
function ensureConfig(arcanaKey) {
  if (!state.naturalAbilityConfig || typeof state.naturalAbilityConfig !== 'object') {
    state.naturalAbilityConfig = {};
  }
  var c = state.naturalAbilityConfig[arcanaKey];
  if (!c || typeof c !== 'object') {
    c = {};
    state.naturalAbilityConfig[arcanaKey] = c;
  }
  return c;
}

// =============================================
// RENDER DE BLOCOS
// =============================================
function renderBlock(block, arcanaKey) {
  switch (block.kind) {
    case 'desc': {
      var paras = String(block.text || '').split(/\n{2,}/).map(function (p) {
        return '<p>' + _esc(p.trim()) + '</p>';
      }).join('');
      return '<div class="nat-block nat-desc">' + paras + '</div>';
    }
    case 'highlight': {
      var chips = (block.items || []).map(function (it) {
        return '<span class="nat-highlight-chip">' + _esc(it) + '</span>';
      }).join('');
      return '<div class="nat-block nat-highlight">' + chips + '</div>';
    }
    case 'list': {
      var lis = (block.items || []).map(function (it) {
        return '<li>' + _esc(it) + '</li>';
      }).join('');
      return '<div class="nat-block nat-list">' +
        (block.label ? '<span class="nat-block-label">' + _esc(block.label) + '</span>' : '') +
        '<ul>' + lis + '</ul>' +
        '</div>';
    }
    case 'bonus': {
      var bChips = (block.items || []).map(function (it) {
        return '<span class="nat-bonus-chip">' + _esc(it) + '</span>';
      }).join('');
      return '<div class="nat-block nat-bonus">' + bChips + '</div>';
    }
    case 'choice': {
      var cfg = ensureConfig(arcanaKey);
      var current = cfg[block.configKey] || '';
      var name = 'nat-choice-' + arcanaKey + '-' + block.configKey;
      var detailed = (block.options || []).some(function (o) {
        return !!o.desc;
      });
      var opts = (block.options || []).map(function (o) {
        var checked = current === o.value ? ' checked' : '';
        var id = name + '-' + o.value;
        return '<label class="nat-choice-option" for="' + _esc(id) + '">' +
          '<input type="radio" id="' + _esc(id) + '" name="' + _esc(name) + '"' +
          ' value="' + _esc(o.value) + '"' +
          ' data-config-key="' + _esc(block.configKey) + '"' + checked + '>' +
          '<span class="nat-choice-mark" aria-hidden="true"></span>' +
          '<span class="nat-choice-text">' +
            '<span class="nat-choice-label">' + _esc(o.label) + '</span>' +
            (o.desc ? '<span class="nat-choice-desc">' + _esc(o.desc) + '</span>' : '') +
          '</span>' +
          '</label>';
      }).join('');
      return '<div class="nat-block nat-choice' + (detailed ? ' nat-choice--detailed' : '') + '">' +
        (block.label ? '<span class="nat-block-label">' + _esc(block.label) + '</span>' : '') +
        '<div class="nat-choice-options">' + opts + '</div>' +
        '</div>';
    }
    case 'social': {
      return '<div class="nat-block nat-social">' +
        (block.label ? '<span class="nat-block-label">' + _esc(block.label) + '</span>' : '') +
        '<p>' + _esc(block.text) + '</p>' +
        '</div>';
    }
    case 'meta': {
      var rows = (block.items || []).map(function (it) {
        return '<div class="nat-meta-row">' +
          '<span class="nat-meta-label">' + _esc(it.label) + '</span>' +
          '<span class="nat-meta-value">' + _esc(it.value) + '</span>' +
          '</div>';
      }).join('');
      return '<div class="nat-block nat-meta">' + rows + '</div>';
    }
    case 'warning': {
      var wItems = (block.items || []).map(function (it, i) {
        var sep = (i > 0 && block.join)
          ? '<div class="nat-warning-or">' + _esc(block.join) + '</div>' : '';
        return sep + '<div class="nat-warning-item">' + _esc(it) + '</div>';
      }).join('');
      return '<div class="nat-block nat-warning">' +
        '<div class="nat-warning-head">' +
          '<span class="nat-warning-icon" aria-hidden="true">\u26a0</span>' +
          (block.label ? '<span class="nat-warning-title">' + _esc(block.label) + '</span>' : '') +
        '</div>' +
        (block.text ? '<p>' + _esc(block.text) + '</p>' : '') +
        (wItems ? '<div class="nat-warning-body">' + wItems + '</div>' : '') +
        '</div>';
    }
    case 'check': {
      var okLabel = block.successLabel || 'Sucesso';
      var failLabel = block.failLabel || 'Falha';
      return '<div class="nat-block nat-check">' +
        (block.label ? '<span class="nat-block-label">' + _esc(block.label) + '</span>' : '') +
        (block.text ? '<p>' + _esc(block.text) + '</p>' : '') +
        (block.test ? '<div class="nat-check-test">' + _esc(block.test) + '</div>' : '') +
        '<div class="nat-check-outcomes">' +
          (block.success ? '<div class="nat-check-outcome nat-check-success">' +
            '<span class="nat-check-tag">' + _esc(okLabel) + '</span>' +
            '<p>' + _esc(block.success) + '</p></div>' : '') +
          (block.failure ? '<div class="nat-check-outcome nat-check-fail">' +
            '<span class="nat-check-tag">' + _esc(failLabel) + '</span>' +
            '<p>' + _esc(block.failure) + '</p></div>' : '') +
        '</div>' +
        '</div>';
    }
    case 'variant': {
      var variants = (block.items || []).map(function (v) {
        var rules = (v.rules || []).map(function (r) {
          return '<li>' + _esc(r) + '</li>';
        }).join('');
        return '<div class="nat-variant">' +
          '<div class="nat-variant-head">' +
            '<span class="nat-variant-title">' + _esc(v.title) + '</span>' +
            (v.tag ? '<span class="nat-variant-tag">' + _esc(v.tag) + '</span>' : '') +
          '</div>' +
          (v.effect ? '<p class="nat-variant-effect">' + _esc(v.effect) + '</p>' : '') +
          (rules ? '<ul class="nat-variant-rules">' + rules + '</ul>' : '') +
          '</div>';
      }).join('');
      return '<div class="nat-block nat-variants">' +
        (block.label ? '<span class="nat-block-label">' + _esc(block.label) + '</span>' : '') +
        '<div class="nat-variants-grid">' + variants + '</div>' +
        '</div>';
    }
    case 'narrative': {
      return '<div class="nat-block nat-narrative">' +
        '<span class="nat-narrative-icon" aria-hidden="true">✦</span>' +
        '<p>' + _esc(block.text) + '</p>' +
        '</div>';
    }
    default:
      return '';
  }
}

function renderAbility(ability, arcanaKey) {
  var typeClassMap = {
    special: 'nat-ability--special',
    active: 'nat-ability--active',
    passive: 'nat-ability--passive'
  };
  var typeClass = typeClassMap[ability.type] || 'nat-ability--passive';
  var blocksHtml = (ability.blocks || []).map(function (b) {
    return renderBlock(b, arcanaKey);
  }).join('');
  return '<article class="nat-ability ' + typeClass + '">' +
    '<header class="nat-ability-header">' +
      '<h3 class="nat-ability-name">' + _esc(ability.name) + '</h3>' +
      '<span class="nat-ability-type">' + _esc(ability.typeLabel) + '</span>' +
    '</header>' +
    '<div class="nat-ability-body">' + blocksHtml + '</div>' +
  '</article>';
}

// =============================================
// RENDER PRINCIPAL
// =============================================
export function renderNaturalAbilities() {
  var section = document.getElementById('natural-abilities-card');
  if (!section) return;

  var info = getArcanaInfo(state.PerArcana);
  var arcanaKey = info ? info.key : null;
  var pack = getNaturalAbilities(arcanaKey);

  // Sem habilidades naturais para a Arcana atual → oculta o card.
  if (!pack) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  var imgSrc = ARCANA_CARD_IMAGES[arcanaKey] || '';

  var imgHtml = imgSrc
    ? '<img class="nat-arcana-img" src="' + _esc(imgSrc) + '" alt="Arcana ' +
        _esc(pack.arcana) + '" onerror="this.remove()">'
    : '';

  var abilitiesHtml = (pack.abilities || []).map(function (ab) {
    return renderAbility(ab, arcanaKey);
  }).join('');

  section.innerHTML =
    '<div class="section-title"><div class="bar"></div><h2>Habilidades Naturais</h2></div>' +
    '<div class="nat-arcana-banner">' +
      '<div class="nat-arcana-figure">' + imgHtml +
      '</div>' +
      '<div class="nat-arcana-meta">' +
        '<span class="nat-arcana-number">' + _esc(pack.number) + 'º — ' + _esc(pack.arcana) + '</span>' +
        '<span class="nat-arcana-sub">Habilidades Naturais</span>' +
      '</div>' +
    '</div>' +
    '<div class="nat-abilities-list">' + abilitiesHtml + '</div>';

  // Reconecta os handlers de escolha (radios) apos reconstruir o HTML.
  Array.from(section.querySelectorAll('.nat-choice input[type="radio"]')).forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (!radio.checked) return;
      var cfg = ensureConfig(arcanaKey);
      cfg[radio.getAttribute('data-config-key')] = radio.value;
      if (window.debouncedAutoSave) window.debouncedAutoSave();
    });
  });
}

// =============================================
// INIT — reage a troca de Arcana da Persona
// =============================================
export function initNaturalAbilities() {
  var perArc = document.getElementById('PerArcana');
  var deferred = function () {
    setTimeout(function () {
      renderNaturalAbilities();
      // A Arcana pode conceder b\u00f4nus percentual de Vida m\u00e1xima (aplicado em
      // computeNaturalAbilityModifiers). Recalcula para refletir na ficha.
      if (window.recalcAndRender) window.recalcAndRender();
    }, 0);
  };
  if (perArc) {
    perArc.addEventListener('change', deferred);
    perArc.addEventListener('input', deferred);
  }
  renderNaturalAbilities();
}
