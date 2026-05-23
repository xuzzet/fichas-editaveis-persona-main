// =============================================
// TEMAS
// Sem dependências de módulos do projeto
// =============================================

export var themeMap = {
  padrao:      'theme-padrao',
  roxo:        'theme-roxo',
  claro:       'theme-claro',
  vermelho:    'theme-vermelho',
  degrade:     'theme-degrade',
  corinthians: 'theme-corinthians',
  rosa:        'theme-rosa',
  kamenrider:  'theme-kamenrider',
  amarelo:     'theme-amarelo'
};

export function applyTheme(value) {
  var cls = themeMap[value] || themeMap['padrao'];
  var prev = document.body.className.match(/theme-\S+/);
  if (prev) document.body.classList.remove(prev[0]);
  document.body.classList.add(cls);
}

export function saveTheme(value) {
  try { localStorage.setItem('ficha-theme', value); } catch (e) {}
}

export function loadTheme() {
  try { return localStorage.getItem('ficha-theme') || 'padrao'; } catch (e) { return 'padrao'; }
}

export function initTheme() {
  var sel = document.getElementById('themeSelect');
  if (!sel) return;

  // Aplicar tema salvo
  var saved = loadTheme();
  sel.value = saved;
  applyTheme(saved);

  sel.addEventListener('change', function() {
    applyTheme(sel.value);
    saveTheme(sel.value);
  });
}
