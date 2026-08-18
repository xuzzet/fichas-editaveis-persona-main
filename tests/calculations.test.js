import { describe, it, expect } from 'vitest';
import {
  applyModifiers, computeNaturalAbilityModifiers, getEffectiveSocial, recalcState,
  computeEquipModifiers, buildBreakdown
} from '../js/calculations.js';
import { SOCIAL_IDS, MOD_TARGETS } from '../js/constants.js';
import { state } from '../js/state.js';

// Testes das regras de modificadores (função pura, sem DOM).
// Protege as mecânicas contra regressões.
describe('applyModifiers', () => {
  const base = { STR: 10, MAG: 10, TEC: 10, AGI: 10, VIT: 10, LCK: 10, HP: 100, PM: 50 };

  it('aplica modificador flat ativo', () => {
    const r = applyModifiers(base, [{ ativo: true, valor: 5, tipo: 'flat', alvo: 'STR' }]);
    expect(r.STR).toBe(15);
  });

  it('ignora modificadores inativos', () => {
    const r = applyModifiers(base, [{ ativo: false, valor: 5, tipo: 'flat', alvo: 'STR' }]);
    expect(r.STR).toBe(10);
  });

  it('ignora modificadores com valor 0', () => {
    const r = applyModifiers(base, [{ ativo: true, valor: 0, tipo: 'flat', alvo: 'STR' }]);
    expect(r.STR).toBe(10);
  });

  it('aplica flat antes de percentual', () => {
    const r = applyModifiers(base, [
      { ativo: true, valor: 10, tipo: 'flat', alvo: 'STR' },
      { ativo: true, valor: 50, tipo: 'percentual', alvo: 'STR' }
    ]);
    // (10 + 10) * 1.5 = 30
    expect(r.STR).toBe(30);
  });

  it('faz clamp no mínimo 0 (não permite atributo negativo)', () => {
    const r = applyModifiers(base, [{ ativo: true, valor: -50, tipo: 'flat', alvo: 'STR' }]);
    expect(r.STR).toBe(0);
  });

  it('não altera alvos não referenciados', () => {
    const r = applyModifiers(base, [{ ativo: true, valor: 5, tipo: 'flat', alvo: 'STR' }]);
    expect(r.MAG).toBe(10);
    expect(r.HP).toBe(100);
  });

  it('aplica sobre alvos sociais quando informado o conjunto de alvos', () => {
    const socialBase = { DISPts: 3, CHAPts: 0 };
    const r = applyModifiers(
      socialBase,
      [{ ativo: true, valor: 4, tipo: 'flat', alvo: 'DISPts' }],
      SOCIAL_IDS
    );
    expect(r.DISPts).toBe(7);
    expect(r.CHAPts).toBe(0);
  });
});

// Bônus automáticos concedidos pela Arcana (Habilidades Naturais).
describe('computeNaturalAbilityModifiers', () => {
  it('não gera modificador quando não há Arcana selecionada', () => {
    state.PerArcana = '';
    expect(computeNaturalAbilityModifiers()).toEqual([]);
  });

  it('gera bônus social (+5 Disciplina) e +1 MAG para O Julgamento', () => {
    state.PerArcana = 'XX - Julgamento';
    const mods = computeNaturalAbilityModifiers();
    expect(mods).toContainEqual(
      expect.objectContaining({ tipo: 'flat', valor: 5, alvo: 'DISPts', ativo: true })
    );
    expect(mods).toContainEqual(
      expect.objectContaining({ tipo: 'flat', valor: 1, alvo: 'MAG', ativo: true })
    );
  });

  it('gera +15% HP e +4 Coragem (social) para A Força', () => {
    state.PerArcana = 'VIII - Força';
    const mods = computeNaturalAbilityModifiers();
    expect(mods).toContainEqual(
      expect.objectContaining({ tipo: 'percentual', valor: 15, alvo: 'HP' })
    );
    expect(mods).toContainEqual(
      expect.objectContaining({ tipo: 'flat', valor: 4, alvo: 'COUPts' })
    );
  });

  it('gera modificador percentual de HP (+25%) para O Enforcado', () => {
    state.PerArcana = 'XII - Enforcado';
    const mods = computeNaturalAbilityModifiers();
    expect(mods).toHaveLength(1);
    expect(mods[0]).toMatchObject({ tipo: 'percentual', valor: 25, alvo: 'HP' });
  });
});

// Pontos sociais efetivos (base comprada + bônus da Arcana) via recalcState.
describe('pontos sociais efetivos', () => {
  it('A Justiça soma +4 Disciplina aos pontos comprados', () => {
    state.PerArcana = 'XI - Justiça';
    state.DISPts = 2;
    state.modifiers = [];
    recalcState();
    expect(getEffectiveSocial('DISPts')).toBe(6); // 2 comprados + 4 da Arcana
  });

  it('modificador global social soma ao efetivo', () => {
    state.PerArcana = '';
    state.CHAPts = 1;
    state.modifiers = [{ nome: 'Teste', tipo: 'flat', valor: 3, alvo: 'CHAPts', ativo: true }];
    recalcState();
    expect(getEffectiveSocial('CHAPts')).toBe(4);
    state.modifiers = [];
  });

  it('O Hierofante concede PM bônus = Conhecimento + Charme efetivos', () => {
    state.PerArcana = 'V - Hierofante';
    state.KNOPts = 2;
    state.CHAPts = 1;
    state.modifiers = [];
    recalcState();
    const pmSemArcana = state.EnergyMax;
    // Hierofante concede +3 Conhecimento e +3 Charme (inicial) via mechanic,
    // então efetivo: Conhecimento 2+3=5, Charme 1+3=4 → PM bônus = 9.
    expect(getEffectiveSocial('KNOPts')).toBe(5);
    expect(getEffectiveSocial('CHAPts')).toBe(4);
    const pmMod = (state._computed.naturalMods || []).find(
      (m) => m.alvo === 'PM' && /PM b[oô]nus/i.test(m.nome)
    );
    expect(pmMod).toBeTruthy();
    expect(pmMod.valor).toBe(9);
    state.PerArcana = '';
    state.KNOPts = 0;
    state.CHAPts = 0;
    recalcState();
    // Sem Hierofante o PM não recebe o bônus dinâmico.
    expect(pmSemArcana).toBeGreaterThan(state.EnergyMax);
  });
});

// Bônus de itens equipados podem mirar habilidades sociais.
describe('computeEquipModifiers com alvo social', () => {
  it('aceita alvo de combate e de habilidade social', () => {
    state.equip = [
      { nome: 'Espada', bonusAtivo: true, bonusAlvo: 'STR', bonusTipo: 'flat', bonusValor: 2 },
      { nome: 'Amuleto', bonusAtivo: true, bonusAlvo: 'CHAPts', bonusTipo: 'flat', bonusValor: 3 }
    ];
    const mods = computeEquipModifiers();
    expect(mods).toContainEqual(
      expect.objectContaining({ tipo: 'flat', valor: 2, alvo: 'STR', ativo: true })
    );
    expect(mods).toContainEqual(
      expect.objectContaining({ tipo: 'flat', valor: 3, alvo: 'CHAPts', ativo: true })
    );
    state.equip = [];
  });

  it('item com bônus social soma aos pontos sociais efetivos', () => {
    state.PerArcana = '';
    state.CHAPts = 2;
    state.modifiers = [];
    state.equip = [
      { nome: 'Amuleto do Carisma', bonusAtivo: true, bonusAlvo: 'CHAPts', bonusTipo: 'flat', bonusValor: 4 }
    ];
    recalcState();
    expect(getEffectiveSocial('CHAPts')).toBe(6); // 2 comprados + 4 do item
    state.equip = [];
    state.CHAPts = 0;
  });
});

// Helper para resetar o state a um estado neutro entre cenários combinados.
function resetState() {
  state.CharLvl = 1;
  state.CharSTR = 6; state.CharMAG = 6; state.CharTEC = 6;
  state.CharAGI = 6; state.CharVIT = 6; state.CharLCK = 6;
  state.PerArcana = '';
  state.equip = [];
  state.feitos = [];
  state.feitoConfig = {};
  state.conditions = [];
  state.modifiers = [];
  SOCIAL_IDS.forEach(function(id) { state[id] = 0; });
}

// Interações combinadas de múltiplas fontes de modificadores (Etapa 6).
describe('interações combinadas de modificadores', () => {
  it('dois equipamentos no mesmo alvo somam (empilhamento aditivo)', () => {
    resetState();
    state.equip = [
      { nome: 'Luvas', bonusAtivo: true, bonusAlvo: 'STR', bonusTipo: 'flat', bonusValor: 2 },
      { nome: 'Anel', bonusAtivo: true, bonusAlvo: 'STR', bonusTipo: 'flat', bonusValor: 3 }
    ];
    recalcState();
    expect(state._computed.modded.STR).toBe(6 + 2 + 3);
  });

  it('Arcana + feito + equipamento no mesmo atributo somam corretamente', () => {
    resetState();
    state.PerArcana = 'XI - Justiça'; // +4 Disciplina (social), sem STR
    state.equip = [{ nome: 'Espada', bonusAtivo: true, bonusAlvo: 'STR', bonusTipo: 'flat', bonusValor: 2 }];
    state.feitos = [{ id: 'longe_do_fim', ativo: true }]; // +5 PM/nível
    recalcState();
    expect(state._computed.modded.STR).toBe(6 + 2);
    // PM base (nível 1, MAG 6): 15 + (11*2) + 0 = 37; +5 de Longe do Fim
    expect(state._computed.modded.PM).toBe(37 + 5);
  });

  it('buff e debuff no mesmo alvo se anulam parcialmente', () => {
    resetState();
    state.modifiers = [
      { nome: 'Buff', tipo: 'flat', valor: 4, alvo: 'AGI', ativo: true },
      { nome: 'Debuff', tipo: 'flat', valor: -6, alvo: 'AGI', ativo: true }
    ];
    recalcState();
    expect(state._computed.modded.AGI).toBe(6 + 4 - 6);
  });

  it('percentual é aplicado após todos os flats (multiplicador por último)', () => {
    resetState();
    state.modifiers = [
      { nome: 'Flat', tipo: 'flat', valor: 4, alvo: 'STR', ativo: true },
      { nome: 'Mult', tipo: 'percentual', valor: 50, alvo: 'STR', ativo: true }
    ];
    recalcState();
    // (6 + 4) * 1.5 = 15
    expect(state._computed.modded.STR).toBe(15);
  });
});

// Detalhamento (origem de cada número) deve sempre bater com o valor final.
describe('buildBreakdown', () => {
  it('final do detalhamento coincide com applyModifiers', () => {
    const base = { STR: 10, HP: 100 };
    const mods = [
      { nome: 'A', tipo: 'flat', valor: 5, alvo: 'STR', ativo: true, source: 'equip' },
      { nome: 'B', tipo: 'percentual', valor: 20, alvo: 'STR', ativo: true, source: 'arcana' },
      { nome: 'C', tipo: 'percentual', valor: 25, alvo: 'HP', ativo: true, source: 'arcana' }
    ];
    const bd = buildBreakdown(base, mods, ['STR', 'HP']);
    const modded = applyModifiers(base, mods, ['STR', 'HP']);
    expect(bd.STR.final).toBe(modded.STR);
    expect(bd.HP.final).toBe(modded.HP);
    expect(bd.STR.base).toBe(10);
    expect(bd.STR.entries).toHaveLength(2);
  });

  it('recalcState popula breakdown com a origem correta', () => {
    resetState();
    state.equip = [{ nome: 'Bracelete', bonusAtivo: true, bonusAlvo: 'VIT', bonusTipo: 'flat', bonusValor: 2 }];
    recalcState();
    const vit = state._computed.breakdown.VIT;
    expect(vit.base).toBe(6);
    expect(vit.final).toBe(8);
    expect(vit.entries[0].source).toBe('equip');
    MOD_TARGETS.forEach((t) => {
      expect(state._computed.breakdown[t].final).toBe(state._computed.modded[t]);
    });
    state.equip = [];
  });
});
