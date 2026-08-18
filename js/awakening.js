// =============================================
// DESPERTAR TRAMA — Árvore de habilidades por Arcana
// Sistema aditivo: NÃO altera Persona, Arcana, atributos,
// combate, magias, rolagens ou cálculos existentes.
// Depende apenas de: state.js
// =============================================

import { state } from './state.js';
import { escapeHtml as esc } from './utils.js';
import {
  ARCANA_MAP, ARCANA_CARD_IMAGES, getArcanaInfo, VERTENTES,
  TIER_LEVELS, CONTENT, AWAKENING_OVERRIDES, TIER_KEYS, TIER_LABELS
} from './data/awakening-data.js';

// Re-exporta os dados para preservar a API publica deste modulo.
export {
  ARCANA_MAP, ARCANA_CARD_IMAGES, getArcanaInfo, VERTENTES, AWAKENING_OVERRIDES
};

/**
 * Constrói a árvore (6 vertentes × 3 tiers) para a Arcana informada,
 * resolvendo nomes/descrições com base no conteúdo (ou overrides).
 * @param {object} arcanaInfo - retorno de getArcanaInfo (pode ser null)
 * @returns {Array}
 */
export function buildTree(arcanaInfo) {
  var display = arcanaInfo ? arcanaInfo.display : 'a Arcana';
  var overrides = (arcanaInfo && AWAKENING_OVERRIDES[arcanaInfo.key]) || {};
  return VERTENTES.map(function (v) {
    var base = CONTENT[v.key];
    var ovr = overrides[v.key] || {};
    var levels = TIER_LEVELS[v.key];
    var nodes = TIER_KEYS.map(function (tk, i) {
      var src = (ovr[tk] || base[tk]);
      var name = src.name;
      var descFn = src.desc;
      var narrativeOnly = !!src.narrativeOnly;
      return {
        id: v.key + '_' + tk,
        tierKey: tk,
        tierLabel: TIER_LABELS[i],
        name: name,
        desc: (typeof descFn === 'function') ? descFn(display) : String(descFn || ''),
        // Nível de desbloqueio: override específico da Arcana > padrão da vertente.
        // Nós exclusivamente narrativos não têm nível (level = null).
        level: narrativeOnly ? null : ((src.level != null) ? src.level : levels[i]),
        narrativeOnly: narrativeOnly
      };
    });
    return {
      key: v.key,
      name: v.name,
      glyph: v.glyph,
      pos: v.pos,
      nodes: nodes
    };
  });
}

// =============================================
// ESTADO DE PROGRESSÃO — ÁRVORE DE ESCOLHAS
// personaAwakenings[arcanaKey] = { acquired: [nodeId], narrative: [nodeId] }
//   acquired  → habilidades efetivamente obtidas (✔)
//   narrative → liberações narrativas da principal de Resolução (abaixo do Lv.10)
// =============================================

// Níveis em que o jogador ganha UMA escolha de aquisição.
var ACQ_LEVELS = [2, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20];

function ensureStore(arcanaKey) {
  if (!state.personaAwakenings || typeof state.personaAwakenings !== 'object') {
    state.personaAwakenings = {};
  }
  var s = state.personaAwakenings[arcanaKey];
  if (!s) { s = { acquired: [], narrative: [] }; state.personaAwakenings[arcanaKey] = s; }
  if (!Array.isArray(s.acquired)) s.acquired = [];
  if (!Array.isArray(s.narrative)) s.narrative = [];
  return s;
}

function personaLevel() {
  return Math.max(1, Math.trunc(Number(state.PerLvl) || 1));
}

function isNarrative(arcanaKey, nodeId) {
  return ensureStore(arcanaKey).narrative.indexOf(nodeId) >= 0;
}

/** Número de escolhas de aquisição concedidas pelo nível atual da Persona. */
function earnedChoices() {
  var lvl = personaLevel();
  return ACQ_LEVELS.filter(function (l) { return lvl >= l; }).length;
}

/**
 * Calcula o estado de cada nó como uma ÁRVORE DE ESCOLHAS.
 * Retorna { states:{id->estado}, remaining, earned, used }.
 * Estados: 'acquired' | 'available' | 'available-res' | 'available-narr'
 *          | 'locked-choices' | 'locked-prereq' | 'locked-res' | 'lost'
 */
function computeStates(arcanaKey, tree) {
  var store = ensureStore(arcanaKey);
  var acq = store.acquired;
  var lvl = personaLevel();

  // Escolhas normais consumidas (a vertente Resolução não consome escolhas).
  var used = 0;
  tree.forEach(function (b) {
    if (b.key === 'resolucao') return;
    b.nodes.forEach(function (n) { if (acq.indexOf(n.id) >= 0) used++; });
  });
  var earned = earnedChoices();
  var remaining = Math.max(0, earned - used);

  var states = {};
  tree.forEach(function (b) {
    var isRes = (b.key === 'resolucao');
    var main = b.nodes[0], a1 = b.nodes[1], a2 = b.nodes[2];

    // Habilidade principal
    if (acq.indexOf(main.id) >= 0) {
      states[main.id] = 'acquired';
    } else if (isRes) {
      states[main.id] = (lvl >= 10 || isNarrative(arcanaKey, main.id)) ? 'available-res' : 'locked-res';
    } else {
      states[main.id] = remaining > 0 ? 'available' : 'locked-choices';
    }

    // Amplificações — uma OU outra (mutuamente exclusivas)
    [[a1, a2], [a2, a1]].forEach(function (pair) {
      var node = pair[0], sib = pair[1];
      if (acq.indexOf(node.id) >= 0) { states[node.id] = 'acquired'; return; }
      if (acq.indexOf(main.id) < 0) { states[node.id] = 'locked-prereq'; return; }
      if (acq.indexOf(sib.id) >= 0) { states[node.id] = 'lost'; return; }
      if (isRes) { states[node.id] = 'available-narr'; return; }
      states[node.id] = remaining > 0 ? 'available' : 'locked-choices';
    });
  });

  return { states: states, remaining: remaining, earned: earned, used: used };
}

function acquireNode(arcanaKey, nodeId) {
  var store = ensureStore(arcanaKey);
  if (store.acquired.indexOf(nodeId) < 0) store.acquired.push(nodeId);
  if (window.debouncedAutoSave) window.debouncedAutoSave();
}

/** Remove um nó adquirido. Ao remover a principal, remove também suas amplificações. */
function unacquireNode(arcanaKey, branch, nodeId) {
  var store = ensureStore(arcanaKey);
  var remove = [nodeId];
  if (nodeId === branch.nodes[0].id) {
    remove.push(branch.nodes[1].id, branch.nodes[2].id);
    if (branch.key === 'resolucao') {
      store.narrative = store.narrative.filter(function (id) { return id !== nodeId; });
    }
  }
  store.acquired = store.acquired.filter(function (id) { return remove.indexOf(id) < 0; });
  if (window.debouncedAutoSave) window.debouncedAutoSave();
}

/** Libera narrativamente a principal de Resolução (quando abaixo do Nível 10). */
function grantResolucaoNarrative(arcanaKey, nodeId) {
  var store = ensureStore(arcanaKey);
  if (store.narrative.indexOf(nodeId) < 0) store.narrative.push(nodeId);
  if (window.debouncedAutoSave) window.debouncedAutoSave();
}

// =============================================
// HELPERS DOM
// =============================================

// Estado transitório de UI (não persiste): vertente selecionada + arcana anterior.
var selectedVertente = null;
var lastArcanaKey = null;
var cardEls = {}; // key → { card, inner }

// =============================================
// CONSTRUÇÃO DO DECK (idempotente)
// =============================================
export function initAwakening() {
  var deck = document.getElementById('awakening-deck');
  if (!deck || deck.dataset.built === '1') { renderAwakening(); return; }

  VERTENTES.forEach(function (v) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'awakening-card pos-' + v.pos;
    card.dataset.vertente = v.key;
    card.setAttribute('aria-label', 'Carta ' + v.name);

    var inner = document.createElement('div');
    inner.className = 'awakening-card-inner';

    var back = document.createElement('div');
    back.className = 'awakening-card-back';
    back.innerHTML =
      '<div class="awakening-back-frame">' +
        '<div class="awakening-back-emblem">\u2727</div>' +
        '<div class="awakening-back-label">Despertar</div>' +
      '</div>';
    // Imagem do verso (card-back.png). Se falhar ao carregar, permanece o
    // desenho em CSS acima como fallback.
    var backImg = document.createElement('img');
    backImg.className = 'awakening-card-back-img';
    backImg.alt = '';
    backImg.setAttribute('aria-hidden', 'true');
    backImg.src = ARCANA_CARD_IMAGES.back;
    backImg.onerror = function () { backImg.remove(); };
    back.appendChild(backImg);

    var front = document.createElement('div');
    front.className = 'awakening-card-front';

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);
    deck.appendChild(card);

    cardEls[v.key] = { card: card, inner: inner, front: front };

    card.addEventListener('click', function () {
      var info = getArcanaInfo(state.PerArcana);
      if (!info) return; // sem Arcana selecionada, não abre
      selectedVertente = (selectedVertente === v.key) ? null : v.key;
      renderAwakening();
    });
  });

  deck.dataset.built = '1';

  // Atualiza ao trocar Arcana ou nível da Persona (aditivo — não substitui os
  // listeners existentes que já sincronizam o state). O render é adiado com
  // setTimeout(0) para garantir que o state já foi atualizado pelos listeners
  // genéricos de campo antes da leitura.
  var deferredRender = function () { setTimeout(renderAwakening, 0); };
  var perArc = document.getElementById('PerArcana');
  var perLvl = document.getElementById('PerLvl');
  if (perArc) {
    perArc.addEventListener('change', deferredRender);
    perArc.addEventListener('input', deferredRender);
  }
  if (perLvl) perLvl.addEventListener('input', deferredRender);

  renderAwakening();
}

// =============================================
// RENDER
// =============================================
export function renderAwakening() {
  var deck = document.getElementById('awakening-deck');
  if (!deck) return;

  var info = getArcanaInfo(state.PerArcana);
  var arcanaKey = info ? info.key : null;

  // Ao trocar de Arcana, fecha a carta aberta.
  if (arcanaKey !== lastArcanaKey) {
    selectedVertente = null;
    lastArcanaKey = arcanaKey;
  }

  // Cabeçalho.
  var nameEl = document.getElementById('awakening-arcana-name');
  var lvlEl = document.getElementById('awakening-level');
  var nextEl = document.getElementById('awakening-next');
  if (nameEl) nameEl.textContent = info ? (info.display + ' \u00b7 ' + info.roman) : 'Nenhuma Arcana selecionada';
  if (lvlEl) lvlEl.textContent = info ? ('Nível da Persona: ' + personaLevel()) : '';

  var tree = buildTree(info);
  var comp = info ? computeStates(arcanaKey, tree) : null;

  // Escolhas de Despertar disponíveis.
  if (nextEl) {
    nextEl.textContent = info ? ('Escolhas de Despertar disponíveis: ' + comp.remaining) : '';
  }

  deck.classList.toggle('is-disabled', !info);

  // Cartas.
  tree.forEach(function (branch) {
    var refs = cardEls[branch.key];
    if (!refs) return;
    var isFlipped = (selectedVertente === branch.key) && !!info;
    refs.inner.classList.toggle('is-flipped', isFlipped);

    var mainNode = branch.nodes[0];
    var mainState = comp ? comp.states[mainNode.id] : null;
    var mainAcquired = (mainState === 'acquired');
    refs.card.classList.toggle('is-selected', isFlipped);
    refs.card.classList.toggle('is-locked', info ? !mainAcquired : true);

    // Conteúdo da frente (reconstruído a cada render p/ refletir Arcana atual).
    refs.front.innerHTML = '';

    // Imagem de fundo da frente — cobre a carta inteira (igual ao verso).
    if (info) {
      var frontImg = document.createElement('img');
      frontImg.className = 'awakening-card-front-img';
      frontImg.alt = info.display;
      frontImg.loading = 'lazy';
      frontImg.setAttribute('aria-hidden', 'true');
      frontImg.src = ARCANA_CARD_IMAGES[arcanaKey] || '';
      frontImg.onerror = function () {
        frontImg.remove();
        refs.front.classList.remove('has-art');
      };
      refs.front.appendChild(frontImg);
      refs.front.classList.add('has-art');
    } else {
      refs.front.classList.remove('has-art');
    }

    // Numeral romano removido das cartas a pedido do usuário.

    // Topo: nome da vertente.
    var top = document.createElement('div');
    top.className = 'awakening-card-top';
    var vert = document.createElement('div');
    vert.className = 'awakening-card-vertente';
    vert.textContent = branch.name;
    top.appendChild(vert);

    // Base: Arcana, habilidade principal e status (sobrepostos à arte).
    var bottom = document.createElement('div');
    bottom.className = 'awakening-card-bottom';

    var arc = document.createElement('div');
    arc.className = 'awakening-card-arcana';
    arc.textContent = info ? info.display : '—';

    var skill = document.createElement('div');
    skill.className = 'awakening-card-skill';
    skill.textContent = mainNode.name;

    var cs = cardStatus(mainState);
    var status = document.createElement('div');
    status.className = 'awakening-card-status ' + cs.cls;
    status.textContent = cs.txt;

    bottom.appendChild(arc);
    bottom.appendChild(skill);
    bottom.appendChild(status);

    refs.front.appendChild(top);
    refs.front.appendChild(bottom);
  });

  renderPanel(info, arcanaKey, tree);
}

/** Rótulo/classe de status da PRINCIPAL exibido na frente da carta. */
function cardStatus(mainState) {
  switch (mainState) {
    case 'acquired':      return { cls: 'status-level',     txt: '\u2714 Despertar Obtido' };
    case 'available':     return { cls: 'status-narrative', txt: '\u2728 Disponível' };
    case 'available-res': return { cls: 'status-narrative', txt: '\u2728 Disponível' };
    case 'locked-res':    return { cls: 'status-locked',    txt: '\uD83D\uDD12 Nível 10 / Narrativo' };
    case 'locked-choices':return { cls: 'status-locked',    txt: '\u2728 Requer escolha' };
    default:              return { cls: 'status-locked',    txt: '\u2014' };
  }
}

function renderPanel(info, arcanaKey, tree) {
  var panel = document.getElementById('awakening-panel');
  if (!panel) return;

  if (!info) {
    panel.innerHTML = '<p class="awakening-panel-empty">Selecione uma <b>Arcana</b> na Persona para revelar seu baralho de Despertar Trama.</p>';
    return;
  }
  if (!selectedVertente) {
    panel.innerHTML = '<p class="awakening-panel-empty">Clique em uma carta acima para virá-la e revelar as habilidades desta vertente.</p>';
    return;
  }

  var branch = tree.filter(function (b) { return b.key === selectedVertente; })[0];
  if (!branch) { panel.innerHTML = ''; return; }

  var comp = computeStates(arcanaKey, tree);
  var st = comp.states;

  var nodesHtml = branch.nodes.map(function (node) {
    var s = st[node.id];
    var statusHtml, actionHtml = '', cls = 'is-locked';

    if (s === 'acquired') {
      cls = 'is-acquired';
      statusHtml = '<span class="awk-status awk-status-unlocked">\u2714 Despertar Obtido</span>';
      actionHtml = '<button type="button" class="mini awk-remove-btn" data-node="' + esc(node.id) + '">Remover</button>';
    } else if (s === 'available' || s === 'available-res') {
      cls = 'is-available';
      statusHtml = '<span class="awk-status awk-status-narrative">\u2728 Custo: 1 ponto de Despertar</span>';
      actionHtml = '<button type="button" class="mini awk-acquire-btn" data-node="' + esc(node.id) + '">\u2728 Despertar</button>';
    } else if (s === 'available-narr') {
      cls = 'is-available';
      statusHtml = '<span class="awk-status awk-status-narrative">\u2728 Despertar Narrativo</span>';
      actionHtml = '<button type="button" class="mini awk-acquire-btn" data-node="' + esc(node.id) + '">\u2728 Despertar Narrativo</button>';
    } else if (s === 'locked-choices') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Necessário 1 ponto de Despertar Trama</span>';
      actionHtml = '<span class="awk-note">Sem pontos restantes — suba o nível da Persona.</span>';
    } else if (s === 'locked-prereq') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Requer: ' + esc(branch.nodes[0].name) + '</span>';
    } else if (s === 'locked-res') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Requer Nível 10 ou liberação narrativa</span>';
      actionHtml = '<button type="button" class="mini awk-narr-btn" data-node="' + esc(node.id) + '">\u2728 Liberar (Narrativo)</button>';
    } else if (s === 'lost') {
      statusHtml = '<span class="awk-status awk-status-locked">\uD83D\uDD12 Caminho não escolhido</span>';
      actionHtml = '<span class="awk-note">Outra evolução já foi selecionada.</span>';
    }

    return '' +
      '<div class="awakening-upgrade ' + cls + '">' +
        '<div class="awakening-upgrade-head">' +
          '<span class="awakening-upgrade-tier">' + esc(node.tierLabel) + '</span>' +
          statusHtml +
        '</div>' +
        '<div class="awakening-upgrade-name">' + esc(node.name) + '</div>' +
        '<p class="awakening-upgrade-desc">' + esc(node.desc) + '</p>' +
        (actionHtml ? '<div class="awakening-upgrade-actions">' + actionHtml + '</div>' : '') +
      '</div>';
  }).join('');

  panel.innerHTML =
    '<div class="awakening-panel-header">' +
      '<span class="awakening-panel-glyph">' + esc(branch.glyph) + '</span>' +
      '<div class="awakening-panel-titles">' +
        '<span class="awakening-panel-vertente">Vertente</span>' +
        '<h3 class="awakening-panel-name">' + esc(branch.name) + '</h3>' +
      '</div>' +
      '<span class="awakening-panel-arcana">' + esc(info.display) + ' \u00b7 ' + esc(info.roman) + '</span>' +
    '</div>' +
    '<div class="awakening-choice-note">Escolhas de Despertar disponíveis: <b>' + comp.remaining + '</b>' +
      ' <span class="awk-choice-hint">(cada nível de aquisição concede 1 ponto; tanto Habilidades Principais quanto Amplificações custam 1 ponto)</span></div>' +
    '<div class="awakening-upgrade-list">' + nodesHtml + '</div>';

  // Aquisição (consome escolha para nós normais; Resolução/narrativo não consomem).
  Array.prototype.forEach.call(panel.querySelectorAll('.awk-acquire-btn'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      acquireNode(arcanaKey, btn.dataset.node);
      renderAwakening();
    });
  });
  // Remoção / redefinição de uma escolha.
  Array.prototype.forEach.call(panel.querySelectorAll('.awk-remove-btn'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      unacquireNode(arcanaKey, branch, btn.dataset.node);
      renderAwakening();
    });
  });
  // Liberação narrativa da principal de Resolução.
  Array.prototype.forEach.call(panel.querySelectorAll('.awk-narr-btn'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      grantResolucaoNarrative(arcanaKey, btn.dataset.node);
      renderAwakening();
    });
  });
}
