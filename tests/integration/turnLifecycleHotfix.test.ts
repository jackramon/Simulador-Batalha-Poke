import React, { useState } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BATTLE_MESSAGES } from '../../data/battleMessages';
import { useBattleState } from '../../hooks/useBattleState';
import { useTurnManager } from '../../hooks/useTurnManager';
import * as AiLogic from '../../services/aiLogic';
import { BattleCoordinator, type TurnPhase } from '../../services/engine/coordinator';
import type { Action, BattleState, Pokemon } from '../../types';
import { createMove, createPokemon } from '../factories';

type BattleHook = ReturnType<typeof useBattleState>;
type TurnHook = ReturnType<typeof useTurnManager>;
type TurnManagerProps = Parameters<typeof useTurnManager>[0];

interface ResolutionTrace {
  id: number;
  turn: number;
  nextCalls: number;
  phases: TurnPhase[];
}

interface CommitTrace {
  resolutionId: number;
  turn: number;
  activeNames: [string | undefined, string | undefined];
  messages: string[];
}

interface Harness {
  battle: BattleHook;
  turns: TurnHook;
  p1Action: Action | null;
  p2Action: Action | null;
}

const createUiActions = (
  setters: Pick<TurnManagerProps['uiActions'],
    | 'setAnimationState'
    | 'setShowSwitchModal'
    | 'setShowBagModal'
    | 'setAiHighlightingMember'
    | 'setP1AiSelectedMove'
    | 'setP1AiBagSelection'
    | 'setIsTeraToggled'
    | 'setIsMegaToggled'
    | 'setP1Action'
    | 'setP2Action'
  >,
  values: Pick<TurnManagerProps['uiActions'],
    | 'p1AiSelectedMove'
    | 'isTeraToggled'
    | 'isMegaToggled'
    | 'showSwitchModal'
    | 'p1Action'
    | 'p2Action'
  >,
): TurnManagerProps['uiActions'] => ({ ...setters, ...values });

const createTurn25Teams = () => {
  const wimpod = createPokemon({
    id: 767,
    name: 'Wimpod',
    hp: 12,
    maxHP: 12,
    ability: 'emergency-exit',
    types: ['bug', 'water'],
    defenseStat: 40,
    spDefenseStat: 30,
    speedStat: 80,
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
    speedStat: 90,
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
    speedStat: 100,
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
  return { team1: [wimpod, nickit, slugma], team2: [lilligant] };
};

describe('hotfix do ciclo de vida das resoluções de turno', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  let harness: Harness;
  let resolutions: ResolutionTrace[];
  let commits: CommitTrace[];
  let currentResolutionId: number;
  let storageWrites: Array<{ key: string; turn?: number; names?: string[] }>;

  const flushAsync = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const loadBattle = async (team1: Pokemon[], team2: Pokemon[]) => {
    await act(async () => {
      harness.battle.p1CustomTeamRef.current = team1;
      harness.battle.p2CustomTeamRef.current = team2;
      harness.battle.setConfig(prev => ({
        ...prev,
        p1Mode: 'builder',
        p2Mode: 'builder',
        p1TeamSize: team1.length,
        p2TeamSize: team2.length,
        opponentMode: 'manual',
        p1AutoMode: false,
        useLLM: false,
        weatherEnabled: true,
        terrainEnabled: false,
        itemsEnabled: true,
        forceAccuracyOutcome: 'hit',
        fixedRoll: 1,
      }));
    });
    await act(async () => {
      await harness.battle.startBattle();
    });
  };

  const advanceAnimations = async () => {
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await flushAsync();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const storage = new Map<string, string>();
    storageWrites = [];
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
        const parsed = key === 'poke_sim_battle_state' ? JSON.parse(value) as BattleState : undefined;
        storageWrites.push({
          key,
          turn: parsed?.turn,
          names: parsed ? [parsed.currentPokemon1?.name, parsed.currentPokemon2?.name] : undefined,
        });
      },
      removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('CustomEvent', class {
      constructor(public type: string, public options?: unknown) {}
    });
    vi.stubGlobal('alert', vi.fn());

    resolutions = [];
    commits = [];
    currentResolutionId = 0;
    const originalRunTurn = BattleCoordinator.runTurn;
    vi.spyOn(BattleCoordinator, 'runTurn').mockImplementation((initialState, p1Action, p2Action, config) => {
      const trace: ResolutionTrace = {
        id: resolutions.length + 1,
        turn: initialState.turn,
        nextCalls: 0,
        phases: [],
      };
      resolutions.push(trace);
      const generator = originalRunTurn(initialState, p1Action, p2Action, config);
      const originalNext = generator.next.bind(generator);
      generator.next = ((...args: Parameters<typeof generator.next>) => {
        trace.nextCalls += 1;
        const result = originalNext(...args);
        currentResolutionId = trace.id;
        if (!result.done) trace.phases.push(result.value.phase);
        return result;
      }) as typeof generator.next;
      return generator;
    });

    function HarnessComponent() {
      const battle = useBattleState();
      const [p1Action, setP1Action] = useState<Action | null>(null);
      const [p2Action, setP2Action] = useState<Action | null>(null);
      const [animationState, setAnimationState] = useState<unknown>(null);
      const [showSwitchModal, setShowSwitchModal] = useState<any>(null);
      const [showBagModal, setShowBagModal] = useState(false);
      const [aiHighlightingMember, setAiHighlightingMember] = useState<number | null>(null);
      const [p1AiSelectedMove, setP1AiSelectedMove] = useState<string | null>(null);
      const [p1AiBagSelection, setP1AiBagSelection] = useState<any>(null);
      const [isTeraToggled, setIsTeraToggled] = useState(false);
      const [isMegaToggled, setIsMegaToggled] = useState(false);
      void animationState;
      void showBagModal;
      void aiHighlightingMember;
      void p1AiBagSelection;

      const updateStateWithLogs = (newState: BattleState, logs: any[]) => {
        commits.push({
          resolutionId: currentResolutionId,
          turn: newState.turn,
          activeNames: [newState.currentPokemon1?.name, newState.currentPokemon2?.name],
          messages: logs.map(log => log.message),
        });
        battle.updateStateWithLogs(newState, logs);
      };
      const uiActions = createUiActions(
        {
          setAnimationState,
          setShowSwitchModal,
          setShowBagModal,
          setAiHighlightingMember,
          setP1AiSelectedMove,
          setP1AiBagSelection,
          setIsTeraToggled,
          setIsMegaToggled,
          setP1Action,
          setP2Action,
        },
        {
          p1AiSelectedMove,
          isTeraToggled,
          isMegaToggled,
          showSwitchModal,
          p1Action,
          p2Action,
        },
      );
      const turns = useTurnManager({
        state: battle.state,
        setState: battle.setState,
        stateRef: battle.stateRef,
        config: battle.config,
        configRef: battle.configRef,
        updateStateWithLogs,
        battleSession: battle.battleSession,
        currentReplay: battle.currentReplay,
        setCurrentReplay: battle.setCurrentReplay,
        uiActions,
      });
      harness = { battle, turns, p1Action, p2Action };
      return null;
    }

    await act(async () => {
      renderer = TestRenderer.create(React.createElement(HarnessComponent));
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

  it('ignora a continuação de uma batalha vencida por dano residual depois que outra batalha começa', async () => {
    const statusMove = () => createMove({
      name: 'acao-sem-dano',
      displayName: 'Ação sem dano',
      power: 0,
      isStatus: true,
      damageClass: 'status',
    });
    const oldP1 = createPokemon({ id: 901, name: 'Antigo P1', moves: [statusMove()] });
    const oldP2 = createPokemon({
      id: 902,
      name: 'Antigo P2',
      hp: 1,
      maxHP: 80,
      statusEffects: { poison: { turns: 0 } },
      moves: [statusMove()],
    });
    await loadBattle([oldP1], [oldP2]);
    await act(async () => {
      harness.battle.setState(prev => {
        const team2 = prev.team2.map((pokemon, index) => index === 0
          ? { ...pokemon, hp: 1, statusEffects: { poison: { turns: 0 } } }
          : pokemon);
        return { ...prev, team2, currentPokemon2: team2[0] };
      });
    });

    await act(async () => {
      harness.turns.handlePlayerAction(1, 'move', harness.battle.state.currentPokemon1!.moves[0]);
    });
    await act(async () => {
      harness.turns.handlePlayerAction(2, 'move', harness.battle.state.currentPokemon2!.moves[0]);
    });
    for (let step = 0; step < 12; step += 1) {
      const residualKoCommitted = commits.some(commit =>
        commit.messages.includes(BATTLE_MESSAGES.FAINTED('Antigo P2'))
      );
      if (residualKoCommitted) break;
      await act(async () => {
        await vi.advanceTimersToNextTimerAsync();
      });
    }
    expect(harness.battle.state.currentPokemon2).toMatchObject({ name: 'Antigo P2', isFainted: true });

    const newP1 = createPokemon({ id: 911, name: 'Novo P1', hp: 300, maxHP: 300, moves: [createMove()] });
    const newP2 = createPokemon({ id: 912, name: 'Novo P2', hp: 300, maxHP: 300, moves: [createMove()] });
    await loadBattle([newP1], [newP2]);
    const randomAfterNewSeed = Math.random;
    let lateRandomDraws = 0;
    Math.random = () => {
      lateRandomDraws += 1;
      return randomAfterNewSeed();
    };
    await advanceAnimations();
    Math.random = randomAfterNewSeed;

    const persisted = JSON.parse(localStorage.getItem('poke_sim_battle_state')!) as BattleState;
    expect(harness.battle.state).toMatchObject({
      turn: 1,
      winner: null,
      isBattleInProgress: true,
    });
    expect(harness.battle.state.currentPokemon1).toMatchObject({ name: 'Novo P1', hp: 300 });
    expect(harness.battle.state.currentPokemon2).toMatchObject({ name: 'Novo P2', hp: 300 });
    expect(harness.battle.state.logs.some(log => log.message.includes('Antigo'))).toBe(false);
    expect(persisted.currentPokemon1?.name).toBe('Novo P1');
    expect(persisted.currentPokemon2?.name).toBe('Novo P2');
    expect(persisted.turn).toBe(1);
    expect(harness.p1Action).toBeNull();
    expect(harness.p2Action).toBeNull();
    expect(harness.battle.currentReplay?.events).toEqual([]);
    expect(lateRandomDraws).toBe(0);
  });

  it('cancela IA e timers da batalha anterior sem consumir a seed nem agir na nova', async () => {
    const oldP1 = createPokemon({ id: 921, name: 'Timer Antigo P1', moves: [createMove()] });
    const oldP2 = createPokemon({ id: 922, name: 'Timer Antigo P2', moves: [createMove()] });
    await loadBattle([oldP1], [oldP2]);
    const aiSpy = vi.spyOn(AiLogic, 'decideAIAction');
    await act(async () => {
      harness.battle.configRef.current = {
        ...harness.battle.configRef.current,
        opponentMode: 'auto',
      };
      harness.turns.handlePlayerAction(1, 'move', harness.battle.state.currentPokemon1!.moves[0]);
    });

    const newP1 = createPokemon({ id: 931, name: 'Timer Novo P1', hp: 300, maxHP: 300, moves: [createMove()] });
    const newP2 = createPokemon({ id: 932, name: 'Timer Novo P2', hp: 300, maxHP: 300, moves: [createMove()] });
    await loadBattle([newP1], [newP2]);
    const randomAfterNewSeed = Math.random;
    let lateRandomDraws = 0;
    Math.random = () => {
      lateRandomDraws += 1;
      return randomAfterNewSeed();
    };
    await advanceAnimations();
    Math.random = randomAfterNewSeed;

    const persisted = JSON.parse(localStorage.getItem('poke_sim_battle_state')!) as BattleState;
    expect(aiSpy).not.toHaveBeenCalled();
    expect(resolutions).toHaveLength(0);
    expect(harness.battle.state.currentPokemon1).toMatchObject({ name: 'Timer Novo P1', hp: 300 });
    expect(harness.battle.state.currentPokemon2).toMatchObject({ name: 'Timer Novo P2', hp: 300 });
    expect(harness.battle.state.turn).toBe(1);
    expect(harness.battle.currentReplay?.events).toEqual([]);
    expect(persisted.currentPokemon1?.hp).toBe(300);
    expect(persisted.currentPokemon2?.hp).toBe(300);
    expect(lateRandomDraws).toBe(0);
  });

  it('não inicia uma segunda resolução quando uma ação chega durante Emergency Exit', async () => {
    const { team1, team2 } = createTurn25Teams();
    await loadBattle(team1, team2);
    await act(async () => {
      harness.battle.setState(prev => ({
        ...prev,
        turn: 25,
        weather: 'rain',
        weatherTurns: 2,
        p1Inventory: { items: [{ id: 'potion', quantity: 2 }] },
      }));
      harness.battle.configRef.current = {
        ...harness.battle.configRef.current,
        p1AutoMode: true,
        opponentMode: 'manual',
      };
    });

    await act(async () => {
      harness.turns.handlePlayerAction(1, 'item', {
        itemId: 'potion',
        targetId: 218,
        targetInstanceId: 'p1-slot-2',
        isGive: false,
      });
    });
    await act(async () => {
      harness.turns.handlePlayerAction(2, 'move', harness.battle.state.currentPokemon2!.moves[0]);
    });
    await flushAsync();
    await act(async () => {
      harness.turns.handlePlayerAction(1, 'move', harness.battle.state.currentPokemon1!.moves[0]);
    });
    await advanceAnimations();

    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].phases.filter(phase => phase === 'turn-end')).toHaveLength(1);
    expect(harness.battle.state.turn).toBe(26);
    expect(harness.battle.state.weatherTurns).toBe(1);
    expect(harness.battle.state.currentPokemon2?.moves[0].uses).toBe(9);
    expect(harness.battle.currentReplay?.events).toHaveLength(3);
  });

  it('retoma Emergency Exit uma única vez, sem repetir ação adversária ou turnEnd no turno 25', async () => {
    const { team1, team2 } = createTurn25Teams();
    await loadBattle(team1, team2);
    await act(async () => {
      harness.battle.setState(prev => ({
        ...prev,
        turn: 25,
        weather: 'rain',
        weatherTurns: 2,
        p1Inventory: { items: [{ id: 'potion', quantity: 2 }] },
      }));
      harness.battle.configRef.current = {
        ...harness.battle.configRef.current,
        p1AutoMode: true,
        opponentMode: 'manual',
      };
    });

    await act(async () => {
      harness.turns.handlePlayerAction(1, 'item', {
        itemId: 'potion',
        targetId: 218,
        targetInstanceId: 'p1-slot-2',
        isGive: false,
      });
    });
    await act(async () => {
      harness.turns.handlePlayerAction(2, 'move', harness.battle.state.currentPokemon2!.moves[0]);
    });
    await advanceAnimations();

    expect(harness.battle.state.currentPokemon1).toMatchObject({ name: 'Nickit', isFainted: false });
    expect(harness.battle.state.turn).toBe(26);
    expect(harness.battle.state.waitingForAction).toBe(false);
    expect(harness.battle.state.weatherTurns).toBe(1);
    expect(harness.battle.state.currentPokemon2?.moves[0].uses).toBe(9);
    expect(harness.battle.state.p1Inventory.items).toEqual([{ id: 'potion', quantity: 1 }]);
    expect(resolutions).toHaveLength(1);
    expect(resolutions[0]).toMatchObject({ turn: 25 });
    expect(resolutions[0].phases.filter(phase => phase === 'start')).toHaveLength(1);
    expect(resolutions[0].phases.filter(phase => phase === 'turn-end')).toHaveLength(1);
    expect(commits.flatMap(commit => commit.messages)
      .filter(message => message === BATTLE_MESSAGES.USED_MOVE('Lilligant', 'Tempestade de Folhas')))
      .toHaveLength(1);

    await act(async () => {
      harness.battle.setState(prev => {
        const team1 = prev.team1.map(pokemon => pokemon.name === 'Nickit'
          ? { ...pokemon, hp: 1 }
          : pokemon);
        return {
          ...prev,
          team1,
          currentPokemon1: team1.find(pokemon => pokemon.name === 'Nickit') ?? prev.currentPokemon1,
        };
      });
    });
    await act(async () => {
      harness.turns.handlePlayerAction(1, 'move', harness.battle.state.currentPokemon1!.moves[0]);
    });
    await act(async () => {
      harness.turns.handlePlayerAction(2, 'move', harness.battle.state.currentPokemon2!.moves[0]);
    });
    await advanceAnimations();

    const allMessages = commits.flatMap(commit => commit.messages);
    expect(harness.battle.state.turn).toBe(27);
    expect(harness.battle.state.team1.find(pokemon => pokemon.name === 'Nickit')?.isFainted).toBe(true);
    expect(harness.battle.state.currentPokemon1).toMatchObject({ isFainted: false });
    expect(harness.battle.state.currentPokemon1?.name).not.toBe('Nickit');
    expect(harness.battle.state.currentPokemon2).toMatchObject({ name: 'Lilligant', isFainted: false });
    expect(allMessages.filter(message => message === BATTLE_MESSAGES.FAINTED('Nickit'))).toHaveLength(1);
    expect(allMessages.filter(message => message === BATTLE_MESSAGES.FAINTED('Lilligant'))).toHaveLength(0);
    expect(allMessages.filter(message => message.includes('se dissipou'))).toHaveLength(1);
    expect(resolutions).toHaveLength(2);
    expect(resolutions[1].phases.filter(phase => phase === 'turn-end')).toHaveLength(1);
  });

  it('mantém uma única resolução quando Emergency Exit pertence à IA de P2', async () => {
    const { team1, team2 } = createTurn25Teams();
    await loadBattle(team2, team1);
    await act(async () => {
      harness.battle.setState(prev => ({
        ...prev,
        turn: 25,
        weather: 'rain',
        weatherTurns: 2,
        p2Inventory: { items: [{ id: 'potion', quantity: 2 }] },
      }));
    });

    await act(async () => {
      harness.turns.handlePlayerAction(2, 'item', {
        itemId: 'potion',
        targetId: 218,
        targetInstanceId: 'p2-slot-2',
        isGive: false,
      });
    });
    await act(async () => {
      harness.turns.handlePlayerAction(1, 'move', harness.battle.state.currentPokemon1!.moves[0]);
    });
    await advanceAnimations();

    expect(harness.battle.state.currentPokemon2).toMatchObject({ name: 'Nickit', isFainted: false });
    expect(harness.battle.state.turn).toBe(26);
    expect(harness.battle.state.weatherTurns).toBe(1);
    expect(harness.battle.state.currentPokemon1?.moves[0].uses).toBe(9);
    expect(harness.battle.state.p2Inventory.items).toEqual([{ id: 'potion', quantity: 1 }]);
    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].phases.filter(phase => phase === 'start')).toHaveLength(1);
    expect(resolutions[0].phases.filter(phase => phase === 'turn-end')).toHaveLength(1);
    expect(commits.flatMap(commit => commit.messages)
      .filter(message => message === BATTLE_MESSAGES.USED_MOVE('Lilligant', 'Tempestade de Folhas')))
      .toHaveLength(1);
  });

  it('grava as flags da decisão automática de P1 sem depender dos toggles visuais', async () => {
    const p1 = createPokemon({ id: 941, name: 'P1 Automático', moves: [createMove({ name: 'mega-ai-move' })] });
    const p2 = createPokemon({ id: 942, name: 'Oponente Manual', moves: [createMove()] });
    await loadBattle([p1], [p2]);
    const aiAction: Action = {
      type: 'move',
      data: harness.battle.state.currentPokemon1!.moves[0],
      user: harness.battle.state.currentPokemon1!,
      playerNum: 1,
      priority: 0,
      shouldTerastallize: false,
      shouldMegaEvolve: true,
    };
    vi.spyOn(AiLogic, 'decideAIAction').mockReturnValue(aiAction);

    await act(async () => {
      harness.battle.configRef.current = {
        ...harness.battle.configRef.current,
        p1AutoMode: true,
        terastallizationEnabled: true,
        megaEvolutionEnabled: true,
      };
      harness.battle.setConfig(prev => ({
        ...prev,
        p1AutoMode: true,
        terastallizationEnabled: true,
        megaEvolutionEnabled: true,
      }));
    });
    await flushAsync();
    await act(async () => {
      await vi.advanceTimersToNextTimerAsync();
    });

    expect(harness.battle.currentReplay?.events).toHaveLength(1);
    expect(harness.battle.currentReplay?.events[0]).toMatchObject({
      actorId: 1,
      actorInstanceId: 'p1-slot-0',
      actionType: 'move',
      moveId: 'mega-ai-move',
      shouldTerastallize: false,
      shouldMegaEvolve: true,
    });
  });
});
