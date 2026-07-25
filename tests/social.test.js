import { describe, it, expect } from 'vitest';
import { calcSocialTier } from '../js/calculations.js';

describe('calcSocialTier', () => {
  it('retorna 0 abaixo de 5 pontos', () => {
    expect(calcSocialTier(0)).toBe(0);
    expect(calcSocialTier(4)).toBe(0);
  });

  it('sobe um tier a cada 5 pontos', () => {
    expect(calcSocialTier(5)).toBe(1);
    expect(calcSocialTier(10)).toBe(2);
    expect(calcSocialTier(24)).toBe(4);
  });

  it('atinge o tier 5 em 25 pontos', () => {
    expect(calcSocialTier(25)).toBe(5);
  });

  it('limita o tier máximo em 5', () => {
    expect(calcSocialTier(100)).toBe(5);
  });

  it('trata valores negativos e ausentes como 0', () => {
    expect(calcSocialTier(-3)).toBe(0);
    expect(calcSocialTier(undefined)).toBe(0);
    expect(calcSocialTier(null)).toBe(0);
  });
});
