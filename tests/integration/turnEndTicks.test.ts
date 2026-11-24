import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../types';
import { processTurnEnd } from '../../services/engine/turnEnd';
import { processTurnEnd as compatibleProcessTurnEnd } from '../../services/engine/handlers/turnEnd';
import { createBattleState, createSideHazards } from '../factories';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';
import type { CompletedTurn } from './coordinator.helpers';

const runEmptyTurn = (initialState: BattleState, seed = 2101): CompletedTurn =>
  runCoordinatorTurn({
    seed,
    initialState,
    config: createBattleConfig(),
  });

const expectSingleTurnEnd = (result: CompletedTurn, expectedTurn: number) => {
  expect(result.completed).toBe(true);
  expect(result.steps.map(step => step.phase)).toEqual(['start', 'turn-end']);
  expect(result.finalState.turn).toBe(expectedTurn);
};

describe('ticks de fim de turno pelo coordenador público', () => {
  it('reexporta a mesma implementação pelo caminho de compatibilidade', () => {
    expect(compatibleProcessTurnEnd).toBe(processTurnEnd);
  });

  it('mantém os efeitos já ativos com um único decremento por turno', () => {
    const initialState = createBattleState(undefined, undefined, {
      turn: 4,
      mudSportTurns: 2,
      trickRoomActive: true,
      trickRoomTurns: 2,
      p1Hazards: createSideHazards({ reflect: 2 }),
      p2Hazards: createSideHazards({ tailwind: 3 }),
    });

    const result = runEmptyTurn(initialState);

    expectSingleTurnEnd(result, 5);
    expect(result.finalState.mudSportTurns).toBe(1);
    expect(result.finalState.trickRoomActive).toBe(true);
    expect(result.finalState.trickRoomTurns).toBe(1);
    expect(result.finalState.p1Hazards.reflect).toBe(1);
    expect(result.finalState.p2Hazards.tailwind).toBe(2);
  });

  it.each([
    {
      label: 'Gravity',
      overrides: { gravity: true, gravityTurns: 2 } as Partial<BattleState>,
      readTurns: (state: BattleState) => state.gravityTurns,
      readActive: (state: BattleState) => state.gravity,
    },
    {
      label: 'Water Sport',
      overrides: { waterSportTurns: 2 } as Partial<BattleState>,
      readTurns: (state: BattleState) => state.waterSportTurns,
    },
    {
      label: 'Wonder Room',
      overrides: { wonderRoomActive: true, wonderRoomTurns: 2 } as Partial<BattleState>,
      readTurns: (state: BattleState) => state.wonderRoomTurns,
      readActive: (state: BattleState) => state.wonderRoomActive,
    },
    {
      label: 'Magic Room',
      overrides: { magicRoomActive: true, magicRoomTurns: 2 } as Partial<BattleState>,
      readTurns: (state: BattleState) => state.magicRoomTurns,
      readActive: (state: BattleState) => state.magicRoomActive,
    },
  ])('decrementa e expira $label uma única vez por turno', ({ overrides, readTurns, readActive }) => {
    const initialState = createBattleState(undefined, undefined, { turn: 6, ...overrides });

    const first = runEmptyTurn(initialState);

    expectSingleTurnEnd(first, 7);
    expect(readTurns(first.finalState)).toBe(1);
    if (readActive) expect(readActive(first.finalState)).toBe(true);

    const second = runEmptyTurn(first.finalState, 2102);

    expectSingleTurnEnd(second, 8);
    expect(readTurns(second.finalState)).toBe(0);
    if (readActive) expect(readActive(second.finalState)).toBe(false);
  });

  it.each([
    { key: 'embargo' },
    { key: 'laser-focus' },
  ])('decrementa e remove $key uma única vez por turno', ({ key }) => {
    const initialState = createBattleState();
    initialState.currentPokemon1!.statusEffects[key] = { turns: 2 };

    const first = runEmptyTurn(initialState);

    expectSingleTurnEnd(first, 2);
    expect(first.finalState.currentPokemon1?.statusEffects[key]).toEqual({ turns: 1 });

    const second = runEmptyTurn(first.finalState, 2102);

    expectSingleTurnEnd(second, 3);
    expect(second.finalState.currentPokemon1?.statusEffects[key]).toBeUndefined();
  });

  it.each([
    { initialTurns: 2, expectedTurns: 2 },
    { initialTurns: 1, expectedTurns: undefined },
  ])('processa o tick final de Uproar a partir de $initialTurns turno restante', ({ initialTurns, expectedTurns }) => {
    const initialState = createBattleState();
    initialState.currentPokemon1!.statusEffects.uproar = { turns: initialTurns };

    const result = runEmptyTurn(initialState);

    expectSingleTurnEnd(result, 2);
    expect(result.finalState.currentPokemon1?.statusEffects.uproar?.turns).toBe(expectedTurns);
  });

  it('cura Ingrain uma única vez ao final de cada turno', () => {
    const initialState = createBattleState();
    initialState.currentPokemon1!.hp = 50;
    initialState.currentPokemon1!.statusEffects.ingrain = { turns: 0 };

    const first = runEmptyTurn(initialState);

    expectSingleTurnEnd(first, 2);
    expect(first.finalState.currentPokemon1?.hp).toBe(56);

    const second = runEmptyTurn(first.finalState, 2102);

    expectSingleTurnEnd(second, 3);
    expect(second.finalState.currentPokemon1?.hp).toBe(62);
  });

  it('aplica o dano de Curse uma única vez ao final de cada turno', () => {
    const initialState = createBattleState();
    initialState.currentPokemon1!.statusEffects.curse = { turns: 0 };

    const first = runEmptyTurn(initialState);

    expectSingleTurnEnd(first, 2);
    expect(first.finalState.currentPokemon1?.hp).toBe(75);

    const second = runEmptyTurn(first.finalState, 2102);

    expectSingleTurnEnd(second, 3);
    expect(second.finalState.currentPokemon1?.hp).toBe(50);
  });

  it('cura Wish somente no final do turno seguinte', () => {
    const initialState = createBattleState();
    initialState.currentPokemon1!.hp = 20;
    initialState.currentPokemon1!.statusEffects.wish = { turns: 2, hp: 50 };

    const first = runEmptyTurn(initialState);

    expectSingleTurnEnd(first, 2);
    expect(first.finalState.currentPokemon1?.hp).toBe(20);
    expect(first.finalState.currentPokemon1?.statusEffects.wish).toEqual({ turns: 1, hp: 50 });

    const second = runEmptyTurn(first.finalState, 2102);

    expectSingleTurnEnd(second, 3);
    expect(second.finalState.currentPokemon1?.hp).toBe(70);
    expect(second.finalState.currentPokemon1?.statusEffects.wish).toBeUndefined();

    const third = runEmptyTurn(second.finalState, 2103);

    expectSingleTurnEnd(third, 4);
    expect(third.finalState.currentPokemon1?.hp).toBe(70);
  });

  it('aplica o sono de Yawn somente no final do turno seguinte', () => {
    const initialState = createBattleState();
    initialState.currentPokemon1!.statusEffects.yawn = { turns: 2 };

    const first = runEmptyTurn(initialState);

    expectSingleTurnEnd(first, 2);
    expect(first.finalState.currentPokemon1?.statusEffects.yawn).toEqual({ turns: 1 });
    expect(first.finalState.currentPokemon1?.statusEffects.sleep).toBeUndefined();

    const second = runEmptyTurn(first.finalState, 2102);

    expectSingleTurnEnd(second, 3);
    expect(second.finalState.currentPokemon1?.statusEffects.yawn).toBeUndefined();
    expect(second.finalState.currentPokemon1?.statusEffects.sleep).toEqual({ turns: 0 });
  });
});
