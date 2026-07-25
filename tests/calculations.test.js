import { describe, it, expect } from 'vitest';
import { applyModifiers } from '../js/calculations.js';

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
});
