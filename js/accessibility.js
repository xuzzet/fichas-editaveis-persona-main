// =============================================
// ACESSIBILIDADE
// Fonte para dislexia + modos para daltonismo.
// Sem dependências de módulos do projeto.
// =============================================

var DYS_KEY = 'ficha-a11y-dyslexia';
var CB_KEY = 'ficha-a11y-colorblind';

// Classes de daltonismo aplicadas ao <body>. Cada uma ativa um
// filtro SVG de daltonização (correção) definido no index.html.
var CB_CLASSES = {
  none: '',
  protanopia: 'cb-protanopia',
  deuteranopia: 'cb-deuteranopia',
  tritanopia: 'cb-tritanopia'
};

function safeGet(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
}

export function applyDyslexia(on) {
  document.body.classList.toggle('a11y-dyslexia', !!on);
}

export function applyColorblind(mode) {
  // Remove todas as classes de daltonismo antes de aplicar a nova.
  Object.keys(CB_CLASSES).forEach(function (k) {
    if (CB_CLASSES[k]) document.body.classList.remove(CB_CLASSES[k]);
  });
  var cls = CB_CLASSES[mode];
  if (cls) document.body.classList.add(cls);
}

export function initAccessibility() {
  var dysToggle = document.getElementById('a11yDyslexia');
  var cbSelect = document.getElementById('a11yColorblind');

  // Estado salvo
  var dysOn = safeGet(DYS_KEY, 'off') === 'on';
  var cbMode = safeGet(CB_KEY, 'none');
  if (!Object.prototype.hasOwnProperty.call(CB_CLASSES, cbMode)) cbMode = 'none';

  applyDyslexia(dysOn);
  applyColorblind(cbMode);

  if (dysToggle) {
    dysToggle.checked = dysOn;
    dysToggle.addEventListener('change', function () {
      applyDyslexia(dysToggle.checked);
      safeSet(DYS_KEY, dysToggle.checked ? 'on' : 'off');
    });
  }

  if (cbSelect) {
    cbSelect.value = cbMode;
    cbSelect.addEventListener('change', function () {
      applyColorblind(cbSelect.value);
      safeSet(CB_KEY, cbSelect.value);
    });
  }
}
