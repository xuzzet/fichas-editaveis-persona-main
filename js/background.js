// =============================================
// PLANO DE FUNDO / CENÁRIO
// Troca a imagem de ambientação urbana (camada visual body::before).
// Segue o mesmo padrão de themes.js: global via localStorage,
// aplicado por classe no <body>. Não altera estado, cálculos,
// armazenamento das fichas nem componentes.
// Sem dependências de módulos do projeto.
// =============================================

export var backgroundMap = {
  cidade1: 'bg-city-1',
  cidade2: 'bg-city-2',
  cidade3: 'bg-city-3',
  cidade4: 'bg-city-4',
  cidade5: 'bg-city-5',
  nenhum:  'bg-city-none'
};

export function applyBackground(value) {
  var cls = backgroundMap[value] || backgroundMap['cidade1'];
  var prev = document.body.className.match(/bg-city-\S+/);
  if (prev) document.body.classList.remove(prev[0]);
  document.body.classList.add(cls);
}

export function saveBackground(value) {
  try { localStorage.setItem('ficha-background', value); } catch (e) {}
}

export function loadBackground() {
  try { return localStorage.getItem('ficha-background') || 'cidade1'; } catch (e) { return 'cidade1'; }
}

export function initBackground() {
  var sel = document.getElementById('backgroundSelect');
  if (!sel) return;

  // Aplicar cenário salvo
  var saved = loadBackground();
  sel.value = saved;
  applyBackground(saved);

  sel.addEventListener('change', function() {
    applyBackground(sel.value);
    saveBackground(sel.value);
  });
}
