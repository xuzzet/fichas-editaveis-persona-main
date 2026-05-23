// =============================================
// ABAS (tabs)
// Sem dependências de módulos do projeto
// =============================================

export function initTabs() {
  var tabs = Array.from(document.querySelectorAll('.tab'));
  var views = Array.from(document.querySelectorAll('.view'));

  if (!tabs.length || !views.length) {
    console.warn('[tabs] Abas ou views não encontradas no DOM.');
    return;
  }

  function activateTab(viewId) {
    tabs.forEach(function(t) {
      t.classList.toggle('active', t.dataset.view === viewId);
    });
    views.forEach(function(v) {
      v.classList.toggle('active', v.id === viewId);
    });
    // Auto-resize textareas que ficaram visíveis
    requestAnimationFrame(function() {
      if (typeof window.initAutoResizeTextareas === 'function') {
        window.initAutoResizeTextareas();
      }
    });
  }

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var viewId = tab.dataset.view;
      if (!viewId) return;
      if (!document.getElementById(viewId)) {
        console.warn('[tabs] View não encontrada: ' + viewId);
        return;
      }
      activateTab(viewId);
    });
  });

  // Ativar a aba que já tem .active no HTML, ou a primeira
  var activeTab = document.querySelector('.tab.active');
  var firstTab = activeTab || tabs[0];
  if (firstTab && firstTab.dataset.view) {
    activateTab(firstTab.dataset.view);
  }
}
