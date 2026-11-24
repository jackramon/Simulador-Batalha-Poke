import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { performSwitch } from '../../services/engine/switching';
import { disableDeterministicRandom, enableDeterministicRandom } from '../../utils/prng';
import {
  createBattleState,
  createMove,
  createPokemon,
  createStatStages,
} from '../factories';
import {
  createBattleConfig,
  createMoveAction,
  createSwitchAction,
  runCoordinatorTurn,
} from './coordinator.helpers';

describe('integração das trocas voluntárias, forçadas e por desmaio', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede proibida nos testes de integração de trocas');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reseta estágios e voláteis na troca voluntária preservando a identidade com a equipe', () => {
    const outgoing = createPokemon({
      id: 141,
      name: 'Titular Voluntário',
      hp: 300,
      maxHP: 300,
      statStages: createStatStages({ attack: 3, defense: -2, speed: 2 }),
      statusEffects: {
        confusion: { turns: 2, isVolatile: true },
        encore: { turns: 3, moveName: 'tackle' },
        toxic: { turns: 4 },
      },
      isFlinched: true,
      turnsActive: 4,
    });
    const reserve = createPokemon({ id: 142, name: 'Reserva Voluntária', hp: 300, maxHP: 300 });
    const opponent = createPokemon({ id: 241, name: 'Oponente da Troca', hp: 300, maxHP: 300 });
    const initialState = createBattleState([outgoing, reserve], [opponent]);

    const result = runCoordinatorTurn({
      seed: 1401,
      initialState,
      p1Action: createSwitchAction(outgoing, reserve, 1),
      config: createBattleConfig(),
    });

    expect(result.completed).toBe(true);
    expect(result.finalState.currentPokemon1).toBe(reserve);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[1]);
    expect(result.finalState.team1[0]).toBe(outgoing);
    expect(outgoing.statStages).toEqual(createStatStages());
    expect(outgoing.statusEffects.confusion).toBeUndefined();
    expect(outgoing.statusEffects.encore).toBeUndefined();
    expect(outgoing.statusEffects.toxic).toEqual({ turns: 0 });
    expect(outgoing.isFlinched).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('causa dano com U-turn e emite switch-forced com os dados para a UI trocar', () => {
    const attacker = createPokemon({
      id: 151,
      name: 'Usuário de U-turn',
      hp: 400,
      maxHP: 400,
      moves: [createMove({
        name: 'u-turn',
        displayName: 'U-turn',
        power: 70,
        type: 'bug',
        uses: 10,
        maxUses: 10,
        effect: { status: 'switch-self', chance: 100 },
      })],
    });
    const reserve = createPokemon({ id: 152, name: 'Reserva Forçada', hp: 400, maxHP: 400 });
    const defender = createPokemon({ id: 251, name: 'Defensor de U-turn', hp: 500, maxHP: 500 });
    const initialState = createBattleState([attacker, reserve], [defender]);

    const result = runCoordinatorTurn({
      seed: 1402,
      initialState,
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    const actionStep = result.steps.find(step => step.phase === 'after-action');
    const forcedStep = result.steps.find(step => step.phase === 'switch-forced');

    expect(result.completed).toBe(true);
    expect(actionStep).toMatchObject({
      activeActorId: 151,
      targetId: 251,
      actionType: 'move',
      damageDealt: true,
    });
    expect(defender.hp).toBeLessThan(500);
    expect(defender.hp).toBeGreaterThan(0);
    expect(forcedStep?.switchPrompt).toEqual({
      player: 1,
      isBatonPass: false,
      canCancel: false,
    });
    expect(forcedStep?.state.currentPokemon1).toBe(attacker);
    expect(forcedStep?.state.team1[0]).toBe(attacker);
    expect(forcedStep?.state.team1[1]).toBe(reserve);
    expect(reserve.isFainted).toBe(false);
    expect(forcedStep?.state.winner).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('emite game-over com o vencedor correto quando o desmaio não deixa reserva', () => {
    const attacker = createPokemon({
      id: 161,
      name: 'Finalizador',
      hp: 400,
      maxHP: 400,
      attackStat: 200,
      moves: [createMove({ name: 'golpe-final', power: 120, uses: 10, maxUses: 10 })],
    });
    const defender = createPokemon({
      id: 261,
      name: 'Último Defensor',
      hp: 1,
      maxHP: 400,
      defenseStat: 50,
    });
    const initialState = createBattleState([attacker], [defender]);

    const result = runCoordinatorTurn({
      seed: 1403,
      initialState,
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    const gameOverStep = result.steps.find(step => step.phase === 'game-over');

    expect(result.completed).toBe(true);
    expect(defender.hp).toBe(0);
    expect(defender.isFainted).toBe(true);
    expect(gameOverStep?.winner).toBe(1);
    expect(gameOverStep?.state.winner).toBe(1);
    expect(gameOverStep?.state.isBattleInProgress).toBe(false);
    expect(gameOverStep?.state.waitingForAction).toBe(false);
    expect(result.steps.some(step => step.phase === 'faint-switch')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('emite faint-switch sem vencedor prematuro e fornece o reserva para performSwitch', () => {
    const attacker = createPokemon({
      id: 171,
      name: 'Atacante da Reserva',
      hp: 400,
      maxHP: 400,
      attackStat: 200,
      moves: [createMove({ name: 'golpe-de-reserva', power: 120, uses: 10, maxUses: 10 })],
    });
    const defender = createPokemon({
      id: 271,
      name: 'Titular Desmaiado',
      hp: 1,
      maxHP: 400,
      defenseStat: 50,
    });
    const reserve = createPokemon({ id: 272, name: 'Reserva Saudável', hp: 400, maxHP: 400 });
    const initialState = createBattleState([attacker], [defender, reserve]);

    const result = runCoordinatorTurn({
      seed: 1404,
      initialState,
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    const faintStep = result.steps.find(step => step.phase === 'faint-switch');

    expect(result.completed).toBe(true);
    expect(result.steps.some(step => step.phase === 'game-over')).toBe(false);
    expect(faintStep?.state.winner).toBeNull();
    expect(faintStep?.state.isBattleInProgress).toBe(true);
    expect(faintStep?.state.currentPokemon2).toBe(defender);
    expect(defender.isFainted).toBe(true);
    expect(faintStep?.state.team2[1]).toBe(reserve);
    expect(reserve.isFainted).toBe(false);

    if (!faintStep) {
      throw new Error('O coordenador não forneceu o estado de substituição por desmaio');
    }

    const replacementState = structuredClone(faintStep.state);
    const replacement = replacementState.team2[1];
    enableDeterministicRandom(1405);
    try {
      const { newState } = performSwitch(replacementState, replacement, 2, false);

      expect(newState.currentPokemon2).toBe(replacement);
      expect(newState.currentPokemon2).toBe(newState.team2[1]);
      expect(newState.team2[0].isFainted).toBe(true);
      expect(newState.winner).toBeNull();
      expect(newState.isBattleInProgress).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      disableDeterministicRandom();
    }
  });

  it.todo('continua o turno depois que a UI conclui uma troca forçada coordenada');
  it.todo('processa ações pendentes e turnEnd no fluxo de troca forçada coordenada');
  it.todo('unifica Roar, Dragon Tail e Red Card no fluxo oficial de trocas do item 2.2');
});
