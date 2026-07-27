import { describe, it, expect } from 'vitest';
import { backgroundMap } from '../js/background.js';

describe('backgroundMap', () => {
  it('expõe as opções de fundo de 1 a 12', () => {
    expect(backgroundMap.cidade1).toBe('bg-city-1');
    expect(backgroundMap.cidade2).toBe('bg-city-2');
    expect(backgroundMap.cidade3).toBe('bg-city-3');
    expect(backgroundMap.cidade4).toBe('bg-city-4');
    expect(backgroundMap.cidade5).toBe('bg-city-5');
    expect(backgroundMap.cidade6).toBe('bg-city-6');
    expect(backgroundMap.cidade7).toBe('bg-city-7');
    expect(backgroundMap.cidade8).toBe('bg-city-8');
    expect(backgroundMap.cidade9).toBe('bg-city-9');
    expect(backgroundMap.cidade10).toBe('bg-city-10');
    expect(backgroundMap.cidade11).toBe('bg-city-11');
    expect(backgroundMap.cidade12).toBe('bg-city-12');
  });
});
