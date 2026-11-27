import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideAIAction, evaluateGameState } from '../../services/aiLogic';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';

// Lado controlado pela IA: P1 recebe 1, P2 recebe 2. A avaliação, os alvos e os estados
// retornados pela simulação seguem esse lado, nunca a posição fixa de P2.
describe('IA parametrizada pelo lado controlado', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede proibida nos testes de IA por lado');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const createDuel = (
    bot: ReturnType<typeof createPokemon>,
    opponent: ReturnType<typeof createPokemon>,
    botSide: 1 | 2,
    seed: number,
  ) => {
    const state = botSide === 1
      ? createBattleState([bot], [opponent])
      : createBattleState([opponent], [bot]);
    state.prngState = createBattlePRNGState(seed);
    return state;
  };

  const decideFor = (
    state: ReturnType<typeof createBattleState>,
    bot: ReturnType<typeof createPokemon>,
    opponent: ReturnType<typeof createPokemon>,
    seed: number,
    options: { botPlayerNum?: 1 | 2; terastallization?: boolean; mega?: boolean; extraArgs?: boolean } = {},
  ) => {
    state.prngState = createBattlePRNGState(seed);
    const botPlayerNum = options.botPlayerNum ?? 2;
    const botTeam = botPlayerNum === 1 ? state.team1 : state.team2;
    const opponentTeam = botPlayerNum === 1 ? state.team2 : state.team1;
    const terastallization = options.terastallization ?? false;
    const mega = options.mega ?? false;

    if (options.extraArgs === false) {
      // Compatibilidade: chamadores antigos não informam o lado controlado.
      return decideAIAction(
        bot, opponent, botTeam, opponentTeam, state.weather, true, undefined,
        terastallization, false, state, mega, false,
      );
    }

    return decideAIAction(
      bot, opponent, botTeam, opponentTeam, state.weather, true, undefined,
      terastallization, false, state, mega, false, botPlayerNum,
    );
  };

  it('P1 retorna playerNum 1, escolhe ação legal e não ataca a si mesmo', () => {
    const bot = createPokemon({
      id: 101,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 190,
      speedStat: 160,
      moves: [createMove({ name: 'golpe-de-p1', power: 100, uses: 10, maxUses: 10 })],
    });
    const opponent = createPokemon({
      id: 102,
      name: 'Oponente P2',
      hp: 400,
      maxHP: 400,
      defenseStat: 80,
      speedStat: 60,
      moves: [createMove({ name: 'contra-ataque', power: 40, uses: 10, maxUses: 10 })],
    });
    const state = createDuel(bot, opponent, 1, 3401);

    const action = decideFor(state, bot, opponent, 3401, { botPlayerNum: 1 });

    expect(action.playerNum).toBe(1);
    expect(action.user).toBe(bot);
    expect(action.type).toBe('move');
    expect(action.data).toBe(bot.moves[0]);
    expect(action.data.uses).toBe(10);

    const result = runCoordinatorTurn({
      seed: 3401,
      initialState: state,
      p1Action: action,
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 92.5 }),
    });

    expect(result.completed).toBe(true);
    // O golpe de P1 atinge o adversário e não consome HP nem PP do próprio lado.
    expect(result.finalState.currentPokemon2!.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon2!.hp).toBeGreaterThan(0);
    expect(result.finalState.currentPokemon1!.hp).toBe(400);
    expect(result.finalState.currentPokemon1!.isFainted).toBe(false);
    expect(result.finalState.currentPokemon1!.moves[0].uses).toBe(9);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('P2 permanece com playerNum 2 e comportamento compatível pela assinatura padrão', () => {
    const bot = createPokemon({
      id: 201,
      name: 'Bot P2',
      hp: 400,
      maxHP: 400,
      attackStat: 190,
      speedStat: 160,
      moves: [createMove({ name: 'golpe-de-p2', power: 100, uses: 10, maxUses: 10 })],
    });
    const opponent = createPokemon({
      id: 202,
      name: 'Oponente P1',
      hp: 400,
      maxHP: 400,
      defenseStat: 80,
      speedStat: 60,
      moves: [createMove({ name: 'contra-ataque', power: 40, uses: 10, maxUses: 10 })],
    });
    const state = createDuel(bot, opponent, 2, 3402);

    // Sem o 13º argumento: chamadas existentes continuam recebendo o lado 2.
    const action = decideFor(state, bot, opponent, 3402, { botPlayerNum: 2, extraArgs: false });

    expect(action.playerNum).toBe(2);
    expect(action.user).toBe(bot);
    expect(action.type).toBe('move');

    const result = runCoordinatorTurn({
      seed: 3402,
      initialState: state,
      p2Action: action,
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 92.5 }),
    });

    expect(result.finalState.currentPokemon1!.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon1!.hp).toBeGreaterThan(0);
    expect(result.finalState.currentPokemon2!.hp).toBe(400);
    expect(result.finalState.currentPokemon2!.isFainted).toBe(false);
    expect(result.finalState.currentPokemon2!.moves[0].uses).toBe(9);
  });

  it('avalia positivamente o bot à frente e negativamente quando atrás, para os dois lados', () => {
    const p1Ahead = createBattleState(
      [createPokemon({ id: 301, name: 'P1 saudável', hp: 400, maxHP: 400 })],
      [createPokemon({ id: 302, name: 'P2 ferido', hp: 100, maxHP: 400 })],
    );
    expect(evaluateGameState(p1Ahead, 1)).toBeGreaterThan(0);
    expect(evaluateGameState(p1Ahead, 2)).toBeLessThan(0);

    const p2Ahead = createBattleState(
      [createPokemon({ id: 303, name: 'P1 ferido', hp: 100, maxHP: 400 })],
      [createPokemon({ id: 304, name: 'P2 saudável', hp: 400, maxHP: 400 })],
    );
    expect(evaluateGameState(p2Ahead, 2)).toBeGreaterThan(0);
    expect(evaluateGameState(p2Ahead, 1)).toBeLessThan(0);

    // A perspectiva é estritamente oposta: o mesmo estado vale o inverso do outro lado.
    expect(evaluateGameState(p1Ahead, 1)).toBe(-evaluateGameState(p1Ahead, 2));
    expect(evaluateGameState(p2Ahead, 2)).toBe(-evaluateGameState(p2Ahead, 1));
  });

  it('em estados espelhados, P1 e P2 escolhem a mesma ação relativa', () => {
    const createMirror = (name: string) => createPokemon({
      id: 77,
      name,
      hp: 400,
      maxHP: 400,
      attackStat: 150,
      defenseStat: 120,
      speedStat: 120,
      types: ['normal'],
      moves: [
        createMove({ name: 'fraco-espelho', power: 40, uses: 10, maxUses: 10 }),
        createMove({ name: 'forte-espelho', power: 110, uses: 10, maxUses: 10 }),
      ],
    });

    const botP1 = createMirror('Espelho A');
    const oppP1 = createMirror('Espelho B');
    const stateP1 = createDuel(botP1, oppP1, 1, 3404);
    const actionP1 = decideFor(stateP1, botP1, oppP1, 3404, { botPlayerNum: 1 });

    const botP2 = createMirror('Espelho A');
    const oppP2 = createMirror('Espelho B');
    const stateP2 = createDuel(botP2, oppP2, 2, 3404);
    const actionP2 = decideFor(stateP2, botP2, oppP2, 3404, { botPlayerNum: 2 });

    expect(actionP1.playerNum).toBe(1);
    expect(actionP2.playerNum).toBe(2);
    expect(actionP1.user).toBe(botP1);
    expect(actionP2.user).toBe(botP2);
    expect(actionP1.data.name).toBe(actionP2.data.name);
    expect(actionP1.data.name).toBe('forte-espelho');
    // Estado espelhado: a vantagem de um lado é exatamente o oposto do outro.
    expect(evaluateGameState(stateP1, 1) + evaluateGameState(stateP1, 2)).toBe(0);
  });

  it('prefere o golpe mais forte quando a simulação comprova maior redução de HP', () => {
    const bot = createPokemon({
      id: 401,
      name: 'Bot P2',
      hp: 400,
      maxHP: 400,
      attackStat: 160,
      speedStat: 140,
      moves: [
        createMove({ name: 'golpe-fraco', power: 40, uses: 10, maxUses: 10 }),
        createMove({ name: 'golpe-forte', power: 130, uses: 10, maxUses: 10 }),
      ],
    });
    const opponent = createPokemon({
      id: 402,
      name: 'Oponente',
      hp: 400,
      maxHP: 400,
      defenseStat: 90,
      speedStat: 70,
      moves: [createMove({ name: 'tapa', power: 30, uses: 10, maxUses: 10 })],
    });
    const state = createDuel(bot, opponent, 2, 3405);

    const action = decideFor(state, bot, opponent, 3405);

    // O golpe fraco é o primeiro da lista: só a simulação com o estado retornado
    // pelo motor distingue as duas opções e elege o mais forte.
    expect(action.type).toBe('move');
    expect(action.data.name).toBe('golpe-forte');
    expect(action.data).toBe(bot.moves[1]);
    expect(action.playerNum).toBe(2);
  });

  it('usa o estado retornado pela simulação sem mutar o estado real', () => {
    const bot = createPokemon({
      id: 501,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 160,
      speedStat: 140,
      moves: [
        createMove({ name: 'golpe-fraco', power: 40, uses: 10, maxUses: 10 }),
        createMove({ name: 'golpe-forte', power: 130, uses: 10, maxUses: 10 }),
      ],
    });
    const opponent = createPokemon({
      id: 502,
      name: 'Oponente',
      hp: 400,
      maxHP: 400,
      defenseStat: 90,
      speedStat: 70,
      moves: [createMove({ name: 'tapa', power: 30, uses: 10, maxUses: 10 })],
    });
    const state = createDuel(bot, opponent, 1, 3406);
    const snapshot = structuredClone(state);

    const action = decideFor(state, bot, opponent, 3406, { botPlayerNum: 1 });

    expect(action.data.name).toBe('golpe-forte');
    // Nada do estado real muda: HP, PP, cursor do PRNG e demais campos permanecem iguais.
    expect(state).toEqual(snapshot);
    expect(state.prngState).toEqual(snapshot.prngState);
    expect(state.currentPokemon1!.hp).toBe(400);
    expect(state.currentPokemon2!.hp).toBe(400);
    expect(state.currentPokemon1!.moves[0].uses).toBe(10);
    expect(state.currentPokemon1!.moves[1].uses).toBe(10);
    expect(bot.hp).toBe(400);
    expect(opponent.hp).toBe(400);
  });

  it('resolve a mesma espécie nos dois lados pela instância, sem trocar os alvos', () => {
    const createPikachu = (name: string) => createPokemon({
      id: 25,
      name,
      types: ['electric'],
      hp: 400,
      maxHP: 400,
      attackStat: 180,
      defenseStat: 90,
      speedStat: 120,
      moves: [createMove({ name: 'choque-do-lado', power: 90, uses: 10, maxUses: 10 })],
    });
    const bot = createPikachu('Pikachu P1');
    const opponent = createPikachu('Pikachu P2');
    const state = createDuel(bot, opponent, 1, 3407);

    expect(bot.id).toBe(opponent.id);
    expect(bot.instanceId).not.toBe(opponent.instanceId);

    const action = decideFor(state, bot, opponent, 3407, { botPlayerNum: 1 });

    expect(action.playerNum).toBe(1);
    expect(action.user!.instanceId).toBe(bot.instanceId);

    const result = runCoordinatorTurn({
      seed: 3407,
      initialState: state,
      p1Action: action,
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 92.5 }),
    });

    expect(result.finalState.currentPokemon2!.instanceId).toBe(opponent.instanceId);
    expect(result.finalState.currentPokemon2!.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon1!.hp).toBe(400);
    expect(result.finalState.currentPokemon1).not.toBe(result.finalState.currentPokemon2);
  });

  it('não altera o cursor real e é determinística com a seed redefinida', () => {
    const bot = createPokemon({
      id: 601,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 160,
      speedStat: 140,
      moves: [
        createMove({ name: 'golpe-fraco', power: 40, uses: 10, maxUses: 10 }),
        createMove({ name: 'golpe-forte', power: 130, uses: 10, maxUses: 10 }),
      ],
    });
    const opponent = createPokemon({
      id: 602,
      name: 'Oponente',
      hp: 400,
      maxHP: 400,
      defenseStat: 90,
      speedStat: 70,
      moves: [createMove({ name: 'tapa', power: 30, uses: 10, maxUses: 10 })],
    });
    const state = createDuel(bot, opponent, 1, 3408);
    const cursorBefore = state.prngState!.cursor;

    const first = decideFor(state, bot, opponent, 3408, { botPlayerNum: 1 });
    const cursorAfterFirst = state.prngState!.cursor;
    const second = decideFor(state, bot, opponent, 3408, { botPlayerNum: 1 });

    expect(first).toEqual(second);
    expect(cursorAfterFirst).toBe(cursorBefore);
    expect(state.prngState!.cursor).toBe(cursorBefore);
  });

  it('mantém Tera, Mega e o consumo legal de PP', () => {
    // Tera: o bot fica abaixo de 25% de HP, então a decisão é determinística.
    const teraBot = createPokemon({
      id: 701,
      name: 'Bot Tera P1',
      hp: 60,
      maxHP: 400,
      speedStat: 200,
      types: ['water'],
      teraType: 'fire',
      moves: [
        createMove({ name: 'chama-tera', type: 'fire', power: 90, uses: 8, maxUses: 10 }),
        createMove({ name: 'tapa-tera', type: 'normal', power: 40, uses: 8, maxUses: 10 }),
      ],
    });
    const teraOpponent = createPokemon({
      id: 702,
      name: 'Oponente Tera',
      hp: 400,
      maxHP: 400,
      speedStat: 40,
      moves: [createMove({ name: 'tapa', power: 30, uses: 10, maxUses: 10 })],
    });
    const teraState = createDuel(teraBot, teraOpponent, 1, 3409);
    const teraAction = decideFor(teraState, teraBot, teraOpponent, 3409, {
      botPlayerNum: 1,
      terastallization: true,
    });

    expect(teraAction.type).toBe('move');
    expect(teraAction.playerNum).toBe(1);
    expect(teraAction.data.uses).toBeGreaterThan(0);
    expect(teraAction.shouldTerastallize).toBe(true);
    expect(teraAction.shouldMegaEvolve).toBeUndefined();
    expect(teraBot.isTerastallized).toBeFalsy();
    expect(teraBot.moves[0].uses).toBe(8);

    // Mega: habilita Mega e Tera ao mesmo tempo para comprovar a exclusividade.
    const megaBot = createPokemon({
      id: 703,
      name: 'Bot Mega P2',
      hp: 400,
      maxHP: 400,
      speedStat: 180,
      teraType: 'steel',
      megaProfile: {
        name: 'Bot Mega P2',
        stats: { hp: 400, attack: 200, defense: 120, spAttack: 100, spDefense: 100, speed: 200 },
        ability: 'intimidate',
        types: ['steel'],
        spriteUrl: '',
        backSpriteUrl: '',
        pixelSpriteUrl: '',
        weight: 200,
      },
      moves: [
        createMove({ name: 'metal-mega', type: 'steel', power: 90, uses: 8, maxUses: 10 }),
        createMove({ name: 'tapa-mega', type: 'normal', power: 40, uses: 8, maxUses: 10 }),
      ],
    });
    const megaOpponent = createPokemon({
      id: 704,
      name: 'Oponente Mega',
      hp: 400,
      maxHP: 400,
      speedStat: 40,
      moves: [createMove({ name: 'tapa', power: 30, uses: 10, maxUses: 10 })],
    });
    const megaState = createDuel(megaBot, megaOpponent, 2, 3410);
    const megaAction = decideFor(megaState, megaBot, megaOpponent, 3410, {
      botPlayerNum: 2,
      terastallization: true,
      mega: true,
    });

    expect(megaAction.type).toBe('move');
    expect(megaAction.playerNum).toBe(2);
    expect(megaAction.shouldMegaEvolve).toBe(true);
    expect(megaAction.shouldTerastallize).toBeUndefined();
    expect(megaBot.isMega).toBeFalsy();

    // PP: golpe sem PP não pode ser escolhido enquanto houver um golpe legal.
    const ppBot = createPokemon({
      id: 705,
      name: 'Bot PP P1',
      hp: 400,
      maxHP: 400,
      speedStat: 140,
      moves: [
        createMove({ name: 'sem-pp', power: 130, uses: 0, maxUses: 10 }),
        createMove({ name: 'com-pp', power: 70, uses: 5, maxUses: 10 }),
        createMove({ name: 'reserva-pp', power: 50, uses: 5, maxUses: 10 }),
      ],
    });
    const ppOpponent = createPokemon({
      id: 706,
      name: 'Oponente PP',
      hp: 400,
      maxHP: 400,
      speedStat: 40,
      moves: [createMove({ name: 'tapa', power: 30, uses: 10, maxUses: 10 })],
    });
    const ppState = createDuel(ppBot, ppOpponent, 1, 3411);
    const ppAction = decideFor(ppState, ppBot, ppOpponent, 3411, { botPlayerNum: 1 });

    expect(ppAction.type).toBe('move');
    expect(ppAction.playerNum).toBe(1);
    expect(ppAction.data.name).not.toBe('sem-pp');
    expect(ppAction.data.name).not.toBe('struggle');
    expect(ppAction.data.uses).toBeGreaterThan(0);
    expect(ppBot.moves[0].uses).toBe(0);
    expect(ppBot.moves[1].uses).toBe(5);
    expect(ppBot.moves[2].uses).toBe(5);
  });

  it('mantém o alvo no adversário com reserva disponível no mesmo turno', () => {
    const bot = createPokemon({
      id: 801,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 160,
      speedStat: 140,
      moves: [createMove({ name: 'golpe-p1', power: 90, uses: 10, maxUses: 10 })],
    });
    const reserve = createPokemon({
      id: 802,
      name: 'Reserva P1',
      hp: 400,
      maxHP: 400,
      moves: [createMove({ name: 'golpe-reserva', power: 90, uses: 10, maxUses: 10 })],
    });
    const opponent = createPokemon({
      id: 803,
      name: 'Oponente P2',
      hp: 400,
      maxHP: 400,
      speedStat: 60,
      moves: [createMove({ name: 'tapa', power: 30, uses: 10, maxUses: 10 })],
    });
    const state = createBattleState([bot, reserve], [opponent]);
    state.prngState = createBattlePRNGState(3412);

    const action = decideFor(state, bot, opponent, 3412, { botPlayerNum: 1 });

    expect(action.playerNum).toBe(1);
    expect(action.type).toBe('move');

    const result = runCoordinatorTurn({
      seed: 3412,
      initialState: state,
      p1Action: action,
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 92.5 }),
    });

    expect(result.finalState.currentPokemon2!.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon1!.hp).toBe(400);
    expect(result.finalState.currentPokemon1!.isFainted).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});