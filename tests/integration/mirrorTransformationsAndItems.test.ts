import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleEjectButton } from '../../services/engine/handlers/items/ejectButton';
import type { BattleState } from '../../types';
import { createBagItem, createBattleState, createMove, createPlayerInventory, createPokemon } from '../factories';
import { createBattleConfig, createItemAction, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

const getAfterActionState = (steps: ReturnType<typeof runCoordinatorTurn>['steps'], snapshots: BattleState[]): BattleState => {
  const index = steps.findIndex(step => step.phase === 'after-action');
  expect(index).toBeGreaterThanOrEqual(0);
  return snapshots[index];
};

describe('transformações e itens em batalha espelho', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registra Tera somente no lado da instância que agiu', () => {
    const player1 = createPokemon({ id: 25, name: 'Espelho P1' });
    const player2 = createPokemon({ id: 25, name: 'Espelho P2', moves: [createMove()] });
    const action = { ...createMoveAction(player2, player2.moves[0], 2), shouldTerastallize: true };
    const result = runCoordinatorTurn({
      seed: 2421,
      initialState: createBattleState([player1], [player2]),
      p2Action: action,
      config: createBattleConfig({ terastallizationEnabled: true, forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });
    const state = getAfterActionState(result.steps, result.stateSnapshots);

    expect(result.completed).toBe(true);
    expect(state.p1TeraUsed).toBeFalsy();
    expect(state.p2TeraUsed).toBe(true);
    expect(state.currentPokemon1?.isTerastallized).toBeFalsy();
    expect(state.currentPokemon2?.isTerastallized).toBe(true);
    expect(state.currentPokemon2?.instanceId).toBe('p2-slot-0');
  });

  it('registra Mega somente no lado da instância que agiu e preserva sua identidade', () => {
    const player1 = createPokemon({ id: 25, name: 'Espelho P1' });
    const player2 = createPokemon({
      id: 25,
      name: 'Espelho P2',
      moves: [createMove()],
      megaProfile: {
        name: 'Mega Espelho P2',
        stats: { hp: 100, attack: 120, defense: 100, spAttack: 100, spDefense: 100, speed: 100 },
        ability: 'synchronize',
        types: ['normal'],
        spriteUrl: 'mega-front',
        backSpriteUrl: 'mega-back',
        pixelSpriteUrl: 'mega-pixel',
        weight: 100,
      },
    });
    const initialState = createBattleState([player1], [player2]);
    const originalInstanceId = player2.instanceId;
    const action = { ...createMoveAction(player2, player2.moves[0], 2), shouldMegaEvolve: true };
    const result = runCoordinatorTurn({
      seed: 2422,
      initialState,
      p2Action: action,
      config: createBattleConfig({ megaEvolutionEnabled: true, forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });
    const state = getAfterActionState(result.steps, result.stateSnapshots);

    expect(result.completed).toBe(true);
    expect(state.p1MegaUsed).toBeFalsy();
    expect(state.p2MegaUsed).toBe(true);
    expect(state.currentPokemon1?.isMega).toBeFalsy();
    expect(state.currentPokemon2?.isMega).toBe(true);
    expect(state.currentPokemon2?.instanceId).toBe(originalInstanceId);
  });

  it('usa o alvo da mochila por instância mesmo com duplicatas na mesma equipe', () => {
    const active = createPokemon({ id: 25, name: 'Titular', hp: 100, maxHP: 100 });
    const reserve = createPokemon({ id: 25, name: 'Reserva', hp: 50, maxHP: 100 });
    const opponent = createPokemon({ id: 25, name: 'Oponente', hp: 100, maxHP: 100 });
    const initialState = createBattleState([active, reserve], [opponent], {
      p1Inventory: createPlayerInventory({ items: [createBagItem({ id: 'potion', quantity: 1 })] }),
      p2Inventory: createPlayerInventory({ items: [createBagItem({ id: 'potion', quantity: 1 })] }),
    });
    const action = createItemAction(active, reserve.id, 'potion', 1);
    action.data.targetInstanceId = reserve.instanceId;
    const result = runCoordinatorTurn({
      seed: 2423,
      initialState,
      p1Action: action,
      config: createBattleConfig(),
    });
    const state = getAfterActionState(result.steps, result.stateSnapshots);

    expect(result.completed).toBe(true);
    expect(state.team1[0].hp).toBe(100);
    expect(state.team1[1].hp).toBe(70);
    expect(state.team1[1].instanceId).toBe(reserve.instanceId);
    expect(state.currentPokemon2?.hp).toBe(100);
    expect(state.p1Inventory.items).toEqual([]);
    expect(state.p2Inventory.items).toEqual([{ id: 'potion', quantity: 1 }]);
  });

  it('aplica Guard Spec e Eject Button no lado da instância, sem excluir duplicata como reserva', () => {
    const player1 = createPokemon({ id: 25, name: 'Espelho P1' });
    const player2 = createPokemon({ id: 25, name: 'Espelho P2' });
    const initialState = createBattleState([player1], [player2], {
      p2Inventory: createPlayerInventory({ items: [createBagItem({ id: 'guard-spec', quantity: 1 })] }),
    });
    const guardAction = createItemAction(player2, player2.id, 'guard-spec', 2);
    guardAction.data.targetInstanceId = player2.instanceId;
    const guardResult = runCoordinatorTurn({
      seed: 2424,
      initialState,
      p2Action: guardAction,
      config: createBattleConfig(),
    });
    const guardState = getAfterActionState(guardResult.steps, guardResult.stateSnapshots);

    expect(guardState.p1Hazards.safeguard).toBe(0);
    expect(guardState.p2Hazards.safeguard).toBe(5);

    const reserve = createPokemon({ id: 25, name: 'Reserva de P2' });
    player2.heldItem = 'eject-button';
    const state = createBattleState([player1], [player2, reserve]);
    const logs: { message: string; color: string }[] = [];
    const randomSpy = vi.spyOn(Math, 'random');

    expect(handleEjectButton(player2, state, logs)).toBe(true);
    expect(reserve.instanceId).not.toBe(player2.instanceId);
    expect(player2.consumedItem).toBe('eject-button');
    expect(randomSpy).not.toHaveBeenCalled();
  });
});
