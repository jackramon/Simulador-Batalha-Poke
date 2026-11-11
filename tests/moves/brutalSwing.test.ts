import { describe, it, expect } from 'vitest';
import { calculateDamage } from '../../services/engine/handlers/damageUtils';
import { createDummy, createBattleState } from '../factories';
import { Move } from '../../types';

describe('Balanço Brutal (Brutal Swing)', () => {
  it('deve causar dano genérico sem efeitos secundários', () => {
    const attacker = createDummy({ name: 'Atacante', attackStat: 100 });
    const defender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100, defenseStat: 100 });
    const state = createBattleState([attacker], [defender]);

    const move: Move = {
      name: 'brutal-swing',
      type: 'dark',
      category: 'physical',
      power: 60,
      accuracy: 100,
      pp: 20,
      priority: 0,
      target: 'allAdjacent'
    } as unknown as Move;

    const damage = calculateDamage(attacker, defender, move as unknown as Move, 'none', false, 1, 0, [], state);

    // O dano deve ser maior que 0
    expect(damage).toBeGreaterThan(0);
  });
});
