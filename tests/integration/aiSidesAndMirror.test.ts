import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideAIAction } from '../../services/aiLogic';
import { disableDeterministicRandom, enableDeterministicRandom } from '../../utils/prng';
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
    disableDeterministicRandom();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('escolhe para P2 um golpe com PP disponível e restaura o PRNG em finally', () => {
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
    const originalRandom = Math.random;
    let action: ReturnType<typeof decideAIAction>;

    enableDeterministicRandom(1601);
    try {
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
    } finally {
      disableDeterministicRandom();
    }

    expect(Math.random).toBe(originalRandom);
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
    expect(defender2.hp).toBe(0);
    expect(defender2.isFainted).toBe(true);
    expect(p1Move.uses).toBe(9);
    expect(p2Move.uses).toBe(10);
    expect(result.finalState.currentPokemon1).toBe(attacker1);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[0]);
    expect(result.finalState.currentPokemon2).toBe(defender2);
    expect(result.finalState.currentPokemon2).toBe(result.finalState.team2[0]);
    expect(gameOverStep?.winner).toBe(1);
    expect(result.finalState.winner).toBe(1);
    expect(result.finalState.isBattleInProgress).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.todo('3.4: escolhe ação legal para P1 com playerNum 1, alvo correto e avaliação do próprio lado');
  it.todo('2.4: preserva os lados com Tailwind, Tera, Mega, hazards e telas em batalha espelho');
  it.todo('2.4/3.4: decide com IA local e LLM sem confundir instâncias da mesma espécie em espelho');
});
