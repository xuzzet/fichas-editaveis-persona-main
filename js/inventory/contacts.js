// =============================================
// INVENTARIO — CONTATOS
// =============================================

import { state } from '../state.js';

export var cttBody        = document.querySelector('#tbl-ctt');

// CONTATOS
// =============================================

export function addCtt(data) {
  data = data || { nome: '', tipo: 'NPC', obs: '' };
  if (!cttBody) return;
  var card = document.createElement('div');
  card.className = 'ctt-card';

  card.innerHTML =
    '<div class="ctt-card-top">' +
      '<input class="ct-n" placeholder="Nome do contato ou local"/>' +
      '<select class="ct-t">' +
        '<option>NPC</option>' +
        '<option>Local</option>' +
        '<option>Clube</option>' +
        '<option>Com\u00e9rcio</option>' +
      '</select>' +
      '<button class="mini del">\u2715</button>' +
    '</div>' +
    '<textarea class="ct-o" rows="2" placeholder="Observa\u00e7\u00f5es, pistas, hor\u00e1rios, n\u00edvel de confian\u00e7a..."></textarea>';

  cttBody.appendChild(card);
  card.querySelector('.ct-n').value = data.nome || '';
  card.querySelector('.ct-t').value = data.tipo || 'NPC';
  card.querySelector('.ct-o').value = data.obs || '';

  card.querySelector('.ct-n').addEventListener('input', syncContactsToState);
  card.querySelector('.ct-t').addEventListener('change', syncContactsToState);
  card.querySelector('.ct-o').addEventListener('input', syncContactsToState);
  card.querySelector('.del').addEventListener('click', function() { card.remove(); syncContactsToState(); });
}

export function syncContactsToState() {
  state.contacts = cttBody ? Array.from(cttBody.querySelectorAll('.ctt-card')).map(function(card) {
    return {
      nome: card.querySelector('.ct-n').value,
      tipo: card.querySelector('.ct-t').value,
      obs: card.querySelector('.ct-o').value
    };
  }) : [];
}

