import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBagItem,
  createBattleState,
  createMove,
  createPlayerInventory,
  createPokemon,
} from '../factories';
import {
  createBattleConfig,
  createItemAction,
  createMoveAction,
  createSwitchAction,
  runCoordinatorTurn,
} from './coordinator.helpers';
import type { CompletedTurn } from './coordinator.helpers';

const MOVE_PHASES = [
  'start',
  'before-action',
  'after-action',
  'before-action',
  'after-action',
  'turn-end',
];

describe('integração do coordenador de turnos', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede proibida nos testes de integração do coordenador');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const expectOngoingTurn = (result: CompletedTurn, expectedTurn: number) => {
    expect(result.completed).toBe(true);
    expect(result.steps[result.steps.length - 1]?.phase).toBe('turn-end');
    expect(result.steps.some(step => step.phase === 'game-over')).toBe(false);
    expect(result.finalState.turn).toBe(expectedTurn);
    expect(result.finalState.isBattleInProgress).toBe(true);
    expect(result.finalState.winner).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  };

  it('executa um turno completo com golpes dos dois lados', () => {
    const attacker1 = createPokemon({
      id: 101,
      name: 'Atacante Um',
      hp: 400,
      maxHP: 400,
      speedStat: 140,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const attacker2 = createPokemon({
      id: 202,
      name: 'Atacante Dois',
      hp: 400,
      maxHP: 400,
      speedStat: 90,
      moves: [createMove({ uses: 8, maxUses: 8 })],
    });
    const move1 = attacker1.moves[0];
    const move2 = attacker2.moves[0];
    const initialState = createBattleState([attacker1], [attacker2], { turn: 7 });

    const result = runCoordinatorTurn({
      seed: 1201,
      initialState,
      p1Action: createMoveAction(attacker1, move1, 1),
      p2Action: createMoveAction(attacker2, move2, 2),
      config: createBattleConfig(),
    });

    expect(result.steps.map(step => step.phase)).toEqual(MOVE_PHASES);
    expect(
      result.steps
        .filter(step => step.phase === 'after-action')
        .map(step => [step.activeActorId, step.actionType, step.damageDealt]),
    ).toEqual([
      [101, 'move', true],
      [202, 'move', true],
    ]);
    expect(result.finalState.currentPokemon1?.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon2?.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon1?.hp).toBeGreaterThan(0);
    expect(result.finalState.currentPokemon2?.hp).toBeGreaterThan(0);
    expect(move1.uses).toBe(10);
    expect(result.finalState.currentPokemon1?.moves[0].uses).toBe(9);
    expect(move2.uses).toBe(8);
    expect(result.finalState.currentPokemon2?.moves[0].uses).toBe(7);
    expectOngoingTurn(result, 8);
  });

  it('executa a troca voluntária antes do golpe adversário', () => {
    const outgoing = createPokemon({
      id: 111,
      name: 'Titular',
      hp: 400,
      maxHP: 400,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const reserve = createPokemon({
      id: 112,
      name: 'Reserva',
      hp: 400,
      maxHP: 400,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const opponent = createPokemon({
      id: 222,
      name: 'Oponente',
      hp: 400,
      maxHP: 400,
      speedStat: 100,
      moves: [createMove({ uses: 12, maxUses: 12 })],
    });
    const opponentMove = opponent.moves[0];
    const initialState = createBattleState([outgoing, reserve], [opponent], { turn: 2 });

    const result = runCoordinatorTurn({
      seed: 1202,
      initialState,
      p1Action: createSwitchAction(outgoing, reserve, 1),
      p2Action: createMoveAction(opponent, opponentMove, 2),
      config: createBattleConfig(),
    });

    expect(result.steps.map(step => step.phase)).toEqual([
      'start',
      'after-action',
      'before-action',
      'after-action',
      'turn-end',
    ]);
    expect(
      result.steps
        .filter(step => step.phase === 'after-action')
        .map(step => [step.activeActorId, step.actionType]),
    ).toEqual([
      [111, 'switch'],
      [222, 'move'],
    ]);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[1]);
    expect(result.finalState.currentPokemon1).not.toBe(reserve);
    expect(result.finalState.team1[0]).not.toBe(outgoing);
    expect(outgoing.hp).toBe(400);
    expect(reserve.hp).toBe(400);
    expect(result.finalState.currentPokemon1?.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon1?.hp).toBeGreaterThan(0);
    expect(opponent.hp).toBe(400);
    expect(outgoing.moves[0].uses).toBe(10);
    expect(opponentMove.uses).toBe(12);
    expect(result.finalState.currentPokemon2?.moves[0].uses).toBe(11);
    expectOngoingTurn(result, 3);
  });

  it('consome o item e aplica sua cura antes do golpe adversário', () => {
    const target = createPokemon({
      id: 121,
      name: 'Alvo do Item',
      hp: 60,
      maxHP: 400,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const opponent = createPokemon({
      id: 212,
      name: 'Oponente do Item',
      hp: 400,
      maxHP: 400,
      speedStat: 100,
      moves: [createMove({ uses: 12, maxUses: 12 })],
    });
    const opponentMove = opponent.moves[0];
    const initialState = createBattleState([target], [opponent], {
      turn: 4,
      p1Inventory: createPlayerInventory({
        items: [createBagItem({ id: 'potion', quantity: 1 })],
      }),
    });

    const result = runCoordinatorTurn({
      seed: 1203,
      initialState,
      p1Action: createItemAction(target, target.id, 'potion', 1),
      p2Action: createMoveAction(opponent, opponentMove, 2),
      config: createBattleConfig(),
    });

    expect(result.steps.map(step => step.phase)).toEqual([
      'start',
      'after-action',
      'before-action',
      'after-action',
      'turn-end',
    ]);
    expect(
      result.steps
        .filter(step => step.phase === 'after-action')
        .map(step => [step.activeActorId, step.actionType]),
    ).toEqual([
      [121, 'item'],
      [212, 'move'],
    ]);
    expect(result.stateSnapshots[1].currentPokemon1?.hp).toBe(80);
    expect(result.stateSnapshots[1].currentPokemon2?.moves[0].uses).toBe(12);
    expect(result.finalState.currentPokemon1?.hp).toBeLessThan(80);
    expect(result.finalState.currentPokemon1?.hp).toBeGreaterThan(0);
    expect(result.finalState.p1Inventory.items).toEqual([]);
    expect(opponentMove.uses).toBe(12);
    expect(result.finalState.currentPokemon2?.moves[0].uses).toBe(11);
    expectOngoingTurn(result, 5);
  });

  it('conclui o turno preservando clima e terreno e decrementando suas durações', () => {
    const attacker1 = createPokemon({
      id: 131,
      name: 'Campo Um',
      hp: 500,
      maxHP: 500,
      speedStat: 130,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const attacker2 = createPokemon({
      id: 232,
      name: 'Campo Dois',
      hp: 500,
      maxHP: 500,
      speedStat: 80,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const move1 = attacker1.moves[0];
    const move2 = attacker2.moves[0];
    const initialState = createBattleState([attacker1], [attacker2], {
      turn: 10,
      weather: 'rain',
      weatherTurns: 3,
      terrain: 'grassy',
      terrainTurns: 4,
    });

    const result = runCoordinatorTurn({
      seed: 1204,
      initialState,
      p1Action: createMoveAction(attacker1, move1, 1),
      p2Action: createMoveAction(attacker2, move2, 2),
      config: createBattleConfig({ weatherEnabled: true, terrainEnabled: true }),
    });

    expect(result.steps.map(step => step.phase)).toEqual(MOVE_PHASES);
    expect(result.finalState.weather).toBe('rain');
    expect(result.finalState.weatherTurns).toBe(2);
    expect(result.finalState.terrain).toBe('grassy');
    expect(result.finalState.terrainTurns).toBe(3);
    expect(result.finalState.currentPokemon1?.isFainted).toBe(false);
    expect(result.finalState.currentPokemon2?.isFainted).toBe(false);
    expect(move1.uses).toBe(10);
    expect(result.finalState.currentPokemon1?.moves[0].uses).toBe(9);
    expect(move2.uses).toBe(10);
    expect(result.finalState.currentPokemon2?.moves[0].uses).toBe(9);
    expectOngoingTurn(result, 11);
  });
});
