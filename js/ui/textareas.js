// =============================================
// UI - AUTO-RESIZE TEXTAREAS
// =============================================

// =============================================
// AUTO-RESIZE TEXTAREAS
// =============================================

export function autoResizeTextarea(textarea) {
  if (!textarea || textarea.tagName !== 'TEXTAREA') return;
  if (textarea.offsetParent === null) return;
  textarea.style.overflowY = 'auto';
  textarea.style.height = 'auto';
  var maxHeight = 420;
  var style = window.getComputedStyle(textarea);
  var minHeight = parseFloat(style.minHeight) || textarea.offsetHeight || 0;
  var newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = Math.max(newHeight, minHeight) + 'px';
}

export function initAutoResizeTextareas() {
  Array.from(document.querySelectorAll('textarea')).forEach(function(textarea) {
    autoResizeTextarea(textarea);
    if (textarea.dataset.autoresizeInit !== '1') {
      textarea.addEventListener('input', function() { autoResizeTextarea(textarea); });
      textarea.dataset.autoresizeInit = '1';
    }
  });
}
