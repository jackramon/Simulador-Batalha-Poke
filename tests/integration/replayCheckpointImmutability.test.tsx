import React, { useEffect, useMemo, useRef, useState } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTurnManager } from '../../hooks/useTurnManager';
import { BattleSession } from '../../services/battleSession';
import {
  assertReplayCheckpoint,
  createBattleReplay,
  createReplayCheckpoint,
  hashBattleReplayState,
} from '../../services/replayLogic';
import type { Action, BattleConfig, BattleReplay, BattleState } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

vi.mock('../../services/animation/turnAnimator', () => ({
  TurnAnimator: { processStep: vi.fn(async () => {}) },
}));

interface Observation {
  state: BattleState;
  replay: BattleReplay | null;
  queue: Array<(prev: BattleReplay | null) => BattleReplay | null>;
  flush: () => void;
  renderer?: TestRenderer.ReactTestRenderer;
}

const createFixture = () => {
  const seed = 3221;
  const attacker = createPokemon({
    id: 111,
    name: 'Atacante Imutável',
    hp: 300,
    maxHP: 300,
    attackStat: 120,
    speedStat: 140,
    moves: [createMove({ name: 'golpe-imutavel', power: 55, uses: 10, maxUses: 10 })],
  });
  const defender = createPokemon({
    id: 222,
    name: 'Defensor Imutável',
    hp: 320,
    maxHP: 320,
    defenseStat: 90,
    speedStat: 70,
    moves: [createMove({ name: 'resposta-imutavel', power: 30, uses: 10, maxUses: 10 })],
  });
  const state = createBattleState([attacker], [defender], { prngState: createBattlePRNGState(seed) });
  const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
  const p1Action = createMoveAction(attacker, attacker.moves[0], 1);
  const p2Action = createMoveAction(defender, defender.moves[0], 2);
  return { seed, state, config, p1Action, p2Action };
};

const mountWithDeferredReplayUpdates = (fixture: ReturnType<typeof createFixture>) => {
  const observation: Observation = {
    state: fixture.state,
    replay: null,
    queue: [],
    flush: () => {},
  };

  const Harness = () => {
    const [state, setState] = useState(fixture.state);
    const [p1Action, setP1Action] = useState<Action | null>(fixture.p1Action);
    const [p2Action, setP2Action] = useState<Action | null>(fixture.p2Action);
    const stateRef = useRef(state);
    const configRef = useRef<BattleConfig>(fixture.config);
    const battleSession = useMemo(() => new BattleSession(), []);
    const initialReplay = useMemo(
      () => createBattleReplay(fixture.state, fixture.config, fixture.seed),
      [],
    );
    const [currentReplay, setCurrentReplayState] = useState<BattleReplay | null>(initialReplay);
    // Updater "deferido": replica o commit assíncrono do React, no qual o updater
    // executa DEPOIS da conclusão do turno e de qualquer alteração do estado vivo.
    const queueRef = useRef<Array<(prev: BattleReplay | null) => BattleReplay | null>>([]);
    const setCurrentReplay = ((action: React.SetStateAction<BattleReplay | null>) => {
      queueRef.current.push(typeof action === 'function'
        ? (action as (prev: BattleReplay | null) => BattleReplay | null)
        : () => action);
    }) as React.Dispatch<React.SetStateAction<BattleReplay | null>>;

    useEffect(() => { stateRef.current = state; }, [state]);
    observation.state = state;
    observation.replay = currentReplay;
    observation.queue = queueRef.current;
    observation.flush = () => {
      const pending = [...queueRef.current];
      queueRef.current = [];
      void act(() => {
        setCurrentReplayState(prev => pending.reduce((acc, updater) => updater(acc), prev));
      });
    };

    const updateStateWithLogs = (newState: BattleState, logs: unknown[]) => {
      setState({ ...newState, logs: logs as BattleState['logs'] });
    };

    useTurnManager({
      state,
      setState,
      stateRef,
      config: fixture.config,
      configRef,
      updateStateWithLogs,
      battleSession,
      currentReplay,
      setCurrentReplay,
      uiActions: {
        setAnimationState: vi.fn(),
        setShowSwitchModal: vi.fn(),
        setShowBagModal: vi.fn(),
        setAiHighlightingMember: vi.fn(),
        p1AiSelectedMove: null,
        setP1AiSelectedMove: vi.fn(),
        setP1AiBagSelection: vi.fn(),
        setIsTeraToggled: vi.fn(),
        isTeraToggled: false,
        setIsMegaToggled: vi.fn(),
        isMegaToggled: false,
        showSwitchModal: null,
        setP1Action,
        setP2Action,
        p1Action,
        p2Action,
      },
    });
    return null;
  };

  act(() => { observation.renderer = TestRenderer.create(React.createElement(Harness)); });
  return observation;
};

const settleUntil = async (predicate: () => boolean, timeoutMs = 2000) => {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error('tempo esgotado aguardando a resolução');
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
  }
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('checkpoint imutável calculado na conclusão do turno', () => {
  it('RED: alterar o estado depois de recordCompletedTurn e antes do updater não muda o hash gravado', async () => {
    const fixture = createFixture();
    const observation = mountWithDeferredReplayUpdates(fixture);

    // O turno é resolvido e o checkpoint é enfileirado, mas o updater ainda não executou.
    await settleUntil(() => observation.queue.length > 0);
    expect(observation.replay?.checkpoints?.map(checkpoint => checkpoint.turn)).toEqual([0]);

    // Hash do estado conclusivo, capturado no instante em que o turno terminou.
    const expectedHash = createReplayCheckpoint(1, structuredClone(observation.state)).stateHash;

    // Alteração posterior do estado vivo (mesmos objetos aninhados vistos pelo manager).
    observation.state.currentPokemon2!.hp -= 7;
    observation.state.currentPokemon2!.moves[0].uses -= 1;

    observation.flush();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });

    const checkpoint = observation.replay?.checkpoints?.find(entry => entry.turn === 1);
    expect(checkpoint?.stateHash).toBe(expectedHash);
    expect(Object.isFrozen(checkpoint)).toBe(true);
  });

  it('checkpoint calculado é imutável e não muda de hash quando o estado é clonado e alterado', () => {
    const fixture = createFixture();
    const checkpoints = [createReplayCheckpoint(1, fixture.state)];
    const recordedHash = checkpoints[0].stateHash;

    const mutated = structuredClone(fixture.state);
    mutated.team1[0].hp -= 42;
    mutated.turn = 9;

    expect(Object.isFrozen(checkpoints[0])).toBe(true);
    expect(Object.isFrozen(checkpoints[0].prngState)).toBe(true);
    expect(checkpoints[0].stateHash).toBe(recordedHash);
    expect(hashBattleReplayState(mutated)).not.toBe(recordedHash);
    expect(() => { (checkpoints[0] as { stateHash: string }).stateHash = 'fnv1a32:00000000'; }).toThrow();
  });

  it('exportação nova seguida de replay compara checkpoints sem divergência', () => {
    const fixture = createFixture();
    const replay = createBattleReplay(fixture.state, fixture.config, fixture.seed);
    const control = runCoordinatorTurn({
      seed: fixture.seed,
      initialState: fixture.state,
      p1Action: fixture.p1Action,
      p2Action: fixture.p2Action,
      config: fixture.config,
    });
    const replayWithCheckpoint: BattleReplay = {
      ...replay,
      checkpoints: [...replay.checkpoints!, createReplayCheckpoint(1, control.finalState)],
    };

    expect(replayWithCheckpoint.checkpoints?.map(checkpoint => checkpoint.turn)).toEqual([0, 1]);
    const warning = assertReplayCheckpoint(replayWithCheckpoint, 1, control.finalState);
    expect(warning).toBeNull();
  });
});
