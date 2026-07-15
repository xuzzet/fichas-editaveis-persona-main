// =============================================
// PERSISTÊNCIA — SNAPSHOT / APPLY
// Depende de: state.js, calculations.js, inventory.js, feats.js, conditions.js, modifiers.js, ui.js
// =============================================

import { state, FIELD_IDS, NUMBER_FIELDS } from './state.js';
import { recalcState, validateState } from './calculations.js';
import { syncEquipToState, syncSpellsToState, syncLinksToState,
         syncCluesToState, syncContactsToState, migrateEquipItem } from './inventory.js';
import { syncFeitosToState } from './feats.js';
import { syncConditionsToState } from './conditions.js';
import { syncModifiersToState } from './modifiers.js';
import { syncAffinityToState } from './ui.js';

// Injeção de renderAll (evita dependência circular)
var _renderAll = null;
export function setRenderAll(fn) { _renderAll = fn; }

// =============================================
// SNAPSHOT
// =============================================

export function snapshot() {
  // Sincronizar tabelas DOM → state antes do snapshot
  syncEquipToState();
  syncSpellsToState();
  syncLinksToState();
  syncCluesToState();
  syncContactsToState();
  syncModifiersToState();
  syncFeitosToState();
  syncConditionsToState();
  syncAffinityToState();

  // Portrait do DOM
  state.portrait.src = (document.querySelector('#portraitPreview img') || {}).src || '';

  // Background do DOM
  var bgEls = Array.from(document.querySelectorAll('[id^="bg"]'));
  var background = {};
  bgEls.forEach(function(el) { background[el.id] = el.value || ''; });
  state.background = background;

  return {
    id: "ficha-yby-p3r-skin",
    acessoRapido: {
      CharClass: state.CharClass || "", CharLvl: state.CharLvl || "", CharArcana: state.CharArcana || "", CharPlayer: state.CharPlayer || "",
      CharSTR: state.CharSTR || "", CharMAG: state.CharMAG || "", CharTEC: state.CharTEC || "", CharAGI: state.CharAGI || "", CharVIT: state.CharVIT || "", CharLCK: state.CharLCK || "",
      MaxHP: state.MaxHP || "", CurrentHP: state.CurrentHP || "", EnergyMax: state.EnergyMax || "", CurrentPM: state.CurrentPM || "", DmgRed: state.DmgRed || "",
      pvMax: state.MaxHP || "", pvAtual: state.CurrentHP || "", pmMax: state.EnergyMax || "", pmAtual: state.CurrentPM || "",
      KNOPts: state.KNOPts || "", DISPts: state.DISPts || "", EMPpts: state.EMPpts || "", EXPPts: state.EXPPts || "", COUPts: state.COUPts || "", CHAPts: state.CHAPts || "",
      Aspectos: state.Aspectos || "", AspectPoints: state.AspectPoints || "", Buffs: state.Buffs || "",
      PerName: state.PerName || "", PerArcana: state.PerArcana || "", PerLvl: state.PerLvl || "", PerNotes: state.PerNotes || "", PerSP: state.PerSP || "", PerTypes: state.PerTypes || "",
      Weapon: state.Weapon || "", WeaponDmg: state.WeaponDmg || "", WeaponReach: state.WeaponReach || "", WeaponEffect: state.WeaponEffect || "",
      Armor: state.Armor || "", ArmorDmgRed: state.ArmorDmgRed || "", ArmorEffect: state.ArmorEffect || "",
      Accessory: state.Accessory || "", AccessoryEffect: state.AccessoryEffect || "",
      Resistances: state.Resistances || ""
    },
    persona: {
      PerName: state.PerName || "", PerArcana: state.PerArcana || "", PerLvl: state.PerLvl || 1,
      PerNotes: state.PerNotes || "", Conviction: state.Conviction || "", NaturalSkill: "",
      PerSP: state.PerSP || 0, PerTypes: state.PerTypes || ""
    },
    affinities: JSON.parse(JSON.stringify(state.affinities || {})),
    spells: JSON.parse(JSON.stringify(state.spells || [])),
    feitos: JSON.parse(JSON.stringify(state.feitos || [])),
    equip: JSON.parse(JSON.stringify(state.equip || [])),
    links: JSON.parse(JSON.stringify(state.links || [])),
    notes: {
      diary: state.NotesDiary || "",
      goals: state.NotesGoals || "",
      clues: JSON.parse(JSON.stringify(state.clues || [])),
      contacts: JSON.parse(JSON.stringify(state.contacts || []))
    },
    portrait: { src: state.portrait.src || '' },
    background: JSON.parse(JSON.stringify(state.background || {})),
    conditions: JSON.parse(JSON.stringify(state.conditions || [])),
    modifiers: JSON.parse(JSON.stringify(state.modifiers || [])),
    feitoConfig: JSON.parse(JSON.stringify(state.feitoConfig || {})),
    rollHistory: JSON.parse(JSON.stringify(state.rollHistory || [])),
    personaAwakenings: JSON.parse(JSON.stringify(state.personaAwakenings || {}))
  };
}

// =============================================
// APPLY SNAPSHOT
// =============================================

export function applySnapshot(data) {
  if (!data) return;
  var g = data.acessoRapido || {};

  // Campos simples do acessoRapido
  FIELD_IDS.forEach(function(key) {
    if (g[key] !== undefined && g[key] !== '') {
      state[key] = NUMBER_FIELDS.has(key) ? (Number(g[key]) || 0) : g[key];
    }
  });

  // Compatibilidade com chaves antigas
  if (g.pvMax != null && g.pvMax !== '') state.MaxHP = Number(g.pvMax) || 0;
  if (g.pvAtual != null && g.pvAtual !== '') state.CurrentHP = Number(g.pvAtual) || 0;
  if (g.pmMax != null && g.pmMax !== '') state.EnergyMax = Number(g.pmMax) || 0;
  if (g.pmAtual != null && g.pmAtual !== '') state.CurrentPM = Number(g.pmAtual) || 0;

  // Persona (sobrescreve se existir)
  if (data.persona) {
    if (data.persona.PerName) state.PerName = data.persona.PerName;
    if (data.persona.PerArcana) state.PerArcana = data.persona.PerArcana;
    if (data.persona.PerLvl) state.PerLvl = Number(data.persona.PerLvl) || 1;
    if (data.persona.PerNotes) state.PerNotes = data.persona.PerNotes;
    if (data.persona.Conviction) state.Conviction = data.persona.Conviction;
    if (data.persona.PerSP) state.PerSP = Number(data.persona.PerSP) || 0;
    if (data.persona.PerTypes) state.PerTypes = data.persona.PerTypes;
  }

  // Arrays e objetos complexos
  state.affinities = data.affinities || {};
  state.spells = data.spells || [];
  state.equip = (data.equip || []).map(migrateEquipItem);
  state.links = data.links || [];
  state.clues = (data.notes && data.notes.clues) || [];
  state.contacts = (data.notes && data.notes.contacts) || [];
  if (data.notes) {
    if (data.notes.diary) state.NotesDiary = data.notes.diary;
    if (data.notes.goals) state.NotesGoals = data.notes.goals;
  }
  state.feitos = data.feitos || [];
  state.conditions = data.conditions || [];
  state.modifiers = data.modifiers || [];
  state.feitoConfig = data.feitoConfig || {};
  state.portrait = data.portrait || { src: '' };
  state.background = data.background || {};
  // Histórico de rolagens (fallback para saves antigos sem o campo)
  state.rollHistory = Array.isArray(data.rollHistory) ? data.rollHistory : [];
  // Despertar Trama (fallback para saves antigos sem o campo)
  state.personaAwakenings = (data.personaAwakenings && typeof data.personaAwakenings === 'object') ? data.personaAwakenings : {};

  // Recalcular HP/PM com atributos + modificadores restaurados
  recalcState();

  // Restaurar HP/PM atuais do snapshot (sobrescrever o que recalc calculou)
  var savedCurrentHP = g.CurrentHP || g.pvAtual;
  var savedCurrentPM = g.CurrentPM || g.pmAtual;
  if (savedCurrentHP != null && savedCurrentHP !== '') {
    state.CurrentHP = Number(savedCurrentHP) || 0;
  } else {
    state.CurrentHP = state.MaxHP;
  }
  if (savedCurrentPM != null && savedCurrentPM !== '') {
    state.CurrentPM = Number(savedCurrentPM) || 0;
  } else {
    state.CurrentPM = state.EnergyMax;
  }

  validateState();
  if (_renderAll) _renderAll();
}
