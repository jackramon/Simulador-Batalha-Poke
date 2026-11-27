import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideAIAction, simulateTurn } from '../../services/aiLogic';
import { BattleCoordinator } from '../../services/engine/coordinator';
import type { TurnStepResult } from '../../services/engine/coordinator';
import { createBattlePRNGState } from '../../utils/prng';
import type { Action, BattleConfig, BattleState } from '../../types';
import { createBattleState, createMove, createPlayerInventory, createPokemon, createSideHazards } from '../factories';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';

// A simulação do expectimax precisa rodar o mesmo turno público da batalha real
// (BattleCoordinator.runTurn, com as duas ações e a configuração real) para que o
// estado avaliado seja exatamente o estado que a batalha produziria.
interface SimulationRecord {
  state: BattleState;
  p1Action?: Action;
  p2Action?: Action;
  config: BattleConfig;
  steps: TurnStepResult[];
  resumptions: (Action | undefined)[];
  finalState: BattleState;
}

describe('Simulação da IA pelo mesmo coordenador da batalha real', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede proibida nas simulações da IA');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Registra cada simulação delegando para o coordenador real, sem substituir o fluxo.
  const recordSimulations = () => {
    const records: SimulationRecord[] = [];
    const originalRunTurn = BattleCoordinator.runTurn;
    const spy = vi.spyOn(BattleCoordinator, 'runTurn').mockImplementation(function* (
      state: BattleState,
      p1Action: Action | undefined,
      p2Action: Action | undefined,
      config: BattleConfig,
    ): Generator<TurnStepResult, void, Action | undefined> {
      const record: SimulationRecord = {
        state,
        p1Action,
        p2Action,
        config,
        steps: [],
        resumptions: [],
        finalState: state,
      };
      records.push(record);

      const inner = originalRunTurn.call(BattleCoordinator, state, p1Action, p2Action, config);
      let next = inner.next();
      while (next.done !== true) {
        record.steps.push(next.value);
        record.finalState = next.value.state;
        const resume = yield next.value;
        record.resumptions.push(resume);
        next = inner.next(resume);
      }
    });
    return { records, spy };
  };

  const isMoveAction = (action: Action | undefined, name: string): boolean =>
    !!action && action.type === 'move' && action.data.name === name;

  const moveAction = (user: ReturnType<typeof createPokemon>, move: ReturnType<typeof createMove>, playerNum: 1 | 2): Action =>
    ({ type: 'move', data: move, user, playerNum, priority: move.priority, tieBreaker: 0 });

  const phaseCount = (record: SimulationRecord, phase: TurnStepResult['phase']): number =>
    record.steps.filter(step => step.phase === phase).length;

  const createBot = (id: number, name: string) => createPokemon({
    id,
    name,
    hp: 400,
    maxHP: 400,
    attackStat: 160,
    defenseStat: 100,
    speedStat: 140,
    moves: [
      createMove({ name: 'golpe-fraco-bot', power: 40, uses: 5, maxUses: 5 }),
      createMove({ name: 'golpe-forte-bot', power: 130, uses: 5, maxUses: 5 }),
    ],
  });

  const createOpponent = (id: number, name: string) => createPokemon({
    id,
    name,
    hp: 400,
    maxHP: 400,
    attackStat: 100,
    defenseStat: 90,
    speedStat: 70,
    types: ['normal'],
    moves: [createMove({ name: 'tapa-oponente', power: 30, uses: 5, maxUses: 5 })],
    // Sem movesUsed a percepção adiciona um golpe deduzido, que não pertence à equipe real.
    movesUsed: ['tapa-oponente'],
  });

  it('executa exatamente uma simulação por ação legal, sempre pelo runTurn com a configuração real', () => {
    const bot = createBot(9001, 'Bot P1');
    const opponent = createOpponent(9002, 'Oponente P2');
    const state = createBattleState([bot], [opponent]);
    state.prngState = createBattlePRNGState(9501);
    const realConfig = createBattleConfig({
      weatherEnabled: false,
      terrainEnabled: false,
      itemsEnabled: true,
      moveLimitEnabled: true,
    });
    const { records, spy } = recordSimulations();

    const action = decideAIAction(
      bot, opponent, state.team1, state.team2, state.weather,
      realConfig.moveLimitEnabled, undefined,
      realConfig.terastallizationEnabled, false, state,
      realConfig.megaEvolutionEnabled, false,
      1, realConfig,
    );

    expect(spy).toHaveBeenCalled();
    // Dois golpes legais contra a única ação conhecida do oponente: duas simulações.
    expect(records.length).toBe(2);
    for (const record of records) {
      // A configuração real é usada como base; só a expectativa de precisão/dano é sobrescrita.
      expect(record.config).toEqual({ ...realConfig, forceAccuracyOutcome: 'hit', fixedRoll: 92.5 });
      expect(phaseCount(record, 'start')).toBe(1);
      expect(phaseCount(record, 'turn-end')).toBe(1);
      expect(record.steps[record.steps.length - 1].phase).not.toBe('switch-forced');
    }
    expect(action.type).toBe('move');
    expect(action.data.name).toBe('golpe-forte-bot');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mantém clima, terreno, itens, Tera e Mega desativados quando a configuração real os desativa', () => {
    const bot = createPokemon({
      id: 9101,
      name: 'Bot P1',
      hp: 60,
      maxHP: 400,
      attackStat: 160,
      speedStat: 150,
      types: ['fire'],
      teraType: 'fire',
      megaProfile: {
        name: 'Bot P1 Mega',
        stats: { hp: 60, attack: 200, defense: 120, spAttack: 100, spDefense: 100, speed: 160 },
        ability: 'intimidate',
        types: ['fire'],
        spriteUrl: '',
        backSpriteUrl: '',
        pixelSpriteUrl: '',
        weight: 200,
      },
      moves: [
        createMove({ name: 'golpe-fraco-bot', type: 'fire', power: 40, uses: 5, maxUses: 5 }),
        createMove({ name: 'golpe-forte-bot', type: 'fire', power: 130, uses: 5, maxUses: 5 }),
      ],
    });
    const opponent = createOpponent(9102, 'Oponente P2');
    const state = createBattleState([bot], [opponent], {
      weather: 'sun',
      weatherTurns: 3,
      terrain: 'electric',
      terrainTurns: 3,
    });
    state.prngState = createBattlePRNGState(9502);
    const realConfig = createBattleConfig({
      weatherEnabled: false,
      terrainEnabled: false,
      itemsEnabled: false,
      terastallizationEnabled: false,
      megaEvolutionEnabled: false,
    });
    const { records } = recordSimulations();

    const action = decideAIAction(
      bot, opponent, state.team1, state.team2, 'sun',
      realConfig.moveLimitEnabled, undefined,
      realConfig.terastallizationEnabled, false, state,
      realConfig.megaEvolutionEnabled, false,
      1, realConfig,
    );

    expect(records.length).toBeGreaterThan(0);
    for (const record of records) {
      expect(record.config.weatherEnabled).toBe(false);
      expect(record.config.terrainEnabled).toBe(false);
      expect(record.config.itemsEnabled).toBe(false);
      expect(record.config.terastallizationEnabled).toBe(false);
      expect(record.config.megaEvolutionEnabled).toBe(false);
      // O turno simulado rodou com o clima desativado: o estado final tem o clima limpo.
      expect(record.finalState.weather).toBe('none');
      expect(record.finalState.weatherTurns).toBe(0);
    }
    expect(action.shouldTerastallize).toBeUndefined();
    expect(action.shouldMegaEvolve).toBeUndefined();
    expect(state.weather).toBe('sun');
    expect(state.weatherTurns).toBe(3);
  });

  it('passa as duas ações ao coordenador, de modo que defenderAction decida os golpes condicionais', () => {
    const bot = createPokemon({
      id: 9201,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 150,
      speedStat: 160,
      moves: [
        createMove({ name: 'sucker-punch', type: 'dark', power: 70, priority: 1, uses: 5, maxUses: 5 }),
        createMove({ name: 'golpe-fraco-bot', power: 30, uses: 5, maxUses: 5 }),
      ],
    });
    const opponent = createPokemon({
      id: 9202,
      name: 'Oponente P2',
      hp: 400,
      maxHP: 400,
      attackStat: 100,
      defenseStat: 90,
      speedStat: 60,
      types: ['normal'],
      moves: [
        createMove({ name: 'ataque-oponente', type: 'normal', power: 60, uses: 5, maxUses: 5 }),
        createMove({ name: 'status-oponente', damageClass: 'status', isStatus: true, power: 0, uses: 5, maxUses: 5 }),
      ],
      movesUsed: ['ataque-oponente', 'status-oponente'],
    });
    const state = createBattleState([bot], [opponent]);
    state.prngState = createBattlePRNGState(9503);
    const realConfig = createBattleConfig();
    const { records } = recordSimulations();

    decideAIAction(
      bot, opponent, state.team1, state.team2, state.weather,
      realConfig.moveLimitEnabled, undefined, false, false, state, false, false, 1, realConfig,
    );

    // Golpe condicional contra uma ação de ataque: acerta o adversário.
    const againstAttack = records.find(record => isMoveAction(record.p1Action, 'sucker-punch') && isMoveAction(record.p2Action, 'ataque-oponente'));
    // Golpe condicional contra uma ação de status: falha e não causa dano.
    const againstStatus = records.find(record => isMoveAction(record.p1Action, 'sucker-punch') && isMoveAction(record.p2Action, 'status-oponente'));

    expect(againstAttack).toBeDefined();
    expect(againstStatus).toBeDefined();
    expect(againstAttack!.finalState.currentPokemon2!.hp).toBeLessThan(400);
    expect(againstStatus!.finalState.currentPokemon2!.hp).toBe(400);
    // Sem o defenderAction do adversário, os dois cenários seriam idênticos.
    expect(againstAttack!.finalState.currentPokemon2!.hp).not.toBe(againstStatus!.finalState.currentPokemon2!.hp);
  });

  it('consome o item do inventário e aplica o efeito uma única vez, sem tocar o estado real', () => {
    const bot = createPokemon({
      id: 9301,
      name: 'Bot P2',
      hp: 50,
      maxHP: 400,
      attackStat: 150,
      speedStat: 150,
      moves: [createMove({ name: 'golpe-bot', power: 90, uses: 5, maxUses: 5 })],
    });
    const opponent = createPokemon({
      id: 9302,
      name: 'Oponente P1',
      hp: 400,
      maxHP: 400,
      attackStat: 100,
      speedStat: 60,
      moves: [createMove({ name: 'tapa-oponente', power: 30, uses: 5, maxUses: 5 })],
    });
    const reserve = createPokemon({
      id: 9303,
      name: 'Reserva P1',
      hp: 400,
      maxHP: 400,
      speedStat: 40,
      moves: [createMove({ name: 'golpe-reserva', power: 30, uses: 5, maxUses: 5 })],
    });
    const state = createBattleState([opponent, reserve], [bot]);
    state.prngState = createBattlePRNGState(9504);
    state.p2Inventory = createPlayerInventory({ items: [{ id: 'potion', quantity: 2 }] });
    const snapshot = structuredClone(state);
    const config = createBattleConfig();

    const itemAction: Action = {
      type: 'item',
      data: { itemId: 'potion', targetId: bot.id, targetInstanceId: bot.instanceId, isGive: false },
      user: bot,
      playerNum: 2,
      tieBreaker: 0,
    };
    // O oponente apenas troca: nenhum dano contamina a cura esperada.
    const oppAction: Action = {
      type: 'switch',
      data: reserve,
      user: opponent,
      playerNum: 1,
      priority: 6,
      tieBreaker: 0,
    };

    const finalState = simulateTurn(state, itemAction, oppAction, 2, config);

    // Poção cura 20 PV uma única vez (50 + 20).
    expect(finalState.currentPokemon2!.hp).toBe(70);
    expect(finalState.p2Inventory.items).toEqual([{ id: 'potion', quantity: 1 }]);
    // A troca adversária aconteceu no mesmo turno, com um único encerramento.
    expect(finalState.currentPokemon1!.instanceId).toBe(reserve.instanceId);
    expect(finalState.turn).toBe(state.turn + 1);

    expect(state).toEqual(snapshot);
    expect(state.p2Inventory.items[0].quantity).toBe(2);
    expect(bot.hp).toBe(50);
  });

  it('resolve a troca voluntária e conclui a avaliação com um único turnEnd', () => {
    const bot = createPokemon({
      id: 9401,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 150,
      speedStat: 150,
      moves: [createMove({ name: 'golpe-bot', power: 90, uses: 5, maxUses: 5 })],
    });
    const reserve = createPokemon({
      id: 9402,
      name: 'Reserva P1',
      hp: 400,
      maxHP: 400,
      attackStat: 120,
      speedStat: 80,
      moves: [createMove({ name: 'golpe-reserva', power: 80, uses: 5, maxUses: 5 })],
    });
    const opponent = createOpponent(9403, 'Oponente P2');
    const state = createBattleState([bot, reserve], [opponent]);
    state.prngState = createBattlePRNGState(9505);
    const config = createBattleConfig();

    const switchAction: Action = {
      type: 'switch',
      data: reserve,
      user: bot,
      playerNum: 1,
      priority: 6,
      tieBreaker: 0,
    };

    const finalState = simulateTurn(state, switchAction, moveAction(opponent, opponent.moves[0], 2), 1, config);

    expect(finalState.currentPokemon1!.instanceId).toBe(reserve.instanceId);
    expect(finalState.team1[1].instanceId).toBe(reserve.instanceId);
    // A troca entrou antes e levou o golpe adversário.
    expect(finalState.currentPokemon1!.hp).toBeLessThan(400);
    expect(finalState.currentPokemon1!.hp).toBeGreaterThan(0);
    expect(finalState.currentPokemon2!.hp).toBe(400);
    expect(finalState.currentPokemon2!.moves[0].uses).toBe(4);
    expect(finalState.turn).toBe(state.turn + 1);
    expect(state.turn).toBe(1);
    expect(state.currentPokemon1).toBe(bot);
  });

  it('escolhe o reserva de forma determinística após o desmaio e conclui a avaliação', () => {
    const bot = createPokemon({
      id: 9501,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 220,
      speedStat: 200,
      moves: [createMove({ name: 'golpe-ko', power: 250, uses: 5, maxUses: 5 })],
    });
    const fainted = createPokemon({
      id: 9502,
      name: 'Oponente frágil',
      hp: 30,
      maxHP: 400,
      defenseStat: 50,
      speedStat: 40,
      moves: [createMove({ name: 'tapa-oponente', power: 30, uses: 5, maxUses: 5 })],
    });
    const reserveA = createPokemon({
      id: 9503,
      name: 'Reserva A',
      hp: 300,
      maxHP: 400,
      defenseStat: 120,
      speedStat: 60,
      moves: [createMove({ name: 'golpe-a', power: 70, uses: 5, maxUses: 5 })],
    });
    const reserveB = createPokemon({
      id: 9504,
      name: 'Reserva B',
      hp: 300,
      maxHP: 400,
      defenseStat: 120,
      speedStat: 60,
      moves: [createMove({ name: 'golpe-b', power: 70, uses: 5, maxUses: 5 })],
    });
    const state = createBattleState([bot], [fainted, reserveA, reserveB]);
    state.prngState = createBattlePRNGState(9506);
    const config = createBattleConfig();

    const finalState = simulateTurn(state, moveAction(bot, bot.moves[0], 1), moveAction(fainted, fainted.moves[0], 2), 1, config);
    const again = simulateTurn(state, moveAction(bot, bot.moves[0], 1), moveAction(fainted, fainted.moves[0], 2), 1, config);

    // Sem UI e sem deadlock: o reserva entra e o turno termina uma única vez.
    expect(finalState.team2[0].isFainted).toBe(true);
    expect(finalState.currentPokemon2!.isFainted).toBe(false);
    expect([reserveA.instanceId, reserveB.instanceId]).toContain(finalState.currentPokemon2!.instanceId);
    expect(finalState.currentPokemon2!.instanceId).toBe(finalState.team2.find(p => !p.isFainted)!.instanceId);
    expect(finalState.turn).toBe(state.turn + 1);
    expect(again).toEqual(finalState);
    expect(state.currentPokemon2).toBe(fainted);
    expect(state.turn).toBe(1);
  });

  it('consome a troca forçada da simulação com o reserva determinístico, sem deixar o generator suspenso', () => {
    const bot = createPokemon({
      id: 9601,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      attackStat: 150,
      speedStat: 150,
      moves: [
        createMove({ name: 'u-turn', type: 'bug', power: 70, effect: { status: 'switch-self', chance: 100 }, uses: 5, maxUses: 5 }),
        createMove({ name: 'golpe-bot', power: 90, uses: 5, maxUses: 5 }),
      ],
    });
    const reserve = createPokemon({
      id: 9602,
      name: 'Reserva P1',
      hp: 400,
      maxHP: 400,
      attackStat: 130,
      defenseStat: 130,
      speedStat: 90,
      moves: [createMove({ name: 'golpe-reserva', power: 80, uses: 5, maxUses: 5 })],
    });
    const opponent = createOpponent(9603, 'Oponente P2');
    const state = createBattleState([bot, reserve], [opponent]);
    state.prngState = createBattlePRNGState(9507);
    const realConfig = createBattleConfig();
    const { records } = recordSimulations();

    decideAIAction(
      bot, opponent, state.team1, state.team2, state.weather,
      realConfig.moveLimitEnabled, undefined, false, false, state, false, false, 1, realConfig,
    );

    const uturn = records.find(record => isMoveAction(record.p1Action, 'u-turn'));
    expect(uturn).toBeDefined();

    const forcedIndex = uturn!.steps.findIndex(step => step.phase === 'switch-forced');
    expect(forcedIndex).toBeGreaterThan(-1);
    expect(uturn!.steps[forcedIndex].switchPrompt).toEqual({ player: 1, isBatonPass: false, canCancel: false });

    const resume = uturn!.resumptions[forcedIndex];
    expect(resume?.type).toBe('switch');
    expect(resume!.playerNum).toBe(1);
    expect(resume!.data.instanceId).toBe(reserve.instanceId);
    // A escolha retomou o mesmo turno e ele terminou uma única vez.
    expect(phaseCount(uturn!, 'after-action')).toBeGreaterThan(1);
    expect(phaseCount(uturn!, 'turn-end')).toBe(1);
    expect(uturn!.finalState.currentPokemon1!.instanceId).toBe(reserve.instanceId);
    expect(uturn!.finalState.turn).toBe(state.turn + 1);
  });

  it('aplica dano, PP e turnEnd uma única vez, igual ao turno real do coordenador', () => {
    const bot = createBot(9701, 'Bot P1');
    const opponent = createOpponent(9702, 'Oponente P2');
    const state = createBattleState([bot], [opponent]);
    state.prngState = createBattlePRNGState(9508);
    const realConfig = createBattleConfig({ weatherEnabled: false, terrainEnabled: false });
    const { records } = recordSimulations();

    const action = decideAIAction(
      bot, opponent, state.team1, state.team2, state.weather,
      realConfig.moveLimitEnabled, undefined, false, false, state, false, false, 1, realConfig,
    );

    const record = records.find(candidate => isMoveAction(candidate.p1Action, action.data.name) && candidate.p2Action?.type === 'move');
    expect(record).toBeDefined();

    const botMove = record!.finalState.currentPokemon1!.moves.find(move => move.name === record!.p1Action!.data.name)!;
    expect(botMove.uses).toBe(4);
    expect(record!.finalState.currentPokemon2!.moves[0].uses).toBe(4);
    expect(phaseCount(record!, 'turn-end')).toBe(1);
    expect(record!.finalState.turn).toBe(state.turn + 1);

    // O estado avaliado é exatamente o de um turno real com as mesmas duas ações.
    const real = runCoordinatorTurn({
      seed: state.prngState!.seed,
      initialState: state,
      p1Action: record!.p1Action,
      p2Action: record!.p2Action,
      config: record!.config,
      preservePrngState: true,
    });

    expect(real.completed).toBe(true);
    expect(record!.finalState).toEqual(real.finalState);
  });

  it('aplica os hazards de entrada uma única vez na troca simulada', () => {
    const bot = createPokemon({
      id: 9711,
      name: 'Bot P1',
      hp: 400,
      maxHP: 400,
      speedStat: 150,
      moves: [createMove({ name: 'golpe-bot', power: 90, uses: 5, maxUses: 5 })],
    });
    const reserve = createPokemon({
      id: 9712,
      name: 'Reserva P1',
      hp: 400,
      maxHP: 400,
      types: ['fire'],
      speedStat: 80,
      moves: [createMove({ name: 'golpe-reserva', power: 80, uses: 5, maxUses: 5 })],
    });
    const opponent = createOpponent(9713, 'Oponente P2');
    const state = createBattleState([bot, reserve], [opponent], {
      p1Hazards: createSideHazards({ stealthRock: true, spikes: 1 }),
    });
    state.prngState = createBattlePRNGState(9512);
    const config = createBattleConfig({ weatherEnabled: false, terrainEnabled: false });

    const switchAction: Action = { type: 'switch', data: reserve, user: bot, playerNum: 1, priority: 6, tieBreaker: 0 };
    const oppAction = moveAction(opponent, opponent.moves[0], 2);

    const sim = simulateTurn(state, switchAction, oppAction, 1, config);
    const real = runCoordinatorTurn({
      seed: state.prngState!.seed,
      initialState: state,
      p1Action: switchAction,
      p2Action: oppAction,
      config,
      preservePrngState: true,
    });

    // Pedra Pontiaguda + Espinhos entram uma única vez, antes do golpe adversário.
    expect(sim.currentPokemon1!.instanceId).toBe(reserve.instanceId);
    expect(sim.currentPokemon1!.hp).toBeLessThan(400);
    expect(sim.p1Hazards.stealthRock).toBe(true);
    expect(sim.p1Hazards.spikes).toBe(1);
    expect(sim).toEqual(real.finalState);
    expect(state.p1Hazards.stealthRock).toBe(true);
    expect(state.currentPokemon1).toBe(bot);
  });

  it('continua escolhendo o golpe mais forte nos dois lados pela simulação unificada', () => {
    const strongForP1 = createBattleState(
      [createBot(9801, 'Bot P1')],
      [createOpponent(9802, 'Oponente P2')],
    );
    strongForP1.prngState = createBattlePRNGState(9509);
    const p1Config = createBattleConfig();
    const p1Records = recordSimulations();
    const p1Action = decideAIAction(
      strongForP1.team1[0], strongForP1.team2[0], strongForP1.team1, strongForP1.team2, strongForP1.weather,
      p1Config.moveLimitEnabled, undefined, false, false, strongForP1, false, false, 1, p1Config,
    );

    expect(p1Action.playerNum).toBe(1);
    expect(p1Action.data.name).toBe('golpe-forte-bot');
    expect(p1Records.records.length).toBe(2);
    expect(p1Records.records.every(record => record.p1Action?.playerNum === 1 && record.p2Action?.playerNum === 2)).toBe(true);
    p1Records.spy.mockRestore();

    const strongForP2 = createBattleState(
      [createOpponent(9803, 'Oponente P1')],
      [createBot(9804, 'Bot P2')],
    );
    strongForP2.prngState = createBattlePRNGState(9510);
    const p2Config = createBattleConfig();
    const p2Records = recordSimulations();
    const p2Action = decideAIAction(
      strongForP2.team2[0], strongForP2.team1[0], strongForP2.team2, strongForP2.team1, strongForP2.weather,
      p2Config.moveLimitEnabled, undefined, false, false, strongForP2, false, false, 2, p2Config,
    );

    expect(p2Action.playerNum).toBe(2);
    expect(p2Action.data.name).toBe('golpe-forte-bot');
    expect(p2Records.records.length).toBe(2);
    expect(p2Records.records.every(record => record.p1Action?.playerNum === 1 && record.p2Action?.playerNum === 2)).toBe(true);
  });

  it('preserva o estado real e o cursor, com fork por simulação e decisão determinística', () => {
    const bot = createBot(9901, 'Bot P1');
    const opponent = createOpponent(9902, 'Oponente P2');
    const state = createBattleState([bot], [opponent]);
    state.prngState = createBattlePRNGState(9511);
    const snapshot = structuredClone(state);
    const cursor = state.prngState!.cursor;
    const realConfig = createBattleConfig();
    const { records } = recordSimulations();

    const decide = () => decideAIAction(
      bot, opponent, state.team1, state.team2, state.weather,
      realConfig.moveLimitEnabled, undefined, false, false, state, false, false, 1, realConfig,
    );

    const first = decide();

    expect(state).toEqual(snapshot);
    expect(state.prngState!.cursor).toBe(cursor);
    expect(records.length).toBe(2);
    for (const record of records) {
      // Cada simulação parte de um clone com fork no cursor real, nunca do estado real.
      expect(record.state).not.toBe(state);
      expect(record.state.prngState!.cursor).toBe(cursor);
      expect(record.finalState.prngState!.cursor).toBeGreaterThan(cursor);
      expect(record.state.currentPokemon1).not.toBe(state.currentPokemon1);
    }

    const second = decide();

    expect(second).toEqual(first);
    expect(state).toEqual(snapshot);
    expect(state.prngState!.cursor).toBe(cursor);
  });
});
