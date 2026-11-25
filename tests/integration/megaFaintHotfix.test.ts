import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideAIAction } from '../../services/aiLogic';
import { executeMove } from '../../services/engine/moves';
import { performSwitch } from '../../services/engine/switching';
import { decideLLMAction } from '../../services/llmAiLogic';
import { BATTLE_MESSAGES } from '../../data/battleMessages';
import type { Pokemon } from '../../types';
import { disableDeterministicRandom, enableDeterministicRandom } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

const createSwampert = (overrides: Partial<Pokemon> = {}): Pokemon => createPokemon({
  id: 260,
  name: 'Swampert',
  hp: 115,
  maxHP: 176,
  spriteUrl: 'base-front',
  backSpriteUrl: 'base-back',
  pixelSpriteUrl: 'base-pixel',
  attackStat: 110,
  defenseStat: 50,
  spAttackStat: 85,
  spDefenseStat: 90,
  speedStat: 200,
  ability: 'torrent',
  types: ['water', 'ground'],
  heldItem: 'swampertite',
  teraType: 'water',
  moves: [createMove({
    name: 'water-gun',
    displayName: 'Water Gun',
    power: 40,
    type: 'water',
    uses: 25,
    maxUses: 25,
  })],
  megaProfile: {
    name: 'Mega Swampert',
    stats: { hp: 100, attack: 150, defense: 110, spAttack: 95, spDefense: 110, speed: 70 },
    ability: 'swift-swim',
    types: ['water', 'ground'],
    spriteUrl: 'mega-front',
    backSpriteUrl: 'mega-back',
    pixelSpriteUrl: 'mega-pixel',
    weight: 1020,
  },
  ...overrides,
});

const createOpponent = (): Pokemon => createPokemon({
  id: 9,
  name: 'Blastoise',
  hp: 500,
  maxHP: 500,
  attackStat: 200,
  defenseStat: 100,
  speedStat: 60,
  types: ['water'],
  moves: [createMove({
    name: 'golpe-do-oponente',
    displayName: 'Golpe do Oponente',
    power: 180,
    type: 'normal',
    uses: 10,
    maxUses: 10,
  })],
});

const runMegaKoScenario = (withReserve = true) => {
  const swampert = createSwampert({ hp: 1 });
  const reserve = createPokemon({ id: 448, name: 'Lucario', hp: 300, maxHP: 300 });
  const opponent = createOpponent();
  const initialState = createBattleState(
    withReserve ? [swampert, reserve] : [swampert],
    [opponent],
  );

  // Reproduz a hidratação que substituía ativo e equipe por objetos independentes.
  initialState.currentPokemon1 = structuredClone(initialState.team1[0]);

  const p1Action = {
    ...createMoveAction(initialState.currentPokemon1!, initialState.currentPokemon1!.moves[0], 1),
    shouldMegaEvolve: true,
    shouldTerastallize: true,
  };
  const result = runCoordinatorTurn({
    seed: 2601,
    initialState,
    p1Action,
    p2Action: createMoveAction(initialState.currentPokemon2!, initialState.currentPokemon2!.moves[0], 2),
    config: createBattleConfig({
      megaEvolutionEnabled: true,
      terastallizationEnabled: true,
      forceAccuracyOutcome: 'hit',
      fixedRoll: 1,
    }),
  });

  return { initialState, reserve, result };
};

describe('hotfix da identidade Mega e do fluxo pós-desmaio', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede externa proibida nos testes do hotfix');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    disableDeterministicRandom();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('repara a separação ativo/equipe na origem e aplica dano ao mesmo objeto canônico', () => {
    const attacker = createPokemon({
      id: 1,
      hp: 400,
      maxHP: 400,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const defender = createPokemon({ id: 2, hp: 400, maxHP: 400 });
    const initialState = createBattleState([attacker], [defender]);
    initialState.currentPokemon2 = structuredClone(initialState.team2[0]);

    const result = executeMove(
      initialState,
      initialState.currentPokemon1!,
      initialState.currentPokemon2!,
      initialState.currentPokemon1!.moves[0],
      createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    );

    expect(result.damageDealt).toBe(true);
    expect(result.newState.currentPokemon2).toBe(result.newState.team2[0]);
    expect(result.newState.currentPokemon2?.hp).toBe(result.newState.team2[0].hp);
    expect(result.newState.currentPokemon2?.isFainted).toBe(result.newState.team2[0].isFainted);
    expect(result.newState.currentPokemon2?.hp).toBeLessThan(400);
  });

  it('entrega a forma Mega e o KO no snapshot do card, emite um faint-switch e admite o reserva', () => {
    const { initialState, result } = runMegaKoScenario();
    const actionSteps = result.steps.filter(step => step.phase === 'after-action');
    const megaStep = actionSteps[0];
    const koStep = actionSteps[1];
    const faintSteps = result.steps.filter(step => step.phase === 'faint-switch');

    expect(initialState.currentPokemon1).not.toBe(initialState.team1[0]);
    expect(initialState.team1[0].hp).toBe(1);
    expect(initialState.team1[0].isFainted).toBe(false);
    expect(result.completed).toBe(true);
    expect(megaStep.state.currentPokemon1).toBe(megaStep.state.team1[0]);
    expect(megaStep.state.currentPokemon1).toMatchObject({
      instanceId: 'p1-slot-0',
      name: 'Mega Swampert',
      spriteUrl: 'mega-front',
      backSpriteUrl: 'mega-back',
      pixelSpriteUrl: 'mega-pixel',
      types: ['water', 'ground'],
      attackStat: 150,
      defenseStat: 110,
      spAttackStat: 95,
      spDefenseStat: 110,
      speedStat: 70,
      ability: 'swift-swim',
      isMega: true,
    });
    expect(megaStep.state.currentPokemon1?.isTerastallized).toBeFalsy();
    expect(megaStep.state.p1MegaUsed).toBe(true);
    expect(megaStep.state.p1TeraUsed).toBeFalsy();
    expect(koStep.state.currentPokemon1).toBe(koStep.state.team1[0]);
    expect(koStep.state.currentPokemon1).toMatchObject({ hp: 0, isFainted: true });
    expect(koStep.state.team1[0]).toMatchObject({ hp: 0, isFainted: true });
    expect(faintSteps).toHaveLength(1);
    expect(result.steps.some(step => step.phase === 'game-over')).toBe(false);
    expect(faintSteps[0].state.team1[1]).toMatchObject({ id: 448, isFainted: false });

    const faintLogs = result.steps.flatMap(step => step.logs)
      .filter(entry => entry.message === BATTLE_MESSAGES.FAINTED('Mega Swampert'));
    expect(faintLogs).toHaveLength(1);

    const switched = performSwitch(faintSteps[0].state, faintSteps[0].state.team1[1], 1, false);
    expect(switched.newState.currentPokemon1).toBe(switched.newState.team1[1]);
    expect(switched.newState.currentPokemon1).toMatchObject({ id: 448, isFainted: false });
    expect(switched.newState.team1[0]).toMatchObject({ id: 260, isFainted: true });
  });

  it('preserva snapshots independentes e replay determinístico no cenário Mega+KO', () => {
    const first = runMegaKoScenario();
    const second = runMegaKoScenario();

    expect(second.result.steps).toEqual(first.result.steps);
    expect(second.result.finalState).toEqual(first.result.finalState);
    expect(second.result.randomDraws).toBe(first.result.randomDraws);
    expect(first.result.stateSnapshots[0]).not.toBe(first.result.stateSnapshots[1]);
    expect(first.result.finalState.currentPokemon1?.instanceId).toBe('p1-slot-0');
  });

  it.each([
    { label: 'ambas as flags preservam somente Mega', isMega: false, isTerastallized: false, shouldMegaEvolve: true, shouldTerastallize: true, expectedMega: true, expectedTera: false },
    { label: 'Tera existente impede Mega', isMega: false, isTerastallized: true, shouldMegaEvolve: true, shouldTerastallize: false, expectedMega: false, expectedTera: true },
    { label: 'Mega existente impede Tera', isMega: true, isTerastallized: false, shouldMegaEvolve: false, shouldTerastallize: true, expectedMega: true, expectedTera: false },
  ])('$label sem consumir Tera indevidamente', ({
    isMega,
    isTerastallized,
    shouldMegaEvolve,
    shouldTerastallize,
    expectedMega,
    expectedTera,
  }) => {
    const attacker = createSwampert({ isMega, isTerastallized });
    const defender = createOpponent();
    const initialState = createBattleState([attacker], [defender], { p1TeraUsed: isTerastallized });
    const result = executeMove(
      initialState,
      initialState.currentPokemon1!,
      initialState.currentPokemon2!,
      initialState.currentPokemon1!.moves[0],
      createBattleConfig({
        megaEvolutionEnabled: true,
        terastallizationEnabled: true,
        forceAccuracyOutcome: 'hit',
        fixedRoll: 1,
      }),
      undefined,
      false,
      shouldTerastallize,
      false,
      shouldMegaEvolve,
    );

    expect(result.newState.currentPokemon1?.isMega).toBe(expectedMega);
    expect(result.newState.currentPokemon1?.isTerastallized).toBe(expectedTera);
    expect(result.newState.p1TeraUsed).toBe(isTerastallized);
    expect(result.newState.currentPokemon1).toBe(result.newState.team1[0]);
    expect(result.newState.currentPokemon1?.isMega && result.newState.currentPokemon1?.isTerastallized).toBe(false);
  });

  it('emite game-over, e não faint-switch, quando o KO não deixa reserva', () => {
    const { result } = runMegaKoScenario(false);
    const gameOverSteps = result.steps.filter(step => step.phase === 'game-over');

    expect(gameOverSteps).toHaveLength(1);
    expect(gameOverSteps[0].winner).toBe(2);
    expect(gameOverSteps[0].state.isBattleInProgress).toBe(false);
    expect(result.steps.some(step => step.phase === 'faint-switch')).toBe(false);
  });

  it('recusa ação contra um alvo já desmaiado sem PP, dano ou log de desmaio repetidos', () => {
    const attacker = createOpponent();
    const defender = createSwampert({ hp: 0, isFainted: true });
    const initialState = createBattleState([attacker], [defender]);
    const usesBefore = initialState.currentPokemon1!.moves[0].uses;

    const result = executeMove(
      initialState,
      initialState.currentPokemon1!,
      initialState.currentPokemon2!,
      initialState.currentPokemon1!.moves[0],
      createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    );

    expect(result.damageDealt).toBe(false);
    expect(result.logs).toEqual([]);
    expect(result.newState.currentPokemon1?.moves[0].uses).toBe(usesBefore);
    expect(result.newState.currentPokemon2).toMatchObject({ hp: 0, isFainted: true });
  });

  it('não solicita Mega e Tera juntos na IA local', () => {
    const aiPokemon = createSwampert({ hp: 40 });
    const opponent = createOpponent();
    const state = createBattleState([opponent], [aiPokemon]);
    enableDeterministicRandom(2602);
    const action = decideAIAction(
      aiPokemon,
      opponent,
      state.team2,
      state.team1,
      state.weather,
      true,
      undefined,
      true,
      false,
      state,
      true,
      false,
    );

    expect(action.type).toBe('move');
    expect(action.shouldMegaEvolve && action.shouldTerastallize).toBeFalsy();
  });

  it.each([
    {
      label: 'descarta Tera quando o LLM pede Mega e Tera juntos',
      attacker: createSwampert(),
      response: { shouldMegaEvolve: true, shouldTerastallize: true },
      expectedMega: true,
      expectedTera: false,
    },
    {
      label: 'recusa Mega solicitada pelo LLM depois de Tera',
      attacker: createSwampert({ isTerastallized: true }),
      response: { shouldMegaEvolve: true, shouldTerastallize: false },
      expectedMega: false,
      expectedTera: false,
    },
    {
      label: 'recusa Tera solicitada pelo LLM depois de Mega',
      attacker: createSwampert({ isMega: true }),
      response: { shouldMegaEvolve: false, shouldTerastallize: true },
      expectedMega: false,
      expectedTera: false,
    },
  ])('$label', async ({ attacker, response, expectedMega, expectedTera }) => {
    const opponent = createOpponent();
    const state = createBattleState([opponent], [attacker]);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      result: JSON.stringify({
        type: 'move',
        data: { name: attacker.moves[0].name },
        ...response,
      }),
    }), { status: 200 }));

    const action = await decideLLMAction(
      attacker,
      opponent,
      state.team2,
      state.team1,
      state.weather,
      true,
      undefined,
      true,
      false,
      state,
      true,
      false,
      'openrouter',
      'modelo-local',
    );

    expect(action.shouldMegaEvolve ?? false).toBe(expectedMega);
    expect(action.shouldTerastallize ?? false).toBe(expectedTera);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
