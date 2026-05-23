// =============================================
// IMPORT / EXPORT
// Depende de: state.js, storage.js, ui.js
// =============================================

import { state } from './state.js';
import { snapshot, applySnapshot } from './storage.js';
import { showToast, ids } from './ui.js';

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
        try { applySnapshot(JSON.parse(r.result)); showToast('\u2713 Ficha importada', 'success'); }
        catch (e) { showToast('Erro ao importar ficha', 'error'); }
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
      var ab = await file.arrayBuffer();
      var pdfDoc = await PDFLib.PDFDocument.load(ab);
      var form = pdfDoc.getForm();

      function setTxt(name, val) {
        try {
          var field = form.getField(name);
          if (field.setText) field.setText(String(val != null ? val : ''));
          else if (field.select) field.select(String(val != null ? val : ''));
        } catch (e) {}
      }

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
}
