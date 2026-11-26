import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Action, BattleState } from '../../types';
import type { TurnStepResult } from '../../services/engine/coordinator';
import { BattleCoordinator } from '../../services/engine/coordinator';
import { executeMove } from '../../services/engine/moves';
import { decideAIAction } from '../../services/aiLogic';
import { BattlePRNG, createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig } from './coordinator.helpers';

interface BattleRun {
  steps: TurnStepResult[];
  finalState: BattleState;
}

const createSeededBattle = (seed: number, prefix = 'P'): BattleState => {
  const p1Move = createMove({ name: `${prefix.toLowerCase()}1-move`, displayName: `${prefix}1 Move` });
  const p2Move = createMove({ name: `${prefix.toLowerCase()}2-move`, displayName: `${prefix}2 Move` });
  const p1 = createPokemon({ id: 10, name: `${prefix}1`, hp: 1000, maxHP: 1000, moves: [p1Move] });
  const p2 = createPokemon({ id: 20, name: `${prefix}2`, hp: 1000, maxHP: 1000, moves: [p2Move] });
  return createBattleState([p1], [p2], { prngState: createBattlePRNGState(seed) });
};

const createActions = (state: BattleState): [Action, Action] => {
  const p1 = state.currentPokemon1!;
  const p2 = state.currentPokemon2!;
  return [
    { type: 'move', data: p1.moves[0], user: p1, playerNum: 1 },
    { type: 'move', data: p2.moves[0], user: p2, playerNum: 2 },
  ];
};

const runTurn = (state: BattleState): BattleRun => {
  const [p1Action, p2Action] = createActions(state);
  const generator = BattleCoordinator.runTurn(state, p1Action, p2Action, createBattleConfig());
  const steps: TurnStepResult[] = [];
  let next = generator.next();
  while (next.done !== true) {
    steps.push(next.value);
    next = generator.next();
  }
  const finalState = steps.at(-1)?.state;
  if (!finalState) throw new Error('Turno sem estado final');
  return { steps, finalState };
};

const runInterleaved = (left: BattleState, right: BattleState): [BattleRun, BattleRun] => {
  const [leftP1, leftP2] = createActions(left);
  const [rightP1, rightP2] = createActions(right);
  const leftGenerator = BattleCoordinator.runTurn(left, leftP1, leftP2, createBattleConfig());
  const rightGenerator = BattleCoordinator.runTurn(right, rightP1, rightP2, createBattleConfig());
  const runs: [BattleRun, BattleRun] = [
    { steps: [], finalState: left },
    { steps: [], finalState: right },
  ];
  let leftNext = leftGenerator.next();
  let rightNext = rightGenerator.next();

  while (leftNext.done !== true || rightNext.done !== true) {
    if (leftNext.done !== true) {
      runs[0].steps.push(leftNext.value);
      runs[0].finalState = leftNext.value.state;
      leftNext = leftGenerator.next();
    }
    if (rightNext.done !== true) {
      runs[1].steps.push(rightNext.value);
      runs[1].finalState = rightNext.value.state;
      rightNext = rightGenerator.next();
    }
  }
  return runs;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isolamento do PRNG por batalha', () => {
  it('Math.random nativo alterado não influencia o resultado da batalha', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random nativo não pode ser chamado pela batalha');
    });
    const state = createSeededBattle(2606);
    const attacker = state.currentPokemon1!;
    const defender = state.currentPokemon2!;

    const result = executeMove(
      state,
      attacker,
      defender,
      attacker.moves[0],
      createBattleConfig(),
    );

    expect(result.newState.currentPokemon2?.hp).toBe(971);
    expect(result.newState.prngState?.cursor).toBe(4);
  });

  it('duas batalhas intercaladas reproduzem suas execuções isoladas', () => {
    let nativeCursor = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (nativeCursor++ % 100) / 100);

    nativeCursor = 0;
    const isolatedLeft = runTurn(createSeededBattle(2606, 'A'));
    nativeCursor = 0;
    const isolatedRight = runTurn(createSeededBattle(7, 'B'));

    nativeCursor = 0;
    const [interleavedLeft, interleavedRight] = runInterleaved(
      createSeededBattle(2606, 'A'),
      createSeededBattle(7, 'B'),
    );

    expect(interleavedLeft.steps).toEqual(isolatedLeft.steps);
    expect(interleavedRight.steps).toEqual(isolatedRight.steps);
    expect(interleavedLeft.finalState).toEqual(isolatedLeft.finalState);
    expect(interleavedRight.finalState).toEqual(isolatedRight.finalState);
    expect(interleavedLeft.finalState.prngState!.cursor).toBeGreaterThan(0);
    expect(interleavedRight.finalState.prngState!.cursor).toBeGreaterThan(0);
  });

  it('decideAIAction usa forks e não move o cursor real', () => {
    const state = createSeededBattle(2606);
    state.currentPokemon1!.moves.push(createMove({ name: 'p1-second', displayName: 'P1 Second', power: 50 }));
    state.currentPokemon2!.moves.push(createMove({ name: 'p2-second', displayName: 'P2 Second', power: 50 }));
    state.currentPokemon2!.teraType = 'normal';
    const realPRNG = BattlePRNG.fromBattleState(state);
    const before = realPRNG.snapshot();
    const nativeRandom = vi.spyOn(Math, 'random').mockImplementation(() => 0.123);

    const decide = () => decideAIAction(
      state.currentPokemon2!,
      state.currentPokemon1!,
      state.team2,
      state.team1,
      'none',
      true,
      undefined,
      true,
      false,
      state,
      false,
      false,
    );

    const first = decide();
    expect(nativeRandom).not.toHaveBeenCalled();
    expect(realPRNG.snapshot()).toEqual(before);
    const second = decide();
    expect(second).toEqual(first);
    expect(state.prngState).toEqual(before);
  });

  it('replay com mesma seed e ações mantém snapshots e estado final idênticos', () => {
    let nativeCursor = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (nativeCursor++ % 100) / 100);

    nativeCursor = 0;
    const first = runTurn(createSeededBattle(2606));
    nativeCursor = 5000;
    const replayed = runTurn(createSeededBattle(2606));

    expect(replayed.steps).toEqual(first.steps);
    expect(replayed.finalState).toEqual(first.finalState);
    expect(replayed.finalState.prngState).toEqual(first.finalState.prngState);
  });

  it('persistir e restaurar no meio da batalha preserva o sufixo ininterrupto', () => {
    let nativeCursor = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (nativeCursor++ % 100) / 100);

    nativeCursor = 0;
    const uninterruptedFirst = runTurn(createSeededBattle(2606));
    const uninterruptedSecond = runTurn(uninterruptedFirst.finalState);

    nativeCursor = 0;
    const persistedFirst = runTurn(createSeededBattle(2606));
    const restoredState = JSON.parse(JSON.stringify(persistedFirst.finalState)) as BattleState;
    const restoredSecond = runTurn(restoredState);

    expect(restoredSecond.steps).toEqual(uninterruptedSecond.steps);
    expect(restoredSecond.finalState).toEqual(uninterruptedSecond.finalState);
    expect(restoredSecond.finalState.prngState!.cursor).toBeGreaterThan(
      persistedFirst.finalState.prngState!.cursor,
    );
  });
});
