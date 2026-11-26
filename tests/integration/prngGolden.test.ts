import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../types';
import { BattleCoordinator } from '../../services/engine/coordinator';
import { handleForceSwitch } from '../../services/engine/handlers/moves/dragonTail';
import { executeMove } from '../../services/engine/moves';
import { processTurnEnd } from '../../services/engine/turnEnd';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig } from './coordinator.helpers';

interface SeededResult<T> {
  value: T;
  finalState: BattleState;
}

const runSeeded = <T>(_seed: number, run: () => SeededResult<T>) => {
  const { value, finalState } = run();
  return { value, finalState, draws: finalState.prngState?.cursor || 0 };
};

const moveScenario = (seed: number, overrides = {}) => {
  const move = createMove({ name: 'golden-move', displayName: 'Golden Move', accuracy: 100, ...overrides });
  const attacker = createPokemon({ id: 10, name: 'Attacker', hp: 1000, maxHP: 1000, moves: [move] });
  const defender = createPokemon({ id: 20, name: 'Defender', hp: 1000, maxHP: 1000 });
  const state = createBattleState([attacker], [defender], { prngState: createBattlePRNGState(seed) });

  return runSeeded(seed, () => {
    const result = executeMove(state, attacker, defender, move, createBattleConfig());
    const finalAttacker = result.newState.currentPokemon1!;
    const finalDefender = result.newState.currentPokemon2!;
    return {
      finalState: result.newState,
      value: {
        defenderHp: finalDefender.hp,
        defenderStatuses: Object.keys(finalDefender.statusEffects),
        attackerStatuses: Object.keys(finalAttacker.statusEffects),
        missed: result.logs.some(entry => entry.message === 'O ataque falhou!'),
        critical: result.logs.some(entry => entry.message === 'Um acerto crítico!'),
      },
    };
  });
};

describe('ouros do PRNG anterior à migração 2.6', () => {
  it('preserva precisão e o draw de um erro', () => {
    const run = moveScenario(1, { accuracy: 50 });
    expect(run.value).toMatchObject({ defenderHp: 1000, missed: true, critical: false });
    expect(run.draws).toBe(1);
  });

  it('preserva crítico, dano e ordem dos draws', () => {
    const run = moveScenario(1);
    expect(run.value).toMatchObject({ defenderHp: 959, missed: false, critical: true });
    expect(run.draws).toBe(4);
  });

  it.each([
    { seed: 2606, defenderHp: 971, label: 'máximo' },
    { seed: 37, defenderHp: 976, label: 'mínimo' },
  ])('preserva o rolamento $label de dano', ({ seed, defenderHp }) => {
    const run = moveScenario(seed);
    expect(run.value).toMatchObject({ defenderHp, missed: false, critical: false });
    expect(run.draws).toBe(4);
  });

  it('preserva o status secundário e seus efeitos nos dois lados', () => {
    const run = moveScenario(2606, { effect: { chance: 100, status: 'burn' } });
    expect(run.value.defenderHp).toBe(971);
    expect(run.value.defenderStatuses).toContain('burn');
    expect(run.value.attackerStatuses).toContain('burn');
    expect(run.draws).toBe(4);
  });

  it('preserva clima espontâneo e seleção do novo clima', () => {
    const state = createBattleState(undefined, undefined, { prngState: createBattlePRNGState(7) });
    const run = runSeeded(7, () => {
      const result = processTurnEnd(state, createBattleConfig({ weatherEnabled: true }));
      return {
        finalState: result.newState,
        value: { weather: result.newState.weather, weatherTurns: result.newState.weatherTurns },
      };
    });

    expect(run.value).toEqual({ weather: 'sun', weatherTurns: 5 });
    expect(run.draws).toBe(2);
  });

  it('preserva o desempate de velocidade e os dez draws do turno', () => {
    const p1Move = createMove({ name: 'p1-move', displayName: 'P1 Move' });
    const p2Move = createMove({ name: 'p2-move', displayName: 'P2 Move' });
    const p1 = createPokemon({ id: 10, name: 'P1', hp: 1000, maxHP: 1000, moves: [p1Move] });
    const p2 = createPokemon({ id: 20, name: 'P2', hp: 1000, maxHP: 1000, moves: [p2Move] });
    const state = createBattleState([p1], [p2], { prngState: createBattlePRNGState(2606) });

    const run = runSeeded(2606, () => {
      const generator = BattleCoordinator.runTurn(
        state,
        { type: 'move', data: p1Move, user: p1, playerNum: 1 },
        { type: 'move', data: p2Move, user: p2, playerNum: 2 },
        createBattleConfig(),
      );
      const phases: string[] = [];
      const actors: Array<number | undefined> = [];
      let finalState = state;
      let next = generator.next();
      while (next.done !== true) {
        const step = next.value;
        phases.push(step.phase);
        finalState = step.state;
        if (step.phase === 'after-action') actors.push(step.activeActorId);
        next = generator.next();
      }
      return { finalState, value: { phases, actors } };
    });

    expect(run.value).toEqual({
      phases: ['start', 'before-action', 'after-action', 'before-action', 'after-action', 'turn-end'],
      actors: [20, 10],
    });
    expect(run.draws).toBe(10);
  });

  it('preserva a troca aleatória para a mesma reserva', () => {
    const attacker = createPokemon({ id: 10, name: 'Attacker' });
    const defender = createPokemon({ id: 20, name: 'Defender' });
    const reserve1 = createPokemon({ id: 21, name: 'Reserve 1' });
    const reserve2 = createPokemon({ id: 22, name: 'Reserve 2' });
    const state = createBattleState([attacker], [defender, reserve1, reserve2], {
      prngState: createBattlePRNGState(2),
    });

    const run = runSeeded(2, () => {
      handleForceSwitch(attacker, defender, [], 'dragon-tail', state);
      return { finalState: state, value: state.currentPokemon2?.name };
    });

    expect(run.value).toBe('Reserve 2');
    expect(run.draws).toBe(1);
  });
});
