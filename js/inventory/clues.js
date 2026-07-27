// =============================================
// INVENTARIO — PISTAS
// =============================================

import { state } from '../state.js';

export var clueBody       = document.querySelector('#tbl-clue');

// =============================================
// PISTAS
// =============================================

var CLUE_STATUS_CLASSES = {
  'Aberta': 'clue--aberta',
  'Em andamento': 'clue--andamento',
  'Resolvida': 'clue--resolvida',
  'Falsa pista': 'clue--falsa'
};

export function addClue(data) {
  data = data || { titulo: '', desc: '', evid: '', status: 'Aberta' };
  if (!clueBody) return;
  var card = document.createElement('div');
  card.className = 'clue-card ' + (CLUE_STATUS_CLASSES[data.status] || 'clue--aberta');

  card.innerHTML =
    '<div class="clue-card-top">' +
      '<input class="cl-t" placeholder="T\u00edtulo da pista ou \u00e2ncora"/>' +
      '<select class="cl-s">' +
        '<option>Aberta</option>' +
        '<option>Em andamento</option>' +
        '<option>Resolvida</option>' +
        '<option>Falsa pista</option>' +
      '</select>' +
      '<button class="mini del">\u2715</button>' +
    '</div>' +
    '<textarea class="cl-d" rows="2" placeholder="Descri\u00e7\u00e3o / Ancoragem"></textarea>' +
    '<textarea class="cl-e" rows="1" placeholder="Evid\u00eancia \u2014 onde, quem, como"></textarea>';

  clueBody.appendChild(card);
  card.querySelector('.cl-t').value = data.titulo || '';
  card.querySelector('.cl-d').value = data.desc || '';
  card.querySelector('.cl-e').value = data.evid || '';
  card.querySelector('.cl-s').value = data.status || 'Aberta';

  function updateStatusClass(s) {
    Object.values(CLUE_STATUS_CLASSES).forEach(function(c) { card.classList.remove(c); });
    card.classList.add(CLUE_STATUS_CLASSES[s] || 'clue--aberta');
  }

  card.querySelector('.cl-s').addEventListener('change', function() {
    updateStatusClass(card.querySelector('.cl-s').value);
    syncCluesToState();
    if (window.debouncedAutoSave) window.debouncedAutoSave();
  });
  card.querySelector('.cl-t').addEventListener('input', syncCluesToState);
  card.querySelector('.cl-d').addEventListener('input', syncCluesToState);
  card.querySelector('.cl-e').addEventListener('input', syncCluesToState);
  card.querySelector('.del').addEventListener('click', function() { card.remove(); syncCluesToState(); });
}

export function syncCluesToState() {
  state.clues = clueBody ? Array.from(clueBody.querySelectorAll('.clue-card')).map(function(card) {
    return {
      titulo: card.querySelector('.cl-t').value,
      desc: card.querySelector('.cl-d').value,
      evid: card.querySelector('.cl-e').value,
      status: card.querySelector('.cl-s').value
    };
  }) : [];
}

// =============================================
