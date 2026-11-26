import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideAIAction } from '../../services/aiLogic';
import { decideLLMAction } from '../../services/llmAiLogic';
import { getSortedActions } from '../../services/engine/actions';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

describe('IA por jogador e batalha espelho no núcleo', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede proibida nos testes de IA e batalha espelho');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('escolhe para P2 um golpe com PP disponível usando o snapshot da seed', () => {
    const exhaustedMove = createMove({ name: 'sem-pp', power: 120, priority: 0, uses: 0, maxUses: 10 });
    const availableMove = createMove({ name: 'com-pp', power: 40, priority: 0, uses: 7, maxUses: 10 });
    const aiPokemon = createPokemon({
      id: 202,
      name: 'IA de P2',
      hp: 400,
      maxHP: 400,
      speedStat: 140,
      moves: [exhaustedMove, availableMove],
    });
    const opponent = createPokemon({
      id: 102,
      name: 'Oponente de P2',
      hp: 400,
      maxHP: 400,
      speedStat: 90,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const state = createBattleState([opponent], [aiPokemon]);
    let action: ReturnType<typeof decideAIAction>;

    state.prngState = createBattlePRNGState(1601);
    action = decideAIAction(
        aiPokemon,
        opponent,
        state.team2,
        state.team1,
        state.weather,
        true,
        undefined,
        false,
        false,
        state,
        false,
        false,
      );

    expect(action).toEqual({
      type: 'move',
      data: availableMove,
      user: aiPokemon,
      playerNum: 2,
      priority: 0,
    });
    expect(action.data.uses).toBe(7);
    expect(exhaustedMove.uses).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolve um golpe simples por playerNum com a mesma espécie nos dois lados', () => {
    const attacker1 = createPokemon({
      id: 25,
      name: 'Pikachu',
      types: ['electric'],
      hp: 400,
      maxHP: 400,
      attackStat: 200,
      speedStat: 140,
      moves: [createMove({ name: 'golpe-espelho', power: 120, uses: 10, maxUses: 10 })],
    });
    const defender2 = createPokemon({
      id: 25,
      name: 'Pikachu',
      types: ['electric'],
      hp: 1,
      maxHP: 400,
      defenseStat: 50,
      speedStat: 90,
      moves: [createMove({ name: 'golpe-espelho', power: 120, uses: 10, maxUses: 10 })],
    });
    const initialState = createBattleState([attacker1], [defender2]);
    const p1Move = attacker1.moves[0];
    const p2Move = defender2.moves[0];

    const result = runCoordinatorTurn({
      seed: 1602,
      initialState,
      p1Action: createMoveAction(attacker1, p1Move, 1),
      p2Action: createMoveAction(defender2, p2Move, 2),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    const gameOverStep = result.steps.find(step => step.phase === 'game-over');
    expect(result.completed).toBe(true);
    expect(attacker1.id).toBe(defender2.id);
    expect(attacker1.hp).toBe(400);
    expect(attacker1.isFainted).toBe(false);
    expect(defender2.hp).toBe(1);
    expect(defender2.isFainted).toBe(false);
    expect(result.finalState.currentPokemon2?.hp).toBe(0);
    expect(result.finalState.currentPokemon2?.isFainted).toBe(true);
    expect(p1Move.uses).toBe(10);
    expect(p2Move.uses).toBe(10);
    expect(result.finalState.currentPokemon1?.moves[0].uses).toBe(9);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[0]);
    expect(result.finalState.currentPokemon1).not.toBe(attacker1);
    expect(result.finalState.currentPokemon2).toBe(result.finalState.team2[0]);
    expect(result.finalState.currentPokemon2).not.toBe(defender2);
    expect(gameOverStep?.winner).toBe(1);
    expect(result.finalState.winner).toBe(1);
    expect(result.finalState.isBattleInProgress).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserva os lados com Tailwind, hazards e telas em batalha espelho', () => {
    const runP2StatusMove = (name: string, seed: number) => {
      const player1 = createPokemon({ id: 25, name: 'Espelho P1', speedStat: 120 });
      const player2 = createPokemon({ id: 25, name: 'Espelho P2', speedStat: 80 });
      const move = createMove({ name, power: 0, isStatus: true, damageClass: 'status' });
      const initialState = createBattleState([player1], [player2]);
      const result = runCoordinatorTurn({
        seed,
        initialState,
        p2Action: createMoveAction(player2, move, 2),
        config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
      });
      expect(result.completed).toBe(true);
      expect(player1.instanceId).not.toBe(player2.instanceId);
      return { player1, player2, result };
    };

    const tailwind = runP2StatusMove('tailwind', 2401);
    const stealthRock = runP2StatusMove('stealth-rock', 2402);
    const reflect = runP2StatusMove('reflect', 2403);

    expect(tailwind.result.finalState.p1Hazards.tailwind).toBe(0);
    expect(tailwind.result.finalState.p2Hazards.tailwind).toBe(3);
    expect(stealthRock.result.finalState.p1Hazards.stealthRock).toBe(true);
    expect(stealthRock.result.finalState.p2Hazards.stealthRock).toBe(false);
    expect(reflect.result.finalState.p1Hazards.reflect).toBe(0);
    expect(reflect.result.finalState.p2Hazards.reflect).toBe(4);

    const randomSpy = vi.spyOn(Math, 'random');
    const sorted = getSortedActions([
      createMoveAction(tailwind.player1, createMove(), 1),
      createMoveAction(tailwind.player2, createMove(), 2),
    ], tailwind.result.finalState);

    expect(sorted.map(action => action.playerNum)).toEqual([2, 1]);
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it('mantém P2 e os golpes da sua instância na IA local em espelho', () => {
    const opponentMove = createMove({ name: 'sem-pp-espelho', uses: 0, maxUses: 10 });
    const availableMove = createMove({ name: 'golpe-da-instancia', power: 80, uses: 7, maxUses: 10 });
    const player1 = createPokemon({ id: 25, name: 'Espelho P1', moves: [opponentMove] });
    const player2 = createPokemon({ id: 25, name: 'Espelho P2', moves: [availableMove], speedStat: 140 });
    const state = createBattleState([player1], [player2]);
    let action: ReturnType<typeof decideAIAction>;

    state.prngState = createBattlePRNGState(2404);
    action = decideAIAction(
        player2,
        player1,
        state.team2,
        state.team1,
        state.weather,
        true,
        undefined,
        false,
        false,
        state,
        false,
        false,
      );

    expect(action.playerNum).toBe(2);
    expect(action.user).toBe(player2);
    expect(action.data).toEqual(availableMove);
    expect(action.data).toBe(player2.moves[0]);
    expect(action.data.uses).toBe(7);
    expect(opponentMove.uses).toBe(0);
  });

  it('permite ao LLM trocar para uma duplicata pela instância e mantém o lado de P2', async () => {
    const player1 = createPokemon({ id: 25, name: 'Espelho P1' });
    const player2 = createPokemon({ id: 25, name: 'Titular P2', moves: [createMove()] });
    const reserve = createPokemon({ id: 25, name: 'Reserva P2', moves: [createMove()] });
    const state = createBattleState([player1], [player2, reserve]);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      result: JSON.stringify({ type: 'switch', data: { instanceId: reserve.instanceId } }),
    }), { status: 200 }));

    const action = await decideLLMAction(
      player2,
      player1,
      state.team2,
      state.team1,
      state.weather,
      true,
      undefined,
      false,
      false,
      state,
      false,
      false,
      'openrouter',
      'modelo-local',
    );

    expect(action).toEqual({
      type: 'switch',
      data: reserve,
      user: player2,
      playerNum: 2,
      priority: 6,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.todo('3.4: escolhe ação legal para P1 com playerNum 1, alvo correto e avaliação do próprio lado');
});
