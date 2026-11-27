import { describe, expect, it } from 'vitest';
import { calculateDamage } from '../../services/engine/handlers/damageUtils';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon, createStatStages } from '../factories';

// 4.1.1 — Acertos críticos ignoram SOMENTE as mudanças de estágio que reduziriam o dano:
// reduções ofensivas do atacante e aumentos defensivos do defensor. Aumentos ofensivos
// e reduções defensivas continuam valendo.

const buildCombatants = (attackStage: number, defenseStage: number) => {
  const move = createMove({
    name: 'golpe-fixo',
    type: 'normal',
    power: 80,
    damageClass: 'physical',
    accuracy: 100,
  });
  const attacker = createPokemon({
    id: 1,
    name: 'Atacante',
    types: ['normal'],
    attackStat: 120,
    speedStat: 100,
    statStages: createStatStages({ attack: attackStage }),
    moves: [move],
  });
  const defender = createPokemon({
    id: 2,
    name: 'Defensor',
    types: ['normal'],
    hp: 500,
    maxHP: 500,
    defenseStat: 100,
    speedStat: 80,
    statStages: createStatStages({ defense: defenseStage }),
  });
  const state = createBattleState([attacker], [defender], {
    prngState: createBattlePRNGState(4113),
  });

  return { move, attacker, defender, state };
};

const hit = (attackStage: number, defenseStage: number, isCrit: boolean) => {
  const { move, attacker, defender, state } = buildCombatants(attackStage, defenseStage);
  return calculateDamage(
    attacker,
    defender,
    move,
    state.weather,
    isCrit,
    1,
    0,
    [],
    state,
    92.5,
  );
};

describe('4.1.1 críticos ignoram apenas os estágios que a regra oficial exige', () => {
  it('ignora a redução ofensiva do atacante', () => {
    expect(hit(-2, 0, true)).toBe(hit(0, 0, true));
  });

  it('preserva o aumento ofensivo do atacante', () => {
    expect(hit(2, 0, true)).toBeGreaterThan(hit(0, 0, true));
  });

  it('ignora o aumento defensivo do defensor', () => {
    expect(hit(0, 2, true)).toBe(hit(0, 0, true));
  });

  it('preserva a redução defensiva do defensor', () => {
    expect(hit(0, -2, true)).toBeGreaterThan(hit(0, 0, true));
  });

  it('fora do crítico os estágios continuam valendo normalmente', () => {
    expect(hit(-2, 0, false)).toBeLessThan(hit(0, 0, false));
    expect(hit(0, 2, false)).toBeLessThan(hit(0, 0, false));
  });
});