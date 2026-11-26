import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReplayPlayer from '../../components/ReplayPlayer';
import * as AiLogic from '../../services/aiLogic';
import { decideLLMAction } from '../../services/llmAiLogic';
import { BattleCoordinator } from '../../services/engine/coordinator';
import * as BattleEngine from '../../services/engine';
import * as Effects from '../../services/effectHandlers';
import {
  appendReplayCheckpoint,
  createBattleReplay,
  createBattleReplayEvent,
  createReplayCheckpoint,
  REPLAY_FORMAT_VERSION,
} from '../../services/replayLogic';
import type { Action, BattleReplay, BattleState } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';

vi.mock('../../components/PokemonCard', () => ({ PokemonCard: () => null }));
vi.mock('../../components/BattleLayout', () => ({ BattleHeader: () => null }));
vi.mock('../../services/animation/turnAnimator', () => ({
  TurnAnimator: { processStep: vi.fn(async () => {}) },
}));

interface CoordinatorCapture {
  p1Action?: Action;
  p2Action?: Action;
  snapshots: BattleState[];
}

interface LiveReplayFixture {
  live: ReturnType<typeof runCoordinatorTurn>;
  liveP1Action: Action;
  liveP2Action: Action;
  replay: BattleReplay;
}

const withoutLogs = (state: BattleState): BattleState => {
  const normalized = JSON.parse(JSON.stringify(state)) as BattleState;
  normalized.logs = [];
  return normalized;
};

const createLiveReplayFixture = async (mode: 'local' | 'llm'): Promise<LiveReplayFixture> => {
  const p1 = createPokemon({
    id: 101,
    name: 'Manual ao Vivo',
    hp: 400,
    maxHP: 400,
    speedStat: 90,
    moves: [
      createMove({ name: 'manual-move', power: 40, uses: 10, maxUses: 10 }),
      createMove({ name: 'alternate-manual-move', power: 95, uses: 10, maxUses: 10 }),
    ],
  });
  const p2 = createPokemon({
    id: 201,
    name: mode === 'llm' ? 'LLM ao Vivo' : 'IA Local ao Vivo',
    hp: 400,
    maxHP: 400,
    speedStat: 140,
    moves: [
      createMove({ name: 'first-ai-move', power: 40, uses: 10, maxUses: 10 }),
      createMove({ name: 'recorded-ai-move', power: 80, uses: 10, maxUses: 10 }),
    ],
  });
  const config = createBattleConfig({
    opponentMode: 'auto',
    useLLM: mode === 'llm',
    itemsEnabled: false,
    terastallizationEnabled: mode === 'llm',
    forceAccuracyOutcome: 'hit',
    fixedRoll: 1,
  });
  const initialState = createBattleState([p1], [p2], {
    p1Inventory: { items: [] },
    p2Inventory: { items: [] },
    p1TeraUsed: false,
    p2TeraUsed: false,
    p1MegaUsed: false,
    p2MegaUsed: false,
  });
  const liveP1Action: Action = {
    type: 'move',
    data: p1.moves[0],
    user: p1,
    playerNum: 1,
    priority: p1.moves[0].priority ?? 0,
  };

  let liveP2Action: Action;
  if (mode === 'llm') {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({
      result: JSON.stringify({
        type: 'move',
        data: { name: 'recorded-ai-move' },
        shouldTerastallize: true,
        shouldMegaEvolve: false,
      }),
    }), { status: 200 }));
    liveP2Action = await decideLLMAction(
      p2,
      p1,
      initialState.team2,
      initialState.team1,
      initialState.weather,
      config.moveLimitEnabled,
      undefined,
      config.terastallizationEnabled,
      false,
      initialState,
      false,
      false,
      'openrouter',
      'modelo-local',
    );
  } else {
    liveP2Action = AiLogic.decideAIAction(
      p2,
      p1,
      initialState.team2,
      initialState.team1,
      initialState.weather,
      config.moveLimitEnabled,
      undefined,
      false,
      false,
      initialState,
      false,
      false,
    );
  }

  const replay: BattleReplay = {
    initialState: {
      team1: structuredClone(initialState.team1),
      team2: structuredClone(initialState.team2),
      p1Inventory: structuredClone(initialState.p1Inventory),
      p2Inventory: structuredClone(initialState.p2Inventory),
      config: structuredClone(config),
    },
    seed: 3101,
    events: [
      createBattleReplayEvent({
        turn: 1,
        player: 1,
        type: liveP1Action.type,
        data: liveP1Action.data,
        user: liveP1Action.user,
      }),
      createBattleReplayEvent({
        turn: 1,
        player: 2,
        type: liveP2Action.type,
        data: liveP2Action.data,
        user: liveP2Action.user,
        shouldTerastallize: liveP2Action.shouldTerastallize,
        shouldMegaEvolve: liveP2Action.shouldMegaEvolve,
      }),
    ],
  };
  const live = runCoordinatorTurn({
    seed: replay.seed,
    initialState,
    p1Action: liveP1Action,
    p2Action: liveP2Action,
    config,
  });
  return { live, liveP1Action, liveP2Action, replay };
};

const createVersionedReplay = (fixture: LiveReplayFixture): BattleReplay => {
  const initialState = createBattleState(
    structuredClone(fixture.replay.initialState.team1),
    structuredClone(fixture.replay.initialState.team2),
    {
      p1Inventory: structuredClone(fixture.replay.initialState.p1Inventory),
      p2Inventory: structuredClone(fixture.replay.initialState.p2Inventory),
      p1TeraUsed: false,
      p2TeraUsed: false,
      p1MegaUsed: false,
      p2MegaUsed: false,
      prngState: createBattlePRNGState(fixture.replay.seed),
    },
  );
  const replay = createBattleReplay(
    initialState,
    structuredClone(fixture.replay.initialState.config),
    fixture.replay.seed,
  );
  return appendReplayCheckpoint(
    { ...replay, events: structuredClone(fixture.replay.events) },
    1,
    fixture.live.finalState,
  );
};

describe('reprodução exclusivamente por decisões gravadas', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  let captures: CoordinatorCapture[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('Rede proibida durante o replay');
    }));
    captures = [];
    const originalRunTurn = BattleCoordinator.runTurn;
    vi.spyOn(BattleCoordinator, 'runTurn').mockImplementation((state, p1Action, p2Action, config) => {
      const capture: CoordinatorCapture = { p1Action, p2Action, snapshots: [] };
      captures.push(capture);
      const generator = originalRunTurn(state, p1Action, p2Action, config);
      const originalNext = generator.next.bind(generator);
      generator.next = ((...args: Parameters<typeof generator.next>) => {
        const result = originalNext(...args);
        if (!result.done) capture.snapshots.push(result.value.state);
        return result;
      }) as typeof generator.next;
      return generator;
    });
  });

  afterEach(async () => {
    if (renderer) {
      await act(async () => renderer.unmount());
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const clickNext = async () => {
    const nextButton = renderer.root.findAllByType('button')
      .find(button => button.children.join('').includes('Próximo'));
    const messages = renderer.root.findAllByType('p').map(node => node.children.join('')).join(' | ');
    expect(nextButton, messages).toBeDefined();
    await act(async () => {
      nextButton!.props.onClick();
      await Promise.resolve();
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
  };

  const loadReplay = async (replay: BattleReplay) => {
    captures = [];
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ReplayPlayer, { onClose: () => {} }));
    });
    const fileInput = renderer.root.findByProps({ type: 'file' });
    await act(async () => {
      await fileInput.props.onChange({
        target: { files: [{ text: async () => JSON.stringify(replay) }] },
      });
    });
  };

  const playReplay = async (replay: BattleReplay, expectTurn = true): Promise<CoordinatorCapture> => {
    await loadReplay(replay);
    await clickNext();
    if (expectTurn) expect(captures).toHaveLength(1);
    return captures[0]!;
  };

  it('3.1: reproduz replay com LLM sem IA local nem fetch e preserva o desfecho ao vivo', async () => {
    const fixture = await createLiveReplayFixture('llm');
    vi.mocked(fetch).mockClear();
    const localAiSpy = vi.spyOn(AiLogic, 'decideAIAction');

    const replay = await playReplay(fixture.replay);

    expect(localAiSpy).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(replay.p1Action).toMatchObject({ playerNum: 1, type: 'move' });
    expect(replay.p2Action).toMatchObject({
      playerNum: 2,
      type: 'move',
      shouldTerastallize: true,
      shouldMegaEvolve: false,
    });
    expect(replay.p1Action?.data.name).toBe(fixture.liveP1Action.data.name);
    expect(replay.p2Action?.data.name).toBe(fixture.liveP2Action.data.name);
    expect(replay.snapshots.map(withoutLogs)).toEqual(fixture.live.stateSnapshots.map(withoutLogs));
    expect(withoutLogs(replay.snapshots.at(-1)!)).toEqual(withoutLogs(fixture.live.finalState));
    expect(replay.snapshots.at(-1)?.prngState).toEqual(fixture.live.finalState.prngState);
  });

  it('reproduz a decisão da IA local com as mesmas ações, snapshots, cursor e estado final', async () => {
    const fixture = await createLiveReplayFixture('local');
    const localAiSpy = vi.spyOn(AiLogic, 'decideAIAction');

    const replay = await playReplay(fixture.replay);

    expect(localAiSpy).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(replay.p1Action?.data.name).toBe(fixture.liveP1Action.data.name);
    expect(replay.p2Action?.data.name).toBe(fixture.liveP2Action.data.name);
    expect(replay.snapshots.map(withoutLogs)).toEqual(fixture.live.stateSnapshots.map(withoutLogs));
    expect(withoutLogs(replay.snapshots.at(-1)!)).toEqual(withoutLogs(fixture.live.finalState));
    expect(replay.snapshots.at(-1)?.prngState).toEqual(fixture.live.finalState.prngState);
  });

  it('rejeita replay antigo sem uma decisão necessária, sem IA, fetch ou ação inventada', async () => {
    const fixture = await createLiveReplayFixture('local');
    const localAiSpy = vi.spyOn(AiLogic, 'decideAIAction');
    const oldReplay: BattleReplay = {
      ...fixture.replay,
      events: fixture.replay.events.filter(event => event.actorId === 1),
    };

    await playReplay(oldReplay, false);

    expect(localAiSpy).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(captures).toHaveLength(0);
    const alert = renderer.root.findByProps({ role: 'alert' });
    expect(alert.children.join('')).toContain('Replay incompatível');
    expect(alert.children.join('')).toContain('Jogador 2');
    expect(alert.children.join('')).toContain('turno 1');
  });

  it('retoma a troca forçada gravada no mesmo generator e reproduz o turno ao vivo', async () => {
    const attacker = createPokemon({
      id: 111,
      name: 'U-turn ao Vivo',
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
    const reserve = createPokemon({ id: 112, name: 'Reserva Gravada', hp: 400, maxHP: 400 });
    const defender = createPokemon({
      id: 211,
      name: 'Oponente da Troca',
      hp: 500,
      maxHP: 500,
      speedStat: 100,
      moves: [createMove({ name: 'opponent-move', power: 50, uses: 12, maxUses: 12 })],
    });
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
    const initialState = createBattleState([attacker, reserve], [defender], {
      p1TeraUsed: false,
      p2TeraUsed: false,
      p1MegaUsed: false,
      p2MegaUsed: false,
      prngState: createBattlePRNGState(3102),
    });
    const p1Action: Action = { type: 'move', data: attacker.moves[0], user: attacker, playerNum: 1, priority: 0 };
    const p2Action: Action = { type: 'move', data: defender.moves[0], user: defender, playerNum: 2, priority: 0 };
    const forcedAction: Action = { type: 'switch', data: reserve, user: attacker, playerNum: 1, priority: 6 };
    const live = runCoordinatorTurn({
      seed: 3102,
      initialState,
      p1Action,
      p2Action,
      config,
      chooseForcedSwitch: () => forcedAction,
    });
    const replayData = appendReplayCheckpoint({
      ...createBattleReplay(initialState, config, 3102),
      events: [
        createBattleReplayEvent({ turn: 1, player: 1, type: 'move', data: attacker.moves[0], user: attacker }),
        createBattleReplayEvent({ turn: 1, player: 2, type: 'move', data: defender.moves[0], user: defender }),
        createBattleReplayEvent({ turn: 1, player: 1, type: 'switch', data: reserve, user: attacker, isForcedSwitch: true }),
      ],
    }, 1, live.finalState);

    const replay = await playReplay(replayData);

    expect(fetch).not.toHaveBeenCalled();
    expect(replay.snapshots.map(withoutLogs)).toEqual(live.stateSnapshots.map(withoutLogs));
    expect(replay.snapshots.at(-1)?.prngState).toEqual(live.finalState.prngState);
    expect(replay.snapshots.at(-1)?.turn).toBe(2);
    expect(replay.snapshots.at(-1)?.currentPokemon1?.instanceId).toBe(reserve.instanceId);
  });

  it('aplica troca por desmaio como único evento do turno sem executar outro turno', async () => {
    const attacker = createPokemon({
      id: 121,
      name: 'Atacante do Desmaio',
      hp: 400,
      maxHP: 400,
      attackStat: 400,
      speedStat: 200,
      moves: [createMove({ name: 'knockout-move', power: 500, uses: 10, maxUses: 10 })],
    });
    const defeated = createPokemon({
      id: 221,
      name: 'Titular Desmaiado',
      hp: 30,
      maxHP: 30,
      defenseStat: 1,
      speedStat: 100,
      moves: [createMove({ name: 'defeated-move' })],
    });
    const reserve = createPokemon({ id: 222, name: 'Reserva Pós-Desmaio', hp: 300, maxHP: 300 });
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
    const initialState = createBattleState([attacker], [defeated, reserve], {
      p1TeraUsed: false,
      p2TeraUsed: false,
      p1MegaUsed: false,
      p2MegaUsed: false,
      prngState: createBattlePRNGState(3103),
    });
    const p1Action: Action = { type: 'move', data: attacker.moves[0], user: attacker, playerNum: 1, priority: 0 };
    const p2Action: Action = { type: 'move', data: defeated.moves[0], user: defeated, playerNum: 2, priority: 0 };
    const live = runCoordinatorTurn({ seed: 3103, initialState, p1Action, p2Action, config });
    expect(live.finalState.turn).toBe(2);
    expect(live.finalState.currentPokemon2?.isFainted).toBe(true);
    const liveSwitch = BattleEngine.performSwitch(live.finalState, live.finalState.team2[1], 2, config.weatherEnabled);
    const liveFinal = { ...liveSwitch.newState, waitingForAction: false };
    const replayData = appendReplayCheckpoint({
      ...createBattleReplay(initialState, config, 3103),
      events: [
        createBattleReplayEvent({ turn: 1, player: 1, type: 'move', data: attacker.moves[0], user: attacker }),
        createBattleReplayEvent({ turn: 1, player: 2, type: 'move', data: defeated.moves[0], user: defeated }),
        createBattleReplayEvent({ turn: 2, player: 2, type: 'switch', data: reserve, user: defeated, isForcedSwitch: true }),
      ],
    }, 1, live.finalState);

    const firstTurn = await playReplay(replayData);
    expect(firstTurn.snapshots.map(withoutLogs)).toEqual(live.stateSnapshots.map(withoutLogs));
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);

    captures = [];
    const switchSpy = vi.spyOn(BattleEngine, 'performSwitch');
    await clickNext();

    expect(switchSpy).toHaveBeenCalledTimes(1);
    expect(captures).toHaveLength(0);
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    const replayFinal = switchSpy.mock.results[0].value.newState as BattleState;
    expect(withoutLogs(replayFinal)).toEqual(withoutLogs(liveFinal));
    expect(replayFinal.turn).toBe(2);
    expect(replayFinal.currentPokemon2?.instanceId).toBe(reserve.instanceId);
    expect(replayFinal.prngState).toEqual(liveFinal.prngState);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('hotfix: reproduz troca+item e o turno seguinte validando hash e cursor em cada checkpoint', async () => {
    const seed = 570857;
    const outgoing = createPokemon({
      id: 101, name: 'Titular Previsor', ability: 'forewarn', hp: 400, maxHP: 400,
      moves: [createMove({ name: 'outgoing-move' })],
    });
    const reserve = createPokemon({
      id: 102, name: 'Reserva da Troca', hp: 400, maxHP: 400,
      moves: [createMove({ name: 'reserve-move', power: 35, uses: 10, maxUses: 10 })],
    });
    const opponent = createPokemon({
      id: 201, name: 'Aerodactyl Previsor', ability: 'forewarn', hp: 400, maxHP: 400,
      moves: [createMove({ name: 'aerodactyl-move', power: 30, uses: 10, maxUses: 10 })],
    });
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
    const initialState = createBattleState([outgoing, reserve], [opponent], {
      prngState: createBattlePRNGState(seed),
      p1TeraUsed: false,
      p2TeraUsed: false,
      p1MegaUsed: false,
      p2MegaUsed: false,
      p2Inventory: { items: [{ id: 'aerodactylite', quantity: 1 }] },
    });
    let replayData = createBattleReplay(initialState, config, seed);
    const entryLogs: BattleState['logs'] = [];
    Effects.handleEntryAbilities(initialState.currentPokemon1!, initialState.currentPokemon2, false, entryLogs, initialState);
    Effects.handleEntryAbilities(initialState.currentPokemon2!, initialState.currentPokemon1, false, entryLogs, initialState);
    expect(initialState.prngState?.cursor).toBe(2);
    // A hidratação termina antes das ações, mas depois da criação do replay inicial.
    initialState.currentPokemon2!.megaProfile = {
      name: 'Mega Aerodactyl',
      stats: { hp: 80, attack: 135, defense: 85, spAttack: 70, spDefense: 95, speed: 150 },
      ability: 'tough-claws',
      types: ['rock', 'flying'],
      spriteUrl: 'mega-aerodactyl.png',
      backSpriteUrl: 'mega-aerodactyl-back.png',
      pixelSpriteUrl: 'mega-aerodactyl-pixel.png',
      weight: 790,
    };

    const firstP1Action: Action = { type: 'switch', data: reserve, user: outgoing, playerNum: 1, priority: 6 };
    const firstP2Action: Action = {
      type: 'item',
      data: {
        itemId: 'aerodactylite', targetId: opponent.id, targetInstanceId: opponent.instanceId, isGive: false,
      },
      user: opponent,
      playerNum: 2,
      priority: 6,
    };
    const firstTurn = runCoordinatorTurn({
      seed, initialState, p1Action: firstP1Action, p2Action: firstP2Action, config, preservePrngState: true,
    });
    expect(firstTurn.finalState.prngState).toEqual({ seed, state: 3031866813, cursor: 4 });
    replayData = appendReplayCheckpoint({
      ...replayData,
      events: [
        createBattleReplayEvent({ turn: 1, player: 1, type: 'switch', data: reserve, user: outgoing }),
        createBattleReplayEvent({
          turn: 1, player: 2, type: 'item', data: firstP2Action.data, user: opponent,
        }),
      ],
    }, 1, firstTurn.finalState);

    const secondP1 = firstTurn.finalState.currentPokemon1!;
    const secondP2 = firstTurn.finalState.currentPokemon2!;
    const secondTurn = runCoordinatorTurn({
      seed,
      initialState: firstTurn.finalState,
      p1Action: { type: 'move', data: secondP1.moves[0], user: secondP1, playerNum: 1, priority: 0 },
      p2Action: { type: 'move', data: secondP2.moves[0], user: secondP2, playerNum: 2, priority: 0 },
      config,
      preservePrngState: true,
    });
    replayData = appendReplayCheckpoint({
      ...replayData,
      events: [
        ...replayData.events,
        createBattleReplayEvent({ turn: 2, player: 1, type: 'move', data: secondP1.moves[0], user: secondP1 }),
        createBattleReplayEvent({ turn: 2, player: 2, type: 'move', data: secondP2.moves[0], user: secondP2 }),
      ],
    }, 2, secondTurn.finalState);
    expect(replayData.checkpoints?.[0]?.megaProfiles).toBeUndefined();
    expect(replayData.checkpoints?.[1]?.megaProfiles?.['p2-slot-0']?.stats.attack).toBe(135);

    await loadReplay(replayData);
    await clickNext();

    expect(captures).toHaveLength(1);
    expect(captures[0]!.snapshots.at(-1)?.prngState).toEqual(replayData.checkpoints?.[1]?.prngState);
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    const firstTurnLabels = renderer.root.findAllByType('h3').map(node => node.children.join(''));
    expect(firstTurnLabels).toContain('⚔️ Ações do Turno 1');

    await clickNext();

    expect(captures).toHaveLength(2);
    expect(captures[1]!.snapshots.at(-1)?.prngState).toEqual(replayData.checkpoints?.[2]?.prngState);
    expect(captures[1]!.snapshots.map(withoutLogs)).toEqual(secondTurn.stateSnapshots.map(withoutLogs));
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(renderer.root.findAllByType('div').map(node => node.children.join('')).join(' ')).toContain('Turno: 2 / 2');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('hotfix: valida o checkpoint do turno terminal sem executar ações adicionais', async () => {
    const attacker = createPokemon({
      id: 131, name: 'Atacante Terminal', hp: 300, maxHP: 300, attackStat: 500, speedStat: 200,
      moves: [createMove({ name: 'terminal-move', power: 500, uses: 10, maxUses: 10 })],
    });
    const defender = createPokemon({
      id: 231, name: 'Defensor Terminal', hp: 1, maxHP: 300, defenseStat: 1, speedStat: 100,
      moves: [createMove({ name: 'terminal-response' })],
    });
    const seed = 3150;
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
    const initialState = createBattleState([attacker], [defender], {
      p1TeraUsed: false,
      p2TeraUsed: false,
      p1MegaUsed: false,
      p2MegaUsed: false,
      prngState: createBattlePRNGState(seed),
    });
    const live = runCoordinatorTurn({
      seed,
      initialState,
      p1Action: { type: 'move', data: attacker.moves[0], user: attacker, playerNum: 1, priority: 0 },
      p2Action: { type: 'move', data: defender.moves[0], user: defender, playerNum: 2, priority: 0 },
      config,
    });
    const replayData = appendReplayCheckpoint({
      ...createBattleReplay(initialState, config, seed),
      events: [
        createBattleReplayEvent({ turn: 1, player: 1, type: 'move', data: attacker.moves[0], user: attacker }),
        createBattleReplayEvent({ turn: 1, player: 2, type: 'move', data: defender.moves[0], user: defender }),
      ],
    }, 1, live.finalState);
    expect(live.finalState.winner).toBe(1);
    expect(live.steps.at(-1)?.phase).toBe('game-over');

    const replay = await playReplay(replayData);

    expect(replay.snapshots.at(-1)?.winner).toBe(1);
    expect(replay.snapshots.at(-1)?.prngState).toEqual(replayData.checkpoints?.[1]?.prngState);
    expect(createReplayCheckpoint(1, replay.snapshots.at(-1)!)).toEqual(replayData.checkpoints?.[1]);
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('hotfix: orienta regravação do checkpoint prematuro da 3.2.0 sem alterar o arquivo', async () => {
    const fixture = await createLiveReplayFixture('local');
    const replayData = createVersionedReplay(fixture);
    const stateBeforeTurn = createBattleState(
      structuredClone(replayData.initialState.team1),
      structuredClone(replayData.initialState.team2),
      {
        p1Inventory: structuredClone(replayData.initialState.p1Inventory),
        p2Inventory: structuredClone(replayData.initialState.p2Inventory),
        p1TeraUsed: false,
        p2TeraUsed: false,
        p1MegaUsed: false,
        p2MegaUsed: false,
        prngState: createBattlePRNGState(replayData.seed),
      },
    );
    replayData.engineRevision = '3.2.0';
    replayData.checkpoints = replayData.checkpoints?.map(checkpoint => checkpoint.turn === 1
      ? createReplayCheckpoint(1, stateBeforeTurn)
      : checkpoint);
    const originalJson = JSON.stringify(replayData);

    await playReplay(replayData);

    const alert = renderer.root.findByProps({ role: 'alert' });
    const message = alert.children.join('');
    expect(message).toContain('revisão 3.2.0');
    expect(message).toContain('checkpoint do turno 1 antes das ações');
    expect(message).toContain('Regrave a batalha');
    expect(JSON.stringify(replayData)).toBe(originalJson);
    expect(renderer.root.findAllByType('div').map(node => node.children.join('')).join(' ')).toContain('Turno: 0 / 1');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('3.2: ao vivo e replay produzem o mesmo hash e cursor no turno concluído', async () => {
    const fixture = await createLiveReplayFixture('local');
    const replayData = createVersionedReplay(fixture);

    const replay = await playReplay(replayData);
    const actual = createReplayCheckpoint(1, replay.snapshots.at(-1)!);

    expect(actual).toEqual(replayData.checkpoints?.[1]);
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('3.2: interrompe na primeira ação divergente e informa o turno e os dois hashes', async () => {
    const fixture = await createLiveReplayFixture('local');
    const replayData = createVersionedReplay(fixture);
    replayData.events = replayData.events.map(event => event.actorId === 1
      ? { ...event, moveId: 'alternate-manual-move' }
      : event);

    await playReplay(replayData);

    const alert = renderer.root.findByProps({ role: 'alert' });
    const message = alert.children.join('');
    expect(message).toContain('Divergência de replay no turno 1');
    expect(message).toContain('hash esperado');
    expect(message).toContain('hash obtido');
    expect(message).toContain('Reprodução interrompida');
    expect(renderer.root.findAllByType('div').map(node => node.children.join('')).join(' ')).toContain('Turno: 0 / 1');
    expect(captures).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('3.2: detecta seed adulterada no checkpoint inicial', async () => {
    const fixture = await createLiveReplayFixture('local');
    const replayData = { ...createVersionedReplay(fixture), seed: fixture.replay.seed + 1 };

    await loadReplay(replayData);

    const messages = renderer.root.findAllByType('p').map(node => node.children.join('')).join(' ');
    expect(messages).toContain('Divergência de replay no turno 0');
    expect(captures).toHaveLength(0);
  });

  it('3.2: rejeita uma versão futura já na leitura do arquivo', async () => {
    const fixture = await createLiveReplayFixture('local');
    const replayData = { ...createVersionedReplay(fixture), formatVersion: REPLAY_FORMAT_VERSION + 1 };

    await loadReplay(replayData);

    const messages = renderer.root.findAllByType('p').map(node => node.children.join('')).join(' ');
    expect(messages).toContain(`Versão de replay ${REPLAY_FORMAT_VERSION + 1} não suportada`);
    expect(renderer.root.findAllByProps({ type: 'file' })).toHaveLength(1);
  });

  it('3.2: replay legado completo funciona com aviso explícito de ausência de verificação', async () => {
    const fixture = await createLiveReplayFixture('local');

    await playReplay(fixture.replay);

    const warning = renderer.root.findByProps({ role: 'status' });
    expect(warning.children.join('')).toContain('Replay legado');
    expect(warning.children.join('')).toContain('sem verificação');
    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
  });

  it('3.2: logs e apresentação alterados não produzem falsa divergência', async () => {
    const fixture = await createLiveReplayFixture('local');
    const replayData = createVersionedReplay(fixture);
    replayData.initialState.team1[0].name = 'Nome Visual Alterado';
    replayData.initialState.team1[0].spriteUrl = 'sprite-visual-alterado';
    replayData.initialState.team1[0].moves[0].displayName = 'Apresentação Alterada';
    replayData.initialState.team1[0].moves[0].description = 'Somente apresentação';

    await playReplay(replayData);

    expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('mantém ReplayPlayer e replayLogic sem chamadas a decisões de IA', () => {
    for (const path of ['components/ReplayPlayer.tsx', 'services/replayLogic.ts']) {
      const source = readFileSync(join(process.cwd(), path), 'utf8');
      expect(source, path).not.toMatch(/\bdecide(?:AI|LLM)Action\b/);
    }
  });
});
