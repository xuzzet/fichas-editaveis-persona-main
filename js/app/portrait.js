// =============================================
// APP — RETRATO (upload + modal de zoom)
// Widget autocontido; depende apenas do DOM.
// =============================================

// =============================================
// PORTRAIT
// =============================================

export function initPortrait() {
  var portraitBtn        = document.getElementById('portraitBtn');
  var portraitInput      = document.getElementById('portraitInput');
  var portraitPreview    = document.getElementById('portraitPreview');
  var portraitZoomBtn    = document.getElementById('portraitZoomBtn');
  var portraitModal      = document.getElementById('portraitModal');
  var portraitModalImg   = document.getElementById('portraitModalImg');
  var portraitModalClose = document.getElementById('portraitModalClose');
  var backdrop = portraitModal ? portraitModal.querySelector('.portrait-modal__backdrop') : null;

  // ── Upload ──────────────────────────────────────────────
  if (portraitBtn && portraitInput) {
    portraitBtn.addEventListener('click', function () { portraitInput.click(); });
  }
  if (portraitInput && portraitPreview) {
    portraitInput.addEventListener('change', function () {
      var file = portraitInput.files[0];
      if (!file) { portraitPreview.innerHTML = ''; return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        portraitPreview.innerHTML = '';
        var img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Retrato';
        portraitPreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Abrir modal ──────────────────────────────────────────
  function openModal() {
    if (!portraitModal || !portraitModalImg) return;
    var imgEl = portraitPreview ? portraitPreview.querySelector('img') : null;
    if (!imgEl) return;
    var src = imgEl.getAttribute('src') || '';
    if (!src || !src.startsWith('data:')) return;
    portraitModalImg.src = src;
    portraitModal.classList.add('is-open');
    portraitModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  // ── Fechar modal ─────────────────────────────────────────
  function closeModal() {
    if (!portraitModal) return;
    portraitModal.classList.remove('is-open');
    portraitModal.setAttribute('aria-hidden', 'true');
    if (portraitModalImg) portraitModalImg.src = '';
    document.body.classList.remove('modal-open');
  }

  // Botão "Ampliar Imagem"
  if (portraitZoomBtn) {
    portraitZoomBtn.addEventListener('click', openModal);
  }

  // Clique direto no preview da imagem
  if (portraitPreview) {
    portraitPreview.addEventListener('click', function (e) {
      if (e.target.tagName === 'IMG') openModal();
    });
  }

  // Botão X do modal
  if (portraitModalClose) {
    portraitModalClose.addEventListener('click', closeModal);
  }

  // Clique no backdrop (fora da imagem)
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }

  // Tecla Esc
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && portraitModal && portraitModal.classList.contains('is-open')) {
      closeModal();
    }
  });
}
