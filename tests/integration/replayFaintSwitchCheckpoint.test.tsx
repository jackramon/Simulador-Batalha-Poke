import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReplayPlayer from '../../components/ReplayPlayer';
import * as BattleEngine from '../../services/engine';
import { BattleCoordinator } from '../../services/engine/coordinator';
import * as ReplayLogic from '../../services/replayLogic';
import {
  appendReplayCheckpoint,
  createBattleReplay,
  createBattleReplayEvent,
  hashBattleReplayState,
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

// Fixture derivada do replay real do hotfix 3.2.3 (seed 533665). Somente campos de
// apresentação foram removidos; eventos, checkpoints, hashes e PRNG são os originais.
const FIXTURE_URL = new URL('../fixtures/replay-3.2.2-faint-switch.json', import.meta.url);
const loadRealFixture = (): BattleReplay => JSON.parse(readFileSync(FIXTURE_URL, 'utf8')) as BattleReplay;

interface CoordinatorCapture {
  turn: number;
  initialState: BattleState;
  snapshots: BattleState[];
}

const withoutLogs = (state: BattleState): BattleState => {
  const normalized = JSON.parse(JSON.stringify(state)) as BattleState;
  normalized.logs = [];
  return normalized;
};

describe('hotfix 3.2.3 — checkpoints anteriores às trocas pós-desmaio', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
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
      const capture: CoordinatorCapture = { turn: state.turn, initialState: state, snapshots: [] };
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
      await act(async () => renderer!.unmount());
      renderer = undefined;
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const alerts = () => renderer!.root.findAllByProps({ role: 'alert' })
    .map(node => node.children.join(''));

  const clickNext = async () => {
    const nextButton = renderer!.root.findAllByType('button')
      .find(button => button.children.join('').includes('Próximo'));
    expect(nextButton).toBeDefined();
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
    const fileInput = renderer!.root.findByProps({ type: 'file' });
    await act(async () => {
      await fileInput.props.onChange({
        target: { files: [{ text: async () => JSON.stringify(replay) }] },
      });
    });
  };

  const advanceWithoutDivergence = async (turn: number) => {
    await clickNext();
    expect(alerts(), `divergência ao avançar o turno ${turn}`).toEqual([]);
  };

  it('3.2.3: reproduz a fixture real até 29 validando c816f7ae antes das trocas do turno 22', async () => {
    const replay = loadRealFixture();
    const checkpointSpy = vi.spyOn(ReplayLogic, 'assertReplayCheckpoint');
    const switchSpy = vi.spyOn(BattleEngine, 'performSwitch');
    await loadReplay(replay);

    for (let turn = 1; turn <= 22; turn += 1) {
      await advanceWithoutDivergence(turn);
    }

    const verificationCall = checkpointSpy.mock.calls.find(([, turn]) => turn === 22);
    expect(verificationCall).toBeDefined();
    const verificationState = verificationCall![2];
    expect(hashBattleReplayState(verificationState)).toBe('fnv1a32:c816f7ae');
    expect(verificationState.prngState).toEqual({ seed: 533665, state: 3520630297, cursor: 152 });
    expect(verificationState.currentPokemon1?.name).toBe('Raio Furioso');
    expect(verificationState.currentPokemon2?.name).toBe('Chi-Yu');
    expect(verificationState.currentPokemon2?.isFainted).toBe(true);

    const postSwitchState = switchSpy.mock.results
      .map(result => result.value.newState as BattleState)
      .find(state => state.currentPokemon1?.name === 'Raio Furioso'
        && state.currentPokemon2?.name === 'Groudon Primitivo');
    expect(postSwitchState).toBeDefined();
    expect(hashBattleReplayState(postSwitchState!)).toBe('fnv1a32:92338112');

    await advanceWithoutDivergence(23);
    const turn23 = captures.find(capture => capture.turn === 23);
    expect(turn23).toBeDefined();
    expect(turn23!.initialState.currentPokemon1?.name).toBe('Raio Furioso');
    expect(turn23!.initialState.currentPokemon2?.name).toBe('Groudon Primitivo');
    expect(turn23!.initialState.prngState).toEqual(replay.checkpoints?.[22].prngState);

    for (let turn = 24; turn <= 29; turn += 1) {
      await advanceWithoutDivergence(turn);
    }

    expect(captures.map(capture => capture.turn)).toEqual(Array.from({ length: 29 }, (_, index) => index + 1));
    for (const checkpoint of replay.checkpoints!.filter(entry => entry.turn > 0)) {
      const call = checkpointSpy.mock.calls.find(([, turn]) => turn === checkpoint.turn);
      expect(call, `checkpoint do turno ${checkpoint.turn}`).toBeDefined();
      expect(call![2].prngState, `PRNG do turno ${checkpoint.turn}`).toEqual(checkpoint.prngState);
      expect(hashBattleReplayState(call![2]), `hash do turno ${checkpoint.turn}`).toBe(checkpoint.stateHash);
    }

    const finalState = captures.find(capture => capture.turn === 29)!.snapshots.at(-1)!;
    expect(hashBattleReplayState(finalState)).toBe('fnv1a32:66c34074');
    expect(finalState.prngState).toEqual({ seed: 533665, state: 3640936391, cursor: 206 });
    expect(renderer!.root.findAllByType('div').map(node => node.children.join('')).join(' '))
      .toContain('Turno: 29 / 29');
    expect(fetch).not.toHaveBeenCalled();
  }, 30000);

  it('3.2.3: valida o estado com os dois lados desmaiados e continua com ambos os substitutos', async () => {
    const seed = 32323;
    const p1 = createPokemon({
      id: 101, name: 'Titular P1', hp: 100, maxHP: 300, attackStat: 500, speedStat: 200,
      moves: [createMove({
        name: 'self-destruct', power: 500, uses: 10, maxUses: 10,
        effect: { status: 'self-faint', chance: 100 },
      })],
    });
    const reserve1 = createPokemon({ id: 102, name: 'Substituto P1', hp: 300, maxHP: 300 });
    const p2 = createPokemon({
      id: 201, name: 'Titular P2', hp: 30, maxHP: 300, defenseStat: 1, speedStat: 100,
      moves: [createMove({ name: 'resposta-p2', power: 40, uses: 10, maxUses: 10 })],
    });
    const reserve2 = createPokemon({ id: 202, name: 'Substituto P2', hp: 300, maxHP: 300 });
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
    const initialState = createBattleState([p1, reserve1], [p2, reserve2], {
      p1TeraUsed: false, p2TeraUsed: false, p1MegaUsed: false, p2MegaUsed: false,
      prngState: createBattlePRNGState(seed),
    });
    const p1Action: Action = { type: 'move', data: p1.moves[0], user: p1, playerNum: 1, priority: 0 };
    const p2Action: Action = { type: 'move', data: p2.moves[0], user: p2, playerNum: 2, priority: 0 };
    const replayWithoutEvents = createBattleReplay(initialState, config, seed);
    const live = runCoordinatorTurn({ seed, initialState, p1Action, p2Action, config });
    expect(live.finalState.currentPokemon1?.isFainted).toBe(true);
    expect(live.finalState.currentPokemon2?.isFainted).toBe(true);
    expect(live.steps.at(-1)?.phase).toBe('faint-switch');

    const replay = appendReplayCheckpoint({
      ...replayWithoutEvents,
      events: [
        createBattleReplayEvent({ turn: 1, player: 1, type: 'move', data: p1.moves[0], user: p1 }),
        createBattleReplayEvent({ turn: 1, player: 2, type: 'move', data: p2.moves[0], user: p2 }),
        createBattleReplayEvent({ turn: 1, player: 1, type: 'switch', data: reserve1, user: p1, isForcedSwitch: true }),
        createBattleReplayEvent({ turn: 1, player: 2, type: 'switch', data: reserve2, user: p2, isForcedSwitch: true }),
      ],
    }, 1, live.finalState);
    const liveP1Switch = BattleEngine.performSwitch(live.finalState, live.finalState.team1[1], 1, config.weatherEnabled);
    const liveBothSwitches = BattleEngine.performSwitch(liveP1Switch.newState, liveP1Switch.newState.team2[1], 2, config.weatherEnabled);

    const checkpointSpy = vi.spyOn(ReplayLogic, 'assertReplayCheckpoint');
    const switchSpy = vi.spyOn(BattleEngine, 'performSwitch');
    await loadReplay(replay);
    await clickNext();

    expect(alerts()).toEqual([]);
    const verificationState = checkpointSpy.mock.calls.find(([, turn]) => turn === 1)![2];
    expect(verificationState.currentPokemon1?.isFainted).toBe(true);
    expect(verificationState.currentPokemon2?.isFainted).toBe(true);
    expect(hashBattleReplayState(verificationState)).toBe(replay.checkpoints?.[1].stateHash);
    expect(switchSpy).toHaveBeenCalledTimes(2);
    const finalState = switchSpy.mock.results.at(-1)!.value.newState as BattleState;
    expect(finalState.currentPokemon1?.name).toBe('Substituto P1');
    expect(finalState.currentPokemon2?.name).toBe('Substituto P2');
    expect(hashBattleReplayState(finalState)).not.toBe(replay.checkpoints?.[1].stateHash);
    expect(withoutLogs(finalState)).toEqual(withoutLogs(liveBothSwitches.newState));
  });

  it('3.2.3: mantém a rejeição de uma ação adulterada no turno 22 da fixture real', async () => {
    const replay = loadRealFixture();
    replay.events = replay.events.map(event => event.turn === 22 && event.actorId === 1 && event.moveId === 'draco-meteor'
      ? { ...event, moveId: 'snarl' }
      : event);
    await loadReplay(replay);

    for (let turn = 1; turn <= 21; turn += 1) {
      await advanceWithoutDivergence(turn);
    }
    await clickNext();

    const message = alerts().join(' ');
    expect(message).toContain('Divergência de replay no turno 22');
    expect(message).toContain('hash esperado fnv1a32:c816f7ae');
    expect(message).toContain('hash obtido');
    expect(message).toContain('Reprodução interrompida');
    expect(renderer!.root.findAllByType('div').map(node => node.children.join('')).join(' '))
      .toContain('Turno: 21 / 29');
  });
});
