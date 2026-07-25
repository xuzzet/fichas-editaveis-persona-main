// =============================================
// HISTÓRICO DE ALTERAÇÕES — DESFAZER / REFAZER
// Mantém uma pilha em memória de snapshots da ficha para permitir
// desfazer/refazer (Ctrl+Z / Ctrl+Y). Camada 100% aditiva: usa apenas
// snapshot()/applySnapshot() já existentes, sem tocar em cálculos,
// regras ou na estrutura do estado.
// =============================================

var past = [];      // pilha de estados (o último é o estado atual)
var future = [];     // estados desfeitos, disponíveis para refazer
var MAX = 40;        // limite de entradas guardadas
var suppressed = false;

var getSnap = null;
var applySnap = null;
var afterRestore = null;

// Inicializa o histórico com o estado atual como base.
export function initHistory(opts) {
  opts = opts || {};
  getSnap = opts.getSnapshot;
  applySnap = opts.applySnapshot;
  afterRestore = opts.afterRestore || function () {};
  try {
    past = getSnap ? [JSON.stringify(getSnap())] : [];
  } catch (e) {
    past = [];
  }
  future = [];
  updateButtons();
}

// Registra o estado atual como um novo ponto no histórico.
// Chamado após cada gravação automática (auto-save).
export function recordHistory() {
  if (suppressed || !getSnap) return;
  var snap;
  try { snap = JSON.stringify(getSnap()); } catch (e) { return; }
  if (past.length && past[past.length - 1] === snap) return; // sem mudança real
  past.push(snap);
  if (past.length > MAX) past.shift();
  future = []; // qualquer nova alteração invalida o "refazer"
  updateButtons();
}

export function undo() {
  if (past.length < 2 || !applySnap) return false;
  var current = past.pop();
  future.push(current);
  restore(past[past.length - 1]);
  return true;
}

export function redo() {
  if (!future.length || !applySnap) return false;
  var next = future.pop();
  past.push(next);
  restore(next);
  return true;
}

function restore(json) {
  suppressed = true;
  try {
    applySnap(JSON.parse(json));
    afterRestore();
  } catch (e) {
    console.warn('[Histórico] Erro ao restaurar estado:', e);
  }
  suppressed = false;
  updateButtons();
}

export function canUndo() { return past.length >= 2; }
export function canRedo() { return future.length > 0; }

function updateButtons() {
  var u = document.getElementById('undo-btn');
  var r = document.getElementById('redo-btn');
  if (u) u.disabled = !canUndo();
  if (r) r.disabled = !canRedo();
}
