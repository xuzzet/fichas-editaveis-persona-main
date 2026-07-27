// =============================================
// UI - TOAST
// =============================================

// =============================================
// TOAST
// =============================================

export function showToast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3000;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function() {
    setTimeout(function() {
      toast.classList.add('out');
      setTimeout(function() { toast.remove(); }, 300);
    }, duration);
  });
}
