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

  // Uma aba pode controlar várias views (data-view separado por espaços).
  // Ex.: data-view="background notes" mostra as duas de uma vez.
  function activateTab(viewKey) {
    var ids = String(viewKey).split(/\s+/).filter(Boolean);
    tabs.forEach(function(t) {
      t.classList.toggle('active', t.dataset.view === viewKey);
    });
    views.forEach(function(v) {
      v.classList.toggle('active', ids.indexOf(v.id) !== -1);
    });
    // Volta ao topo ao trocar de aba (evita ficar "no meio" da aba anterior)
    if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'auto' });
    // Auto-resize textareas que ficaram visíveis
    requestAnimationFrame(function() {
      if (typeof window.initAutoResizeTextareas === 'function') {
        window.initAutoResizeTextareas();
      }
    });
  }

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var viewKey = tab.dataset.view;
      if (!viewKey) return;
      var ids = String(viewKey).split(/\s+/).filter(Boolean);
      var anyExists = ids.some(function(id) { return document.getElementById(id); });
      if (!anyExists) {
        console.warn('[tabs] View não encontrada: ' + viewKey);
        return;
      }
      activateTab(viewKey);
    });
  });

  // Ativar a aba que já tem .active no HTML, ou a primeira
  var activeTab = document.querySelector('.tab.active');
  var firstTab = activeTab || tabs[0];
  if (firstTab && firstTab.dataset.view) {
    activateTab(firstTab.dataset.view);
  }
}
