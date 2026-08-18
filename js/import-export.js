// =============================================
// IMPORT / EXPORT
// Depende de: state.js, storage.js, ui.js
// =============================================

import { state } from './state.js';
import { snapshot, applySnapshot } from './storage.js';
import { showToast } from './ui.js';
import { saveSafetyBackup } from './backup.js';
import { ensurePdfLib, ensureHtml2canvas } from './vendor-loader.js';
import { getStore, saveActiveSnapshot, PROFILES_KEY } from './profiles.js';

// Valida se um objeto tem a "cara" de uma ficha exportada por este app.
// Não é um schema rígido (para não rejeitar fichas antigas/parciais),
// apenas uma checagem de sanidade contra arquivos totalmente inválidos.
function isValidSheet(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  // Aceita se tiver ao menos uma das seções conhecidas de uma ficha.
  var knownKeys = ['acessoRapido', 'persona', 'notes', 'spells', 'equip', 'links', 'background'];
  return knownKeys.some(function(k) { return k in data; });
}

export function initImportExport() {
  // =============================================
  // EXPORTAR (.json)
  // =============================================
  var exportBtn = document.getElementById('export');
  if (exportBtn) exportBtn.addEventListener('click', function() {
    try {
      var json = JSON.stringify(snapshot(), null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (state.CharPlayer || 'ficha') + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('\u2713 Ficha exportada', 'success');
    } catch (e) {
      console.error('[Exportar] Erro ao exportar ficha:', e);
      showToast('Erro ao exportar ficha', 'error');
    }
  });

  // =============================================
  // IMPORTAR (.json)
  // =============================================
  var importBtn = document.getElementById('import');
  if (importBtn) importBtn.addEventListener('click', function() {
    var i = document.createElement('input');
    i.type = 'file';
    i.accept = 'application/json';
    i.onchange = function() {
      var f = i.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function() {
        var parsed;
        try {
          parsed = JSON.parse(r.result);
        } catch (e) {
          console.warn('[Importar] JSON inválido:', e);
          showToast('Arquivo inválido: não é um JSON válido.', 'error', 4000);
          return;
        }
        if (!isValidSheet(parsed)) {
          showToast('Arquivo inválido: não parece ser uma ficha exportada.', 'error', 4000);
          return;
        }
        if (!confirm('Importar esta ficha vai substituir os dados atuais.\nUm backup de segurança será criado. Deseja continuar?')) {
          return;
        }
        // Backup de segurança da ficha atual antes de sobrescrever.
        try { saveSafetyBackup(snapshot()); } catch (e) {}
        try {
          applySnapshot(parsed);
          showToast('\u2713 Ficha importada', 'success');
        } catch (e) {
          console.error('[Importar] Erro ao aplicar ficha:', e);
          showToast('Erro ao importar ficha', 'error');
        }
      };
      r.readAsText(f);
    };
    i.click();
  });

  // =============================================
  // PDF (fill-in)
  // =============================================
  var fillBtn = document.getElementById('fill');
  if (fillBtn) fillBtn.addEventListener('click', function() {
    var pdfFileBtn = document.getElementById('pdfFile');
    if (pdfFileBtn) pdfFileBtn.click();
  });

  var pdfFileEl = document.getElementById('pdfFile');
  if (pdfFileEl) pdfFileEl.addEventListener('change', async function(ev) {
    var file = ev.target.files[0]; if (!file) return;
    try {
      try { await ensurePdfLib(); } catch (le) {
        showToast('Não foi possível carregar a biblioteca de PDF', 'error', 4000);
        return;
      }
      var ab = await file.arrayBuffer();
      var pdfDoc = await PDFLib.PDFDocument.load(ab);
      var form = pdfDoc.getForm();

      var setTxt = function(name, val) {
        try {
          var field = form.getField(name);
          if (field.setText) field.setText(String(val != null ? val : ''));
          else if (field.select) field.select(String(val != null ? val : ''));
        } catch (e) {}
      };

      var s = snapshot();
      var g = s.acessoRapido || {};
      var p = s.persona || {};
      var n = s.notes || {};

      var map = {
        CharName: g.PerName || g.CharPlayer || '',
        CharPlayer: g.CharPlayer || '',
        CharClass: g.CharClass || '',
        CharLvl: g.CharLvl || '',
        CharArcana: g.CharArcana || '',
        CharSTR: g.CharSTR || '', CharMAG: g.CharMAG || '', CharTEC: g.CharTEC || '',
        CharAGI: g.CharAGI || '', CharVIT: g.CharVIT || '', CharLCK: g.CharLCK || '',
        MaxHP: g.MaxHP || '', CurrentHP: g.CurrentHP || '',
        EnergyMax: g.EnergyMax || '', CurrentPM: g.CurrentPM || '',
        DmgRed: g.DmgRed || '',
        KNOPts: g.KNOPts || '', DISPts: g.DISPts || '', EMPpts: g.EMPpts || '',
        CHAPts: g.CHAPts || '', EXPPts: g.EXPPts || '', COUPts: g.COUPts || '',
        PerName: p.PerName || g.PerName || '',
        PerArcana: p.PerArcana || g.PerArcana || '',
        PerLvl: p.PerLvl || g.PerLvl || '',
        PerNotes: p.PerNotes || g.PerNotes || '',
        EquipList: (s.equip || []).map(function(e) {
          return '[' + (e.local === 'equipado' ? 'Equipado' : 'Mochila') + '] ' +
            e.nome + ' (Peso:' + (e.peso || 0) + ' x' + (e.qtd || 1) + ')' +
            (e.efeito ? ' \u2014 ' + e.efeito : '');
        }).join('\n'),
        SpellList: (s.spells || []).map(function(sp) {
          return sp.nome + ' (' + sp.tipo + ', ' + sp.custo + ') \u2014 ' + sp.efeito;
        }).join('\n'),
        LinksList: (s.links || []).map(function(l) {
          return l.nome + ' \u2014 ' + l.arcana + ' Rk.' + l.rank + (l.obs ? ' \u2014 ' + l.obs : '');
        }).join('\n'),
        NotesDiary: n.diary || '',
        NotesGoals: n.goals || '',
        NotesClues: (n.clues || []).map(function(c) {
          return '\u2022 ' + c.titulo + ': ' + c.desc + ' [' + c.evid + '] (' + c.status + ')';
        }).join('\n'),
        NotesContacts: (n.contacts || []).map(function(c) {
          return '\u2022 ' + c.nome + ' (' + c.tipo + ') \u2014 ' + c.obs;
        }).join('\n')
      };

      var AF_MAP = {
        "F\u00edsico": "AF_Fisico", "Fogo": "AF_Fogo", "Gelo": "AF_Gelo",
        "Vento": "AF_Vento", "Raio": "AF_Raio", "Nuclear": "AF_Nuclear",
        "PSY": "AF_PSY", "Luz": "AF_Luz", "Trevas": "AF_Trevas",
        "Onipotente": "AF_Onipotente"
      };

      Object.entries(AF_MAP).forEach(function(entry) {
        setTxt(entry[1], (s.affinities && s.affinities[entry[0]]) || 'Normal');
      });
      Object.entries(map).forEach(function(entry) { setTxt(entry[0], entry[1]); });

      var filled = await pdfDoc.save();
      var blob = new Blob([filled], { type: 'application/pdf' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (g.CharName || 'ficha') + ' - Preenchida.pdf';
      a.click();
      setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
    } catch (e) {
      console.error('[PDF] Erro ao preencher PDF:', e);
      showToast('Erro ao preencher PDF', 'error');
    }
  });

  // =============================================
  // PNG (html2canvas)
  // =============================================
  var pngBtn = document.getElementById('png');
  if (pngBtn) pngBtn.addEventListener('click', async function() {
    try { await ensureHtml2canvas(); } catch (le) {
      showToast('Não foi possível carregar a biblioteca de captura', 'error', 4000);
      return;
    }
    if (typeof html2canvas !== 'function') {
      showToast('html2canvas bloqueado no preview. Teste local.', 'error', 3500);
      return;
    }
    var node = document.getElementById('captureRoot');
    if (!node) return;
    try {
      var canvas = await html2canvas(node, { backgroundColor: null, scale: 2, useCORS: true });
      canvas.toBlob(function(blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (state.CharPlayer || 'ficha') + '.png';
        a.click();
        setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
      });
    } catch (e) {
      console.error('[PNG] Erro ao capturar imagem:', e);
      showToast('Erro ao capturar imagem', 'error');
    }
  });

  // =============================================
  // PRINT
  // =============================================
  var printBtn = document.getElementById('print');
  if (printBtn) printBtn.addEventListener('click', function() { window.print(); });

  // =============================================
  // BACKUP COMPLETO — exporta/importa TODOS os personagens
  // =============================================
  var exportAllBtn = document.getElementById('export-all');
  if (exportAllBtn) exportAllBtn.addEventListener('click', function() {
    try {
      // Garante que a ficha ativa esteja salva no perfil antes de exportar.
      try { saveActiveSnapshot(snapshot()); } catch (e) {}
      var payload = {
        type: 'persona-backup-completo',
        version: 1,
        exportedAt: new Date().toISOString(),
        store: getStore()
      };
      var json = JSON.stringify(payload, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'personas-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('\u2713 Backup completo exportado', 'success');
    } catch (e) {
      console.error('[Backup completo] Erro ao exportar:', e);
      showToast('Erro ao exportar backup completo', 'error');
    }
  });

  var importAllBtn = document.getElementById('import-all');
  if (importAllBtn) importAllBtn.addEventListener('click', function() {
    var i = document.createElement('input');
    i.type = 'file';
    i.accept = 'application/json';
    i.onchange = function() {
      var f = i.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function() {
        var parsed;
        try {
          parsed = JSON.parse(r.result);
        } catch (e) {
          showToast('Arquivo inválido: não é um JSON válido.', 'error', 4000);
          return;
        }
        // Aceita tanto o envelope { store: {...} } quanto o próprio store.
        var incoming = (parsed && parsed.store) ? parsed.store : parsed;
        if (!incoming || !Array.isArray(incoming.profiles)) {
          showToast('Arquivo inválido: não parece ser um backup completo.', 'error', 4000);
          return;
        }
        if (!confirm('Importar este backup vai SUBSTITUIR todos os personagens atuais.\nRecomenda-se exportar um backup antes. Deseja continuar?')) {
          return;
        }
        try {
          localStorage.setItem(PROFILES_KEY, JSON.stringify(incoming));
          showToast('\u2713 Backup importado. Recarregando...', 'success', 1500);
          setTimeout(function() { location.reload(); }, 800);
        } catch (e) {
          console.error('[Backup completo] Erro ao importar:', e);
          showToast('Erro ao importar backup completo', 'error');
        }
      };
      r.readAsText(f);
    };
    i.click();
  });
}
