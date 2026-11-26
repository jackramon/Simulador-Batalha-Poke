import React, { useMemo, useRef, useState } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTurnManager } from '../../hooks/useTurnManager';
import { BattleSession } from '../../services/battleSession';
import { createBattleReplay, REPLAY_FORMAT_VERSION } from '../../services/replayLogic';
import type { Action, BattleConfig, BattleReplay, BattleState } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

vi.mock('../../services/animation/turnAnimator', () => ({
  TurnAnimator: { processStep: vi.fn(async () => {}) },
}));

interface Observation {
  replay: BattleReplay | null;
  state: BattleState;
}

const createFixture = (lethal = false) => {
  const seed = lethal ? 3302 : 3301;
  const attacker = createPokemon({
    id: 101,
    name: 'Gravador Ao Vivo',
    hp: 300,
    maxHP: 300,
    attackStat: lethal ? 500 : 100,
    speedStat: 150,
    moves: [createMove({ name: 'golpe-gravado', power: lethal ? 500 : 40, uses: 10, maxUses: 10 })],
  });
  const defender = createPokemon({
    id: 201,
    name: 'Oponente Ao Vivo',
    hp: lethal ? 1 : 300,
    maxHP: 300,
    defenseStat: 1,
    speedStat: 80,
    moves: [createMove({ name: 'resposta-ao-vivo', power: 30, uses: 10, maxUses: 10 })],
  });
  const state = createBattleState([attacker], [defender], { prngState: createBattlePRNGState(seed) });
  const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
  const p1Action = createMoveAction(attacker, attacker.moves[0], 1);
  const p2Action = createMoveAction(defender, defender.moves[0], 2);
  const control = runCoordinatorTurn({ seed, initialState: state, p1Action, p2Action, config });
  return { seed, state, config, p1Action, p2Action, control };
};

const mountTurnManager = async (
  fixture: ReturnType<typeof createFixture>,
  observation: Observation,
) => {
  const Harness = () => {
    const [state, setState] = useState(fixture.state);
    const [currentReplay, setCurrentReplay] = useState<BattleReplay | null>(() =>
      createBattleReplay(fixture.state, fixture.config, fixture.seed));
    const [p1Action, setP1Action] = useState<Action | null>(fixture.p1Action);
    const [p2Action, setP2Action] = useState<Action | null>(fixture.p2Action);
    const stateRef = useRef(state);
    const configRef = useRef<BattleConfig>(fixture.config);
    const battleSession = useMemo(() => new BattleSession(), []);
    const updateStateWithLogs = (newState: BattleState, logs: unknown[]) => {
      const updated = { ...newState, logs: logs as BattleState['logs'] };
      stateRef.current = updated;
      setState(updated);
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

    observation.replay = currentReplay;
    observation.state = stateRef.current;
    return null;
  };

  let renderer: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Harness));
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
  return renderer!;
};

describe('gravação de checkpoints no gerenciador real de turnos', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer!.unmount());
    renderer = undefined;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('3.2: grava checkpoint inicial e do turno concluído sem acrescentar draws ao PRNG', async () => {
    const fixture = createFixture();
    const observation: Observation = { replay: null, state: fixture.state };

    renderer = await mountTurnManager(fixture, observation);

    expect(observation.replay?.formatVersion).toBe(REPLAY_FORMAT_VERSION);
    expect(observation.replay?.checkpoints?.map(checkpoint => checkpoint.turn)).toEqual([0, 1]);
    expect(observation.replay?.checkpoints?.[1]?.prngState).toEqual(fixture.control.finalState.prngState);
    expect(observation.state.prngState).toEqual(fixture.control.finalState.prngState);
  });

  it('3.2: grava o checkpoint do turno terminal antes de encerrar a resolução', async () => {
    const fixture = createFixture(true);
    const observation: Observation = { replay: null, state: fixture.state };

    renderer = await mountTurnManager(fixture, observation);

    expect(fixture.control.finalState.winner).toBe(1);
    expect(observation.replay?.checkpoints?.map(checkpoint => checkpoint.turn)).toEqual([0, 1]);
    expect(observation.replay?.checkpoints?.[1]?.prngState).toEqual(fixture.control.finalState.prngState);
    expect(observation.state.winner).toBe(1);
  });
});
