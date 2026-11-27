import { describe, expect, it } from 'vitest';
import { executeMove } from '../../services/engine/moves';
import { calculateTypeEffectiveness } from '../../services/engine/mechanics/effectiveness';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig } from './coordinator.helpers';

// 4.1.1 — Tera Stellar preserva os tipos defensivos originais do Pokémon.
// O tipo Estelar só existe ofensivamente (Tera Blast / Tera Starstorm); trocar a
// defesa por ['stellar'] deixava todos os golpes neutros, pois não há tabela defensiva.

const CONFIG = createBattleConfig({
  forceAccuracyOutcome: 'hit',
  fixedRoll: 92.5,
  terastallizationEnabled: true,
});

const run = (defenderOverrides: Record<string, unknown> = {}) => {
  const move = createMove({
    name: 'thunder-shock',
    type: 'electric',
    power: 60,
    damageClass: 'special',
    accuracy: 100,
  });
  const attacker = createPokemon({
    id: 11,
    name: 'Atacante',
    types: ['normal'],
    attackStat: 120,
    spAttackStat: 120,
    speedStat: 120,
    moves: [move],
  });
  const defender = createPokemon({
    id: 22,
    name: 'Defensor',
    types: ['water'],
    hp: 400,
    maxHP: 400,
    defenseStat: 100,
    spDefenseStat: 100,
    speedStat: 80,
    ...defenderOverrides,
  });
  const state = createBattleState([attacker], [defender], {
    prngState: createBattlePRNGState(4111),
  });

  const result = executeMove(state, attacker, defender, move, CONFIG);
  return {
    hpAfter: result.newState.currentPokemon2!.hp,
    messages: result.logs.map(entry => entry.message),
  };
};

describe('4.1.1 Tera Stellar mantém os tipos defensivos e a eficácia', () => {
  it('mantém a eficácia de tipo quando o defensor é Terastal Estelar', () => {
    const baseline = run();
    const stellar = run({ isTerastallized: true, teraType: 'stellar' });

    expect(stellar.messages).toContain('É super efetivo!');
    expect(stellar.hpAfter).toBe(baseline.hpAfter);
  });

  it('continua substituindo a defesa por um tipo Tera real', () => {
    const baseline = run();
    const grassTera = run({ isTerastallized: true, teraType: 'grass' });

    // Elétrico é 2x contra Água e 0.5x contra Grama: a defesa Tera real permanece ativa.
    expect(grassTera.hpAfter).toBeGreaterThan(baseline.hpAfter);
  });

  it('mantém o comportamento ofensivo especial de Estelar', () => {
    const teraTarget = calculateTypeEffectiveness(
      'stellar',
      ['water'],
      'synchronize',
      'synchronize',
      'tera-blast',
      { isTerastallized: true },
    );
    const plainTarget = calculateTypeEffectiveness(
      'stellar',
      ['water'],
      'synchronize',
      'synchronize',
      'tera-blast',
      {},
    );

    expect(teraTarget.multiplier).toBe(2.0);
    expect(plainTarget.multiplier).toBe(1.0);
  });
});