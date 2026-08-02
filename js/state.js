// =============================================
// ESTADO CENTRAL E TIPOS DE CAMPOS
// Sem dependências de projeto.
// =============================================

export let _rendering = false;
export function setRendering(v) { _rendering = v; }

// Campos que mapeiam 1:1 entre state e DOM (por ID)
export const FIELD_IDS = [
  'CharClass','CharLvl','CharArcana','CharPlayer',
  'CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK',
  'MaxHP','CurrentHP','EnergyMax','CurrentPM','DmgRed',
  'KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts',
  'Aspectos','AspectPoints','Buffs',
  'PerName','PerArcana','PerLvl','PerNotes','PerSP','PerTypes',
  'Conviction',
  'Weapon','WeaponDmg','WeaponReach','WeaponEffect',
  'Armor','ArmorDmgRed','ArmorEffect',
  'Accessory','AccessoryEffect',
  'Resistances','NotesDiary','NotesGoals'
];

// Campos numéricos (auto-convertidos em setState)
export const NUMBER_FIELDS = new Set([
  'CharLvl','CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK',
  'MaxHP','CurrentHP','EnergyMax','CurrentPM','DmgRed',
  'KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts',
  'AspectPoints','PerLvl','PerSP'
]);

// Campos que exigem recálculo de HP/PM/badges quando alterados
export const RECALC_FIELDS = new Set([
  'CharLvl','CharSTR','CharMAG','CharTEC','CharAGI','CharVIT','CharLCK',
  'KNOPts','DISPts','EMPpts','EXPPts','COUPts','CHAPts'
]);

export const state = {
  // Personagem
  CharClass: '', CharLvl: 1, CharArcana: '', CharPlayer: '',
  // Atributos de combate (base, antes de modificadores)
  CharSTR: 1, CharMAG: 1, CharTEC: 1, CharAGI: 1, CharVIT: 1, CharLCK: 1,
  // HP/PM
  MaxHP: 0, CurrentHP: 0, EnergyMax: 0, CurrentPM: 0, DmgRed: 0,
  // Social
  KNOPts: 0, DISPts: 0, EMPpts: 0, EXPPts: 0, COUPts: 0, CHAPts: 0,
  // Aspectos & Buffs
  Aspectos: '', AspectPoints: 0, Buffs: '',
  // Persona
  PerName: '', PerArcana: '', PerLvl: 1, PerNotes: '', PerSP: 0, PerTypes: '',
  Conviction: '',
  // Equipamento rápido
  Weapon: '', WeaponDmg: '', WeaponReach: '', WeaponEffect: '',
  Armor: '', ArmorDmgRed: '', ArmorEffect: '',
  Accessory: '', AccessoryEffect: '',
  Resistances: '',
  // Notas
  NotesDiary: '', NotesGoals: '',
  // Tabelas dinâmicas
  spells: [], equip: [], links: [], clues: [], contacts: [],
  // Listas de checagem
  feitos: [], conditions: [], modifiers: [],
  // Configuração de feitos com escolha do jogador
  feitoConfig: {},
  // Afinidades
  affinities: {},
  // Retrato
  portrait: { src: '' },
  // Background
  background: {},
  // Histórico de rolagens de dados (últimas 20)
  rollHistory: [],
  // Despertar Trama — desbloqueios narrativos por Arcana { arcanaKey: { narrative: [ids] } }
  personaAwakenings: {},
  // Habilidades Naturais — escolhas de configuração por Arcana { arcanaKey: { elementResistance } }
  naturalAbilityConfig: {},
  // Valores computados (preenchidos por recalcState)
  _computed: null
};

/**
 * Retorna uma cópia profunda do estado (exceto _computed).
 */
export function getState() {
  var copy = {};
  Object.keys(state).forEach(function(k) {
    if (k.charAt(0) === '_') return;
    var v = state[k];
    copy[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
  });
  return copy;
}
