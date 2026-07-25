import { describe, it, expect } from 'vitest';
import { clampInt } from '../js/utils.js';

describe('clampInt', () => {
  it('mantém valor dentro do intervalo', () => {
    expect(clampInt(5, 1, 10)).toBe(5);
  });

  it('aplica limite inferior', () => {
    expect(clampInt(0, 1, 10)).toBe(1);
  });

  it('aplica limite superior', () => {
    expect(clampInt(20, 1, 10)).toBe(10);
  });

  it('usa o mínimo quando o valor não é numérico', () => {
    expect(clampInt('abc', 3, 9)).toBe(3);
  });

  it('converte strings numéricas', () => {
    expect(clampInt('7', 1, 10)).toBe(7);
  });
});
