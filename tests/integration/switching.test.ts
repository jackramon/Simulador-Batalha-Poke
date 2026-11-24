import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { performSwitch } from '../../services/engine/switching';
import { disableDeterministicRandom, enableDeterministicRandom } from '../../utils/prng';
import {
  createBattleState,
  createMove,
  createPokemon,
  createSideHazards,
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

  it('continua o turno depois que a UI conclui uma troca forçada coordenada', () => {
    const attacker = createPokemon({
      id: 181,
      name: 'Usuário da Retomada',
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
    const reserve = createPokemon({ id: 182, name: 'Substituto da Retomada', hp: 400, maxHP: 400 });
    const defender = createPokemon({ id: 281, name: 'Defensor da Retomada', hp: 500, maxHP: 500 });
    const initialState = createBattleState([attacker, reserve], [defender]);

    const result = runCoordinatorTurn({
      seed: 1406,
      initialState,
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
      chooseForcedSwitch: step => createSwitchAction(step.state.currentPokemon1!, reserve, 1),
    });

    const switchStep = result.steps.find(step =>
      step.phase === 'after-action' && step.actionType === 'switch'
    );

    expect(result.completed).toBe(true);
    expect(switchStep?.activeActorId).toBe(attacker.id);
    expect(result.finalState.currentPokemon1).toBe(reserve);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[1]);
    expect(result.finalState.team1[0]).toBe(attacker);
    expect(result.steps.filter(step => step.phase === 'start')).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('processa ações pendentes e turnEnd no fluxo de troca forçada coordenada', () => {
    const attacker = createPokemon({
      id: 191,
      name: 'Usuário Rápido de U-turn',
      hp: 400,
      maxHP: 400,
      speedStat: 200,
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
    const reserve = createPokemon({ id: 192, name: 'Substituto Atingido', hp: 400, maxHP: 400 });
    const defender = createPokemon({
      id: 291,
      name: 'Adversário com Ação Pendente',
      hp: 500,
      maxHP: 500,
      speedStat: 100,
      moves: [createMove({ name: 'golpe-pendente', power: 50, uses: 12, maxUses: 12 })],
    });
    const initialState = createBattleState([attacker, reserve], [defender]);

    const result = runCoordinatorTurn({
      seed: 1407,
      initialState,
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      p2Action: createMoveAction(defender, defender.moves[0], 2),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
      chooseForcedSwitch: step => createSwitchAction(step.state.currentPokemon1!, reserve, 1),
    });

    expect(result.completed).toBe(true);
    expect(result.steps
      .filter(step => step.phase === 'after-action')
      .map(step => [step.activeActorId, step.actionType])
    ).toEqual([
      [attacker.id, 'move'],
      [attacker.id, 'switch'],
      [defender.id, 'move'],
    ]);
    expect(reserve.hp).toBeLessThan(400);
    expect(reserve.hp).toBeGreaterThan(0);
    expect(defender.moves[0].uses).toBe(11);
    expect(result.finalState.currentPokemon1).toBe(reserve);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[1]);
    expect(result.steps.filter(step => step.phase === 'turn-end')).toHaveLength(1);
    expect(result.steps.filter(step => step.phase === 'start')).toHaveLength(1);
    expect(result.finalState.turn).toBe(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('preserva a herança de Baton Pass na retomada coordenada', () => {
    const attacker = createPokemon({
      id: 195,
      name: 'Usuário de Baton Pass',
      hp: 400,
      maxHP: 400,
      statStages: createStatStages({ attack: 3, speed: -2 }),
      moves: [createMove({
        name: 'baton-pass',
        displayName: 'Baton Pass',
        power: 0,
        isStatus: true,
        damageClass: 'status',
        uses: 10,
        maxUses: 10,
        effect: { status: 'switch-self', chance: 100 },
      })],
    });
    const reserve = createPokemon({ id: 196, name: 'Herdeiro de Baton Pass', hp: 400, maxHP: 400 });
    const defender = createPokemon({ id: 295, name: 'Oponente de Baton Pass', hp: 500, maxHP: 500 });

    const result = runCoordinatorTurn({
      seed: 1409,
      initialState: createBattleState([attacker, reserve], [defender]),
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
      chooseForcedSwitch: step => createSwitchAction(step.state.currentPokemon1!, reserve, 1),
    });

    const prompt = result.steps.find(step => step.phase === 'switch-forced');
    expect(prompt?.switchPrompt).toEqual({ player: 1, isBatonPass: true, canCancel: false });
    expect(result.finalState.currentPokemon1).toBe(reserve);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[1]);
    expect(reserve.statStages.attack).toBe(3);
    expect(reserve.statStages.speed).toBe(-2);
    expect(result.steps.filter(step => step.phase === 'turn-end')).toHaveLength(1);
    expect(result.finalState.turn).toBe(2);
  });

  it.each([
    { label: 'Roar', moveName: 'roar', power: 0, type: 'normal', isStatus: true, damageClass: 'status' as const, forcedPlayer: 2 as const },
    { label: 'Whirlwind', moveName: 'whirlwind', power: 0, type: 'normal', isStatus: true, damageClass: 'status' as const, forcedPlayer: 2 as const },
    { label: 'Dragon Tail', moveName: 'dragon-tail', power: 60, type: 'dragon', isStatus: false, damageClass: 'physical' as const, forcedPlayer: 2 as const },
    { label: 'Circle Throw', moveName: 'circle-throw', power: 60, type: 'fighting', isStatus: false, damageClass: 'physical' as const, forcedPlayer: 2 as const },
    { label: 'Red Card', moveName: 'tackle', power: 40, type: 'normal', isStatus: false, damageClass: 'physical' as const, forcedPlayer: 1 as const },
  ])('unifica $label no fluxo oficial com hazards e entrada únicos', ({
    moveName,
    power,
    type,
    isStatus,
    damageClass,
    forcedPlayer,
  }) => {
    const attackerMove = createMove({
      name: moveName,
      displayName: moveName,
      power,
      type,
      isStatus,
      damageClass,
      priority: 10,
      uses: 10,
      maxUses: 10,
      effect: forcedPlayer === 2 ? { status: 'force-switch', chance: 100 } : undefined,
    });
    const defenderMove = createMove({ name: 'golpe-do-defensor', power: 40, uses: 12, maxUses: 12 });
    const attacker = createPokemon({
      id: 1101,
      name: 'Atacante da Unificação',
      hp: 500,
      maxHP: 500,
      speedStat: 200,
      statStages: createStatStages({ attack: 2 }),
      moves: [attackerMove],
    });
    const attackerReserve = createPokemon({
      id: 1102,
      name: 'Reserva do Atacante',
      hp: 400,
      maxHP: 400,
      ability: 'intimidate',
      moves: [createMove()],
    });
    const defender = createPokemon({
      id: 1201,
      name: 'Defensor da Unificação',
      hp: 500,
      maxHP: 500,
      speedStat: 100,
      heldItem: forcedPlayer === 1 ? 'red-card' : null,
      statStages: createStatStages({ attack: 2 }),
      moves: [defenderMove],
    });
    const defenderReserve = createPokemon({
      id: 1202,
      name: 'Reserva do Defensor',
      hp: 400,
      maxHP: 400,
      ability: 'intimidate',
      moves: [createMove()],
    });
    const initialState = createBattleState(
      [attacker, attackerReserve],
      [defender, defenderReserve],
      {
        p1Hazards: createSideHazards({ stealthRock: true }),
        p2Hazards: createSideHazards({ stealthRock: true }),
      },
    );

    const result = runCoordinatorTurn({
      seed: 1408,
      initialState,
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      p2Action: createMoveAction(defender, defender.moves[0], 2),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    const incoming = forcedPlayer === 1 ? attackerReserve : defenderReserve;
    const outgoing = forcedPlayer === 1 ? attacker : defender;
    const firstActionIndex = result.steps.findIndex(step => step.phase === 'after-action');
    const entrySnapshot = result.stateSnapshots[firstActionIndex];
    const activeAtEntry = forcedPlayer === 1
      ? entrySnapshot?.currentPokemon1
      : entrySnapshot?.currentPokemon2;
    const opponentSnapshot = forcedPlayer === 1
      ? entrySnapshot?.currentPokemon2
      : entrySnapshot?.currentPokemon1;

    expect(result.completed).toBe(true);
    expect(activeAtEntry?.id).toBe(incoming.id);
    expect(activeAtEntry?.hp).toBe(350);
    expect(opponentSnapshot?.statStages.attack).toBe(1);
    expect(outgoing.statStages.attack).toBe(0);
    expect(result.steps.filter(step => step.phase === 'switch-forced')).toHaveLength(0);
    expect(result.finalState.turn).toBe(2);

    if (forcedPlayer === 1) {
      expect(result.finalState.currentPokemon1).toBe(attackerReserve);
      expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[1]);
      expect(result.finalState.currentPokemon2).toBe(defender);
      expect(result.steps
        .filter(step => step.phase === 'after-action')
        .map(step => step.activeActorId)
      ).toEqual([attacker.id, defender.id]);
      expect(attacker.moves[0].uses).toBe(9);
      expect(defender.moves[0].uses).toBe(11);
    } else {
      expect(result.finalState.currentPokemon2).toBe(defenderReserve);
      expect(result.finalState.currentPokemon2).toBe(result.finalState.team2[1]);
      expect(result.finalState.currentPokemon1).toBe(attacker);
      expect(result.steps
        .filter(step => step.phase === 'after-action')
        .map(step => step.activeActorId)
      ).toEqual([attacker.id]);
      expect(defender.moves[0].uses).toBe(12);
      expect(defender.movedThisTurn).toBe(false);
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
