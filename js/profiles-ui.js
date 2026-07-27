// =============================================
// SISTEMA DE PERFIS — INTERFACE
// Renderiza a barra de perfil, o menu de troca, o modal de criação
// e a tela de gerenciamento. Toda a manipulação de `state`/snapshot
// acontece via callbacks fornecidos por app.js (init).
// Depende apenas de: profiles.js
// =============================================

import {
  getProfiles, getActiveProfile, getActiveId, isFull,
  getProfileCount, MAX_PROFILES
} from './profiles.js';

var api = null;

// ── Utilidades DOM ───────────────────────────────────────
function el(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function avatarMarkup(profile, sizeCls) {
  var cls = 'profile-avatar' + (sizeCls ? ' ' + sizeCls : '');
  if (profile && profile.avatar) {
    return '<span class="' + cls + '"><img src="' + escapeHtml(profile.avatar) + '" alt=""></span>';
  }
  var initial = (profile && profile.name ? profile.name.trim().charAt(0) : '?').toUpperCase() || '?';
  return '<span class="' + cls + ' profile-avatar--empty">' + escapeHtml(initial) + '</span>';
}

function readImageFile(file, cb) {
  if (!file) { cb(''); return; }
  var reader = new FileReader();
  reader.onload = function () { cb(reader.result || ''); };
  reader.onerror = function () { cb(''); };
  reader.readAsDataURL(file);
}

// ── Referências de elementos ─────────────────────────────
var bar, currentBtn, menu, createModal, manageModal;
var pendingCreateAvatar = '';

// ── Barra de perfil ──────────────────────────────────────
function buildBar() {
  bar = el('div', 'profile-bar');
  bar.id = 'profile-bar';
  bar.innerHTML =
    '<span class="profile-bar__label">Perfil Atual:</span>' +
    '<button type="button" id="profile-current" class="profile-current" aria-haspopup="true" aria-expanded="false">' +
      '<span class="profile-current__avatar"></span>' +
      '<span class="profile-current__name">Novo Personagem</span>' +
      '<span class="profile-current__caret" aria-hidden="true">\u25BE</span>' +
    '</button>' +
    '<div id="profile-menu" class="profile-menu" hidden></div>';

  var root = document.getElementById('captureRoot');
  if (root && root.parentNode) {
    root.parentNode.insertBefore(bar, root);
  } else {
    document.body.insertBefore(bar, document.body.firstChild);
  }

  currentBtn = bar.querySelector('#profile-current');
  menu = bar.querySelector('#profile-menu');

  currentBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  menu.addEventListener('click', function (e) { e.stopPropagation(); });

  document.addEventListener('click', function () { closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); closeModal(createModal); closeModal(manageModal); }
  });
}

function renderBar() {
  var active = getActiveProfile();
  var av = currentBtn.querySelector('.profile-current__avatar');
  var nm = currentBtn.querySelector('.profile-current__name');
  av.innerHTML = avatarMarkup(active, 'profile-avatar--sm');
  nm.textContent = active ? active.name : 'Novo Personagem';
}

// ── Menu de troca ────────────────────────────────────────
function toggleMenu() {
  if (menu.hidden) openMenu(); else closeMenu();
}

function openMenu() {
  renderMenu();
  menu.hidden = false;
  currentBtn.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  currentBtn.setAttribute('aria-expanded', 'false');
}

function renderMenu() {
  var profiles = getProfiles();
  var activeId = getActiveId();
  var list = profiles.map(function (p) {
    var isActive = p.id === activeId;
    return '<button type="button" class="profile-menu__item' + (isActive ? ' is-active' : '') +
      '" data-switch="' + escapeHtml(p.id) + '">' +
      avatarMarkup(p, 'profile-avatar--sm') +
      '<span class="profile-menu__item-name">' + escapeHtml(p.name) + '</span>' +
      (isActive ? '<span class="profile-menu__check" aria-hidden="true">\u2714\uFE0E</span>' : '') +
      '</button>';
  }).join('');

  var full = isFull();
  menu.innerHTML =
    '<div class="profile-menu__title">Minhas Fichas</div>' +
    '<div class="profile-menu__sep"></div>' +
    '<div class="profile-menu__list">' + (list || '<div class="profile-menu__empty">Nenhuma ficha.</div>') + '</div>' +
    '<div class="profile-menu__sep"></div>' +
    '<button type="button" class="profile-menu__action" data-action="create"' + (full ? ' disabled title="Limite de ' + MAX_PROFILES + ' fichas atingido"' : '') + '>\u2795 Criar Nova Ficha</button>' +
    '<button type="button" class="profile-menu__action" data-action="manage">\u2699 Gerenciar Perfis</button>' +
    '<div class="profile-menu__count">' + getProfileCount() + ' / ' + MAX_PROFILES + ' fichas</div>';

  menu.querySelectorAll('[data-switch]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-switch');
      closeMenu();
      if (id === getActiveId()) return;
      var ok = api.onSwitch(id);
      if (ok) { renderBar(); api.toast('\u2714 Perfil alterado', 'success'); }
    });
  });

  var createBtn = menu.querySelector('[data-action="create"]');
  if (createBtn) createBtn.addEventListener('click', function () {
    closeMenu();
    if (isFull()) {
      api.toast('Limite m\u00e1ximo de ' + MAX_PROFILES + ' fichas atingido. Remova uma ficha existente para criar outra.', 'error', 4500);
      return;
    }
    openCreateModal();
  });

  var manageBtn = menu.querySelector('[data-action="manage"]');
  if (manageBtn) manageBtn.addEventListener('click', function () {
    closeMenu();
    openManageModal();
  });
}

// ── Modal genérico ───────────────────────────────────────
function buildModalShell(id, titleText) {
  var overlay = el('div', 'profile-modal');
  overlay.id = id;
  overlay.hidden = true;
  overlay.innerHTML =
    '<div class="profile-modal__backdrop"></div>' +
    '<div class="profile-modal__dialog" role="dialog" aria-modal="true">' +
      '<div class="profile-modal__head">' +
        '<h3 class="profile-modal__title">' + escapeHtml(titleText) + '</h3>' +
        '<button type="button" class="profile-modal__close" aria-label="Fechar">\u2715</button>' +
      '</div>' +
      '<div class="profile-modal__body"></div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('.profile-modal__backdrop').addEventListener('click', function () { closeModal(overlay); });
  overlay.querySelector('.profile-modal__close').addEventListener('click', function () { closeModal(overlay); });
  return overlay;
}

function openModal(overlay) { if (overlay) overlay.hidden = false; }
function closeModal(overlay) { if (overlay) overlay.hidden = true; }

// ── Modal: Criar Novo Personagem ─────────────────────────
function buildCreateModal() {
  createModal = buildModalShell('profile-create-modal', 'Criar Novo Personagem');
  var body = createModal.querySelector('.profile-modal__body');
  body.innerHTML =
    '<label class="profile-field__label">Nome</label>' +
    '<input type="text" id="profile-create-name" class="profile-field__input" placeholder="Nome do personagem" maxlength="40">' +
    '<label class="profile-field__label">Imagem</label>' +
    '<div class="profile-field__image">' +
      '<span class="profile-avatar profile-avatar--lg profile-avatar--empty" id="profile-create-avatar">?</span>' +
      '<button type="button" class="btn-feedback" id="profile-create-pick">Selecionar</button>' +
      '<input type="file" id="profile-create-file" accept="image/*" hidden>' +
    '</div>' +
    '<div class="profile-modal__actions">' +
      '<button type="button" class="btn-feedback" id="profile-create-cancel">Cancelar</button>' +
      '<button type="button" class="btn-feedback btn-primary" id="profile-create-confirm">Confirmar</button>' +
    '</div>';

  var fileInput = body.querySelector('#profile-create-file');
  var avatarBox = body.querySelector('#profile-create-avatar');
  body.querySelector('#profile-create-pick').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    readImageFile(fileInput.files && fileInput.files[0], function (dataUrl) {
      pendingCreateAvatar = dataUrl || '';
      if (dataUrl) {
        avatarBox.classList.remove('profile-avatar--empty');
        avatarBox.innerHTML = '<img src="' + escapeHtml(dataUrl) + '" alt="">';
      } else {
        avatarBox.classList.add('profile-avatar--empty');
        avatarBox.textContent = '?';
      }
    });
  });

  body.querySelector('#profile-create-cancel').addEventListener('click', function () { closeModal(createModal); });
  body.querySelector('#profile-create-confirm').addEventListener('click', function () {
    var nameEl = body.querySelector('#profile-create-name');
    var name = (nameEl.value || '').trim() || 'Novo Personagem';
    var res = api.onCreate(name, pendingCreateAvatar);
    if (res && res.ok) {
      closeModal(createModal);
      renderBar();
      api.toast('\u2714 Ficha criada', 'success');
    } else if (res && res.error === 'limit') {
      api.toast('Limite m\u00e1ximo de ' + MAX_PROFILES + ' fichas atingido. Remova uma ficha existente para criar outra.', 'error', 4500);
    } else {
      api.toast('N\u00e3o foi poss\u00edvel criar a ficha', 'error');
    }
  });
}

function openCreateModal() {
  pendingCreateAvatar = '';
  var body = createModal.querySelector('.profile-modal__body');
  body.querySelector('#profile-create-name').value = '';
  var avatarBox = body.querySelector('#profile-create-avatar');
  avatarBox.classList.add('profile-avatar--empty');
  avatarBox.textContent = '?';
  body.querySelector('#profile-create-file').value = '';
  openModal(createModal);
  setTimeout(function () { body.querySelector('#profile-create-name').focus(); }, 30);
}

// ── Modal: Gerenciar Fichas ──────────────────────────────
function buildManageModal() {
  manageModal = buildModalShell('profile-manage-modal', 'Gerenciar Fichas');
}

function openManageModal() {
  renderManage();
  openModal(manageModal);
}

function renderManage() {
  var body = manageModal.querySelector('.profile-modal__body');
  var profiles = getProfiles();
  var activeId = getActiveId();
  var full = isFull();

  if (!profiles.length) {
    body.innerHTML = '<div class="profile-menu__empty">Nenhuma ficha cadastrada.</div>';
    return;
  }

  body.innerHTML = '<div class="profile-manage__count">' + profiles.length + ' / ' + MAX_PROFILES + ' fichas</div>' +
    '<button type="button" class="btn-feedback btn-primary profile-manage__create" data-mact="create"' + (full ? ' disabled title="Limite de ' + MAX_PROFILES + ' fichas atingido"' : '') + '>\u2795 Criar Nova Ficha</button>' +
    profiles.map(function (p) {
      var isActive = p.id === activeId;
      return '<div class="profile-manage__row" data-id="' + escapeHtml(p.id) + '">' +
        avatarMarkup(p, 'profile-avatar--md') +
        '<div class="profile-manage__info">' +
          '<div class="profile-manage__name">' + escapeHtml(p.name) + (isActive ? ' <span class="profile-manage__badge">ativa</span>' : '') + '</div>' +
        '</div>' +
        '<div class="profile-manage__buttons">' +
          (isActive ? '' : '<button type="button" class="btn-feedback btn-primary" data-mact="switch">Usar</button>') +
          '<button type="button" class="btn-feedback" data-mact="rename">Editar Nome</button>' +
          '<button type="button" class="btn-feedback" data-mact="avatar">Alterar Imagem</button>' +
          '<button type="button" class="btn-feedback" data-mact="duplicate"' + (full ? ' disabled title="Limite atingido"' : '') + '>Duplicar</button>' +
          '<button type="button" class="btn-feedback btn-danger" data-mact="delete"' + (profiles.length <= 1 ? ' disabled title="A \u00faltima ficha n\u00e3o pode ser exclu\u00edda"' : '') + '>Excluir</button>' +
        '</div>' +
        '<input type="file" accept="image/*" hidden data-avatar-input>' +
      '</div>';
    }).join('');

  body.querySelectorAll('.profile-manage__row').forEach(function (row) {
    var id = row.getAttribute('data-id');
    var fileInput = row.querySelector('[data-avatar-input]');

    var switchBtn = row.querySelector('[data-mact="switch"]');
    if (switchBtn) switchBtn.addEventListener('click', function () {
      if (id === getActiveId()) return;
      var ok = api.onSwitch(id);
      if (ok) { renderManage(); renderBar(); api.toast('\u2714 Perfil alterado', 'success'); }
    });

    row.querySelector('[data-mact="rename"]').addEventListener('click', function () {
      var current = (function () { var list = getProfiles(); for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name; return ''; })();
      var name = window.prompt('Novo nome da ficha:', current);
      if (name == null) return;
      var res = api.onRename(id, name);
      if (res && res.ok) { renderManage(); renderBar(); api.toast('\u2714 Nome atualizado', 'success'); }
      else if (res && res.error === 'empty') api.toast('O nome n\u00e3o pode ficar vazio', 'error');
    });

    row.querySelector('[data-mact="avatar"]').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      readImageFile(fileInput.files && fileInput.files[0], function (dataUrl) {
        var res = api.onAvatarChange(id, dataUrl);
        if (res && res.ok) { renderManage(); renderBar(); api.toast('\u2714 Imagem atualizada', 'success'); }
      });
    });

    var dupBtn = row.querySelector('[data-mact="duplicate"]');
    if (dupBtn) dupBtn.addEventListener('click', function () {
      var res = api.onDuplicate(id);
      if (res && res.ok) { renderManage(); renderBar(); api.toast('\u2714 Ficha duplicada', 'success'); }
      else if (res && res.error === 'limit') api.toast('Limite m\u00e1ximo de ' + MAX_PROFILES + ' fichas atingido.', 'error', 4500);
    });

    var delBtn = row.querySelector('[data-mact="delete"]');
    if (delBtn) delBtn.addEventListener('click', function () {
      if (!window.confirm('Deseja realmente excluir essa ficha?\n\nEssa a\u00e7\u00e3o n\u00e3o pode ser desfeita.')) return;
      var res = api.onDelete(id);
      if (res && res.ok) { renderManage(); renderBar(); api.toast('Ficha exclu\u00edda', 'info'); }
    });
  });

  var createBtn = body.querySelector('[data-mact="create"]');
  if (createBtn) createBtn.addEventListener('click', function () {
    if (isFull()) {
      api.toast('Limite m\u00e1ximo de ' + MAX_PROFILES + ' fichas atingido. Remova uma ficha existente para criar outra.', 'error', 4500);
      return;
    }
    closeModal(manageModal);
    openCreateModal();
  });
}

// ── Init público ─────────────────────────────────────────
export function initProfilesUI(callbacks) {
  api = callbacks || {};
  buildBar();
  buildCreateModal();
  buildManageModal();
  renderBar();
}

// Re-renderiza a barra (nome/avatar) — chamado após auto-save.
export function refreshProfilesUI() {
  if (currentBtn) renderBar();
}

// Abre o modal de gerenciamento de fichas (usado pela roda de configurações).
export function openProfileManager() {
  if (manageModal) openManageModal();
}
