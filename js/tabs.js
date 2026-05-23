// =============================================
// ABAS (tabs)
// Sem dependências de módulos do projeto
// =============================================

export function initTabs() {
  var tabs = Array.from(document.querySelectorAll('.tab'));
  var views = Array.from(document.querySelectorAll('.view'));
  if (!tabs.length || !views.length) return;

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.dataset.target;
      tabs.forEach(function(t) { t.classList.remove('active'); });
      views.forEach(function(v) { v.classList.remove('active'); });
      tab.classList.add('active');
      var view = document.getElementById(target);
      if (view) view.classList.add('active');

      // Após mudar de aba, inicializar auto-resize para os novos textareas visíveis
      requestAnimationFrame(function() {
        if (typeof window.initAutoResizeTextareas === 'function') {
          window.initAutoResizeTextareas();
        }
      });
    });
  });

  // Ativar primeira aba por padrão
  if (tabs[0] && !tabs.some(function(t) { return t.classList.contains('active'); })) {
    tabs[0].click();
  }
}
