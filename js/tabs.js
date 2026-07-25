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
      var isActive = t.dataset.view === viewKey;
      t.classList.toggle('active', isActive);
      // Acessibilidade: estado e ordem de tabulação seguem a aba ativa.
      if (t.getAttribute('role') === 'tab') {
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        t.tabIndex = isActive ? 0 : -1;
      }
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

  tabs.forEach(function(tab, index) {
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

    // Navegação por teclado (padrão WAI-ARIA de tablist).
    tab.addEventListener('keydown', function(e) {
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      var target = tabs[next];
      if (target) { target.focus(); target.click(); }
    });
  });

  // Ativar a aba que já tem .active no HTML, ou a primeira
  var activeTab = document.querySelector('.tab.active');
  var firstTab = activeTab || tabs[0];
  if (firstTab && firstTab.dataset.view) {
    activateTab(firstTab.dataset.view);
  }

  // Atalho global: Alt+1..N alterna diretamente para a aba correspondente.
  document.addEventListener('keydown', function(e) {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    var n = parseInt(e.key, 10);
    if (!(n >= 1 && n <= tabs.length)) return;
    var target = tabs[n - 1];
    if (target && target.dataset.view) {
      e.preventDefault();
      activateTab(target.dataset.view);
      target.focus();
    }
  });
}
