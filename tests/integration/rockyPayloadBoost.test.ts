import { describe, expect, it } from 'vitest';
import * as RockyPayload from '../../services/engine/handlers/abilities/rocky_payload';
import { getAbilityDamageMultiplier } from '../../services/engine/handlers/abilities/damageModifiers';
import { executeMove } from '../../services/engine/moves';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig } from './coordinator.helpers';

// 4.1.1 — Carga Rochosa (Rocky Payload): multiplicador oficial exato de 1.5x.
// O handler modular e uma segunda multiplicação inline acumulavam 2.25x.

const rockMove = createMove({
  name: 'rock-slide',
  type: 'rock',
  power: 75,
  damageClass: 'physical',
  accuracy: 100,
});

const damageDealt = (ability: string) => {
  const move = createMove({
    name: 'rock-slide',
    type: 'rock',
    power: 75,
    damageClass: 'physical',
    accuracy: 100,
  });
  const attacker = createPokemon({
    id: 1,
    name: 'Bombirdier',
    types: ['rock'],
    ability,
    attackStat: 120,
    speedStat: 120,
    moves: [move],
  });
  const defender = createPokemon({
    id: 2,
    name: 'Alvo',
    types: ['normal'],
    hp: 500,
    maxHP: 500,
    defenseStat: 100,
    speedStat: 50,
  });
  const state = createBattleState([attacker], [defender], {
    prngState: createBattlePRNGState(4112),
  });

  const result = executeMove(
    state,
    attacker,
    defender,
    move,
    createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 92.5 }),
  );
  return 500 - result.newState.currentPokemon2!.hp;
};

describe('4.1.1 Rocky Payload multiplica golpes Rock por exatamente 1.5', () => {
  it('o handler e o modificador de dano devolvem 1.5, nunca 2.25', () => {
    const attacker = createPokemon({ ability: 'rocky-payload' });
    const defender = createPokemon();

    expect(RockyPayload.getPowerMultiplier(attacker, rockMove)).toBe(1.5);

    const multiplier = getAbilityDamageMultiplier(
      attacker,
      defender,
      rockMove,
      0,
      [],
      'none',
      false,
      undefined,
      1,
    );
    expect(multiplier).toBe(1.5);
  });

  it('o dano com a habilidade é 1.5x o dano sem a habilidade', () => {
    const boosted = damageDealt('rocky-payload');
    const control = damageDealt('synchronize');
    const ratio = boosted / control;

    expect(boosted).toBeGreaterThan(control);
    expect(ratio).toBeGreaterThan(1.45);
    expect(ratio).toBeLessThan(1.55);
  });
});