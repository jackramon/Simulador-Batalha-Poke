import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { BagButton } from '../../components/BagButton';
import { BagModal } from '../../components/BagModal';
import { DetailsModal, SwitchModal } from '../../components/BattleModals';
import { MoveButton } from '../../components/MoveButton';
import { BattleCoordinator, type TurnPhase } from '../../services/engine/coordinator';
import type { BattleConfig, BattleState } from '../../types';
import { disableDeterministicRandom } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig } from './coordinator.helpers';

interface ResolutionTrace {
  turn: number;
  nextCalls: number;
  phases: TurnPhase[];
}

const createSavedTurn25 = (): { state: BattleState; config: BattleConfig } => {
  const wimpod = createPokemon({
    id: 767,
    name: 'Wimpod',
    hp: 12,
    maxHP: 12,
    ability: 'emergency-exit',
    types: ['bug', 'water'],
    defenseStat: 40,
    spDefenseStat: 30,
    moves: [createMove({ name: 'struggle-bug', displayName: 'Struggle Bug', power: 50, type: 'bug' })],
  });
  const nickit = createPokemon({
    id: 827,
    name: 'Nickit',
    hp: 250,
    maxHP: 250,
    types: ['dark'],
    defenseStat: 30,
    spDefenseStat: 30,
    moves: [createMove({ name: 'snarl', displayName: 'Snarl', power: 55, type: 'dark' })],
  });
  const slugma = createPokemon({
    id: 218,
    name: 'Slugma',
    hp: 80,
    maxHP: 200,
    types: ['fire'],
    moves: [createMove({ name: 'ember', displayName: 'Ember', power: 40, type: 'fire' })],
  });
  const lilligant = createPokemon({
    id: 549,
    name: 'Lilligant',
    hp: 500,
    maxHP: 500,
    types: ['grass'],
    spAttackStat: 400,
    moves: [createMove({
      name: 'leaf-storm',
      displayName: 'Tempestade de Folhas',
      power: 130,
      type: 'grass',
      damageClass: 'special',
      accuracy: 100,
      uses: 10,
      maxUses: 10,
    })],
  });
  const state = createBattleState([wimpod, nickit, slugma], [lilligant], {
    turn: 25,
    weather: 'rain',
    weatherTurns: 2,
    p1Inventory: { items: [{ id: 'potion', quantity: 2 }] },
  });
  const config = createBattleConfig({
    p1Mode: 'builder',
    p2Mode: 'builder',
    p1TeamSize: 3,
    p2TeamSize: 1,
    opponentMode: 'manual',
    p1AutoMode: false,
    weatherEnabled: true,
    itemsEnabled: true,
    forceAccuracyOutcome: 'hit',
    fixedRoll: 1,
  });
  return { state, config };
};

describe('hotfix da retomada de trocas forçadas na UI', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  let resolutions: ResolutionTrace[];
  let storedState: BattleState;
  let storage: Map<string, string>;

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const saved = createSavedTurn25();
    storedState = saved.state;
    storage = new Map<string, string>([
      ['poke_sim_battle_state', JSON.stringify(saved.state)],
      ['poke_sim_battle_config', JSON.stringify(saved.config)],
    ]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
        if (key === 'poke_sim_battle_state') storedState = JSON.parse(value) as BattleState;
      },
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('document', {
      documentElement: { classList: { add: vi.fn(), remove: vi.fn() } },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('CustomEvent', class {
      constructor(public type: string, public options?: unknown) {}
    });
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('Rede proibida no teste da UI');
    }));

    resolutions = [];
    const originalRunTurn = BattleCoordinator.runTurn;
    vi.spyOn(BattleCoordinator, 'runTurn').mockImplementation((initialState, p1Action, p2Action, config) => {
      const trace: ResolutionTrace = { turn: initialState.turn, nextCalls: 0, phases: [] };
      resolutions.push(trace);
      const generator = originalRunTurn(initialState, p1Action, p2Action, config);
      const originalNext = generator.next.bind(generator);
      generator.next = ((...args: Parameters<typeof generator.next>) => {
        trace.nextCalls += 1;
        const result = originalNext(...args);
        if (!result.done) trace.phases.push(result.value.phase);
        return result;
      }) as typeof generator.next;
      return generator;
    });

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });
    await flush();
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    disableDeterministicRandom();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('consome a escolha manual de Emergency Exit no mesmo generator e conclui o turno 25 uma vez', async () => {
    await act(async () => {
      renderer.root.findByType(BagButton).props.onClick();
    });
    await act(async () => {
      renderer.root.findByType(BagModal).props.onUseItem('potion', 218, undefined, 'p1-slot-2');
    });
    await act(async () => {
      const leafStorm = renderer.root.findAllByType(MoveButton)
        .find(button => button.props.move.name === 'leaf-storm');
      expect(leafStorm).toBeDefined();
      leafStorm!.props.onSelect();
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const switchModal = renderer.root.findByType(SwitchModal);
    await act(async () => {
      switchModal.props.onSelect(switchModal.props.team[1]);
    });
    const detailsModal = renderer.root.findByType(DetailsModal);
    await act(async () => {
      detailsModal.props.onSelect(detailsModal.props.pokemon);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await flush();

    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].phases.filter(phase => phase === 'start')).toHaveLength(1);
    expect(resolutions[0].phases.filter(phase => phase === 'turn-end')).toHaveLength(1);
    expect(storedState.currentPokemon1).toMatchObject({ name: 'Nickit', isFainted: false });
    expect(storedState.turn).toBe(26);
    expect(storedState.waitingForAction).toBe(false);
    expect(storedState.weatherTurns).toBe(1);
    expect(storedState.currentPokemon2?.moves[0].uses).toBe(9);
  });
});
