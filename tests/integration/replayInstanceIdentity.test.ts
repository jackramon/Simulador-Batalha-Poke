import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildReplayAction, createBattleReplayEvent, normalizeReplayTeams, resolveReplaySwitchTarget } from '../../services/replayLogic';
import type { BattleReplayEvent } from '../../types';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';

describe('identidade de instâncias no replay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('grava ator, troca e alvo por instância sem consumir PRNG e reproduz duplicatas em espelho', () => {
    const active = createPokemon({ id: 25, name: 'Titular P1', hp: 100, maxHP: 100 });
    const reserve = createPokemon({ id: 25, name: 'Reserva P1', hp: 50, maxHP: 100 });
    const opponent = createPokemon({ id: 25, name: 'Oponente P2', moves: [createMove()] });
    const normalized = normalizeReplayTeams({ team1: [active, reserve], team2: [opponent] });
    const state = createBattleState(normalized.team1, normalized.team2);
    const randomSpy = vi.spyOn(Math, 'random');

    const switchEvent = createBattleReplayEvent({
      turn: 1,
      player: 1,
      type: 'switch',
      data: state.team1[1],
      user: state.currentPokemon1!,
    });
    const itemEvent = createBattleReplayEvent({
      turn: 2,
      player: 1,
      type: 'item',
      data: { itemId: 'potion', targetId: 25, targetInstanceId: state.team1[1].instanceId, isGive: false },
      user: state.currentPokemon1!,
    });
    const opponentEvent = createBattleReplayEvent({
      turn: 1,
      player: 2,
      type: 'move',
      data: state.currentPokemon2!.moves[0],
      user: state.currentPokemon2!,
    });

    expect(switchEvent).toMatchObject({
      actorId: 1,
      actorInstanceId: 'p1-slot-0',
      switchId: 25,
      switchInstanceId: 'p1-slot-1',
    });
    expect(itemEvent).toMatchObject({ targetId: 25, targetInstanceId: 'p1-slot-1' });
    expect(opponentEvent).toMatchObject({ actorId: 2, actorInstanceId: 'p2-slot-0' });
    expect(randomSpy).not.toHaveBeenCalled();

    const switchAction = buildReplayAction(state, switchEvent);
    const itemAction = buildReplayAction(state, itemEvent);
    const opponentAction = buildReplayAction(state, opponentEvent);

    expect(switchAction?.user).toBe(state.currentPokemon1);
    expect(switchAction?.data).toBe(state.team1[1]);
    expect(itemAction?.data.targetInstanceId).toBe('p1-slot-1');
    expect(opponentAction?.user).toBe(state.currentPokemon2);
    expect(opponentAction?.playerNum).toBe(2);

    const result = runCoordinatorTurn({
      seed: 2501,
      initialState: state,
      p1Action: switchAction ?? undefined,
      p2Action: opponentAction ?? undefined,
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    expect(result.completed).toBe(true);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[1]);
    expect(result.finalState.currentPokemon1?.instanceId).toBe('p1-slot-1');
    expect(result.finalState.currentPokemon2?.instanceId).toBe('p2-slot-0');
  });

  it('carrega replay antigo por espécie somente quando o alvo não é ambíguo', () => {
    const outgoing = createPokemon({ id: 25, name: 'Titular Antigo' });
    const reserve = createPokemon({ id: 100, name: 'Reserva Antiga' });
    const opponent = createPokemon({ id: 25, name: 'Oponente Antigo' });
    const normalized = normalizeReplayTeams({ team1: [outgoing, reserve], team2: [opponent] });
    const state = createBattleState(normalized.team1, normalized.team2);
    const oldSwitch: BattleReplayEvent = {
      turn: 1,
      actorId: 1,
      actionType: 'switch',
      switchId: reserve.id,
    };
    const oldItem: BattleReplayEvent = {
      turn: 1,
      actorId: 1,
      actionType: 'item',
      itemId: 'potion',
      targetId: reserve.id,
    };

    expect(state.team1.map(pokemon => pokemon.instanceId)).toEqual(['p1-slot-0', 'p1-slot-1']);
    expect(state.team2[0].instanceId).toBe('p2-slot-0');
    expect(buildReplayAction(state, oldSwitch)?.data).toBe(state.team1[1]);
    expect(buildReplayAction(state, oldItem)?.data.targetInstanceId).toBe('p1-slot-1');
    expect(resolveReplaySwitchTarget(state, oldSwitch)).toBe(state.team1[1]);

    const ambiguousState = createBattleState([
      createPokemon({ id: 25, name: 'Duplicata A' }),
      createPokemon({ id: 25, name: 'Duplicata B' }),
    ], [createPokemon({ id: 25, name: 'Duplicata C' })]);
    const ambiguousEvent: BattleReplayEvent = {
      turn: 1,
      actorId: 1,
      actionType: 'switch',
      switchId: 25,
    };

    expect(buildReplayAction(ambiguousState, ambiguousEvent)).toBeNull();
    expect(resolveReplaySwitchTarget(ambiguousState, ambiguousEvent)).toBeUndefined();
  });

  it('normaliza replay antigo uma única vez e preserva os IDs em novas leituras', () => {
    const initial = {
      team1: [createPokemon({ id: 25 }), createPokemon({ id: 25 })],
      team2: [createPokemon({ id: 25 })],
    };

    const first = normalizeReplayTeams(initial);
    const cloned = structuredClone(first);
    const second = normalizeReplayTeams(cloned);

    expect(second.team1.map(pokemon => pokemon.instanceId)).toEqual(['p1-slot-0', 'p1-slot-1']);
    expect(second.team2.map(pokemon => pokemon.instanceId)).toEqual(['p2-slot-0']);
    expect(second.team1[0]).toBe(cloned.team1[0]);
    expect(second.team1[1]).toBe(cloned.team1[1]);
    expect(second.team2[0]).toBe(cloned.team2[0]);
  });
});
