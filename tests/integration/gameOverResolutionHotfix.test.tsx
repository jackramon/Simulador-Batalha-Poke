import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { MoveButton } from '../../components/MoveButton';
import { BattleCoordinator, type TurnPhase } from '../../services/engine/coordinator';
import type { BattleConfig, BattleState } from '../../types';
import { disableDeterministicRandom } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig } from './coordinator.helpers';

interface ResolutionTrace {
  nextCalls: number;
  phases: TurnPhase[];
}

type TerminalScenario = 'p1-direct' | 'p2-direct' | 'residual' | 'draw';

const statusMove = () => createMove({
  name: 'acao-sem-dano',
  displayName: 'Ação sem dano',
  power: 0,
  isStatus: true,
  damageClass: 'status',
});

const createSavedFinalTurn = (scenario: TerminalScenario = 'p1-direct'): { state: BattleState; config: BattleConfig } => {
  const isResidual = scenario === 'residual' || scenario === 'draw';
  const meganium = createPokemon({
    id: 154,
    name: 'Meganium',
    hp: scenario === 'draw' ? 1 : 300,
    maxHP: 300,
    attackStat: 400,
    speedStat: 200,
    statusEffects: scenario === 'draw' ? { poison: { turns: 0 } } : {},
    moves: [isResidual ? statusMove() : createMove({
      name: 'leafage',
      displayName: 'Folhagem',
      power: 40,
      type: 'grass',
      accuracy: 100,
    })],
  });
  const nidoking = createPokemon({
    id: 34,
    name: 'Nidoking',
    hp: 1,
    maxHP: 300,
    speedStat: 50,
    statusEffects: isResidual ? { poison: { turns: 0 } } : {},
    moves: [isResidual ? statusMove() : createMove({ name: 'tackle', displayName: 'Investida', power: 40 })],
  });
  const teams = scenario === 'p2-direct'
    ? { team1: [nidoking], team2: [meganium] }
    : { team1: [meganium], team2: [nidoking] };
  const state = createBattleState(teams.team1, teams.team2, {
    turn: 18,
    waitingForAction: false,
  });
  const config = createBattleConfig({
    p1Mode: 'builder',
    p2Mode: 'builder',
    p1TeamSize: 1,
    p2TeamSize: 1,
    opponentMode: 'manual',
    p1AutoMode: false,
    useLLM: false,
    forceAccuracyOutcome: 'hit',
    fixedRoll: 1,
  });
  return { state, config };
};

describe('hotfix do commit terminal na UI', () => {
  let renderer: TestRenderer.ReactTestRenderer;
  let resolutions: ResolutionTrace[];
  let storedState: BattleState;
  let stateWrites: BattleState[];
  let storage: Map<string, string>;
  let scenario: TerminalScenario;

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const selectMove = async (name: string) => {
    let select: (() => void) | undefined;
    await act(async () => {
      const button = renderer.root.findAllByType(MoveButton)
        .find(candidate => candidate.props.move.name === name);
      expect(button).toBeDefined();
      select = button!.props.onSelect;
      select!();
    });
    return select!;
  };

  const resolveTurn = async (firstMove: string, secondMove: string) => {
    await selectMove(firstMove);
    await selectMove(secondMove);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await flush();
  };

  const expectTerminal = (winner: 1 | 2 | 'draw') => {
    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].phases.filter(phase => phase === 'game-over')).toHaveLength(1);
    expect(storedState).toMatchObject({
      winner,
      waitingForAction: false,
      isBattleInProgress: false,
    });
    expect(stateWrites.filter(state => state.winner !== null)).toHaveLength(1);
    expect(renderer.root.findAllByType('p').some(node => node.children.includes('Processando combate...'))).toBe(false);
  };

  beforeEach(async () => {
    scenario = 'p1-direct';
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const newTeams = {
      p1: [createPokemon({ id: 901, name: 'Novo P1', hp: 250, maxHP: 250, moves: [createMove()] })],
      p2: [createPokemon({ id: 902, name: 'Novo P2', hp: 250, maxHP: 250, moves: [createMove()] })],
    };
    storage = new Map<string, string>([
      ['poke_sim_p1_team', JSON.stringify(newTeams.p1)],
      ['poke_sim_p2_team', JSON.stringify(newTeams.p2)],
    ]);
    stateWrites = [];
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
        if (key === 'poke_sim_battle_state') {
          storedState = JSON.parse(value) as BattleState;
          stateWrites.push(storedState);
        }
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
      const trace: ResolutionTrace = { nextCalls: 0, phases: [] };
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
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    disableDeterministicRandom();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const mountSavedBattle = async () => {
    const saved = createSavedFinalTurn(scenario);
    storedState = saved.state;
    storage.set('poke_sim_battle_state', JSON.stringify(saved.state));
    storage.set('poke_sim_battle_config', JSON.stringify(saved.config));
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(App));
    });
    await flush();
  };

  it('exibe a vitória de P1 e persiste uma única vez após o KO direto do último Pokémon de P2', async () => {
    await mountSavedBattle();
    await resolveTurn('leafage', 'tackle');

    expectTerminal(1);
    expect(storedState.currentPokemon2).toMatchObject({ name: 'Nidoking', hp: 0, isFainted: true });
    expect(renderer.root.findAllByType('h2').some(node => node.children.includes('Equipe Vencedora'))).toBe(true);
  });

  it('exibe a vitória de P2 após o KO direto do último Pokémon de P1', async () => {
    scenario = 'p2-direct';
    await mountSavedBattle();
    await resolveTurn('tackle', 'leafage');

    expectTerminal(2);
    expect(storedState.currentPokemon1).toMatchObject({ name: 'Nidoking', hp: 0, isFainted: true });
    expect(renderer.root.findAllByType('h2').some(node => node.children.includes('Equipe Vencedora'))).toBe(true);
  });

  it('entrega o game-over quando o dano residual do turnEnd desmaia o último Pokémon de P2', async () => {
    scenario = 'residual';
    await mountSavedBattle();
    await resolveTurn('acao-sem-dano', 'acao-sem-dano');

    expectTerminal(1);
    expect(storedState.currentPokemon1?.isFainted).toBe(false);
    expect(storedState.currentPokemon2).toMatchObject({ hp: 0, isFainted: true });
  });

  it('entrega o empate sem travamento quando o dano residual desmaia os dois últimos Pokémon', async () => {
    scenario = 'draw';
    await mountSavedBattle();
    await resolveTurn('acao-sem-dano', 'acao-sem-dano');

    expectTerminal('draw');
    expect(storedState.currentPokemon1?.isFainted).toBe(true);
    expect(storedState.currentPokemon2?.isFainted).toBe(true);
    expect(renderer.root.findAllByType('h2').some(node => node.children.includes('Batalha Empatada!'))).toBe(true);
  });

  it('não aceita outra ação nem repete o commit depois do resultado terminal', async () => {
    await mountSavedBattle();
    const staleAction = await selectMove('leafage');
    await selectMove('tackle');
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await flush();
    expectTerminal(1);
    const terminalState = JSON.stringify(storedState);
    const nextCalls = resolutions[0].nextCalls;

    await act(async () => {
      staleAction();
      await vi.runAllTimersAsync();
    });
    await flush();

    expect(resolutions).toHaveLength(1);
    expect(resolutions[0].nextCalls).toBe(nextCalls);
    expect(JSON.stringify(storedState)).toBe(terminalState);
    expect(stateWrites.filter(state => state.winner !== null)).toHaveLength(1);
  });

  it('inicia uma nova batalha limpa sem permitir que o estado vencedor anterior retorne', async () => {
    await mountSavedBattle();
    await resolveTurn('leafage', 'tackle');
    expectTerminal(1);

    await act(async () => {
      const newBattle = renderer.root.findAllByType('button')
        .find(button => button.children.includes('Nova Batalha'));
      expect(newBattle).toBeDefined();
      newBattle!.props.onClick();
    });
    await act(async () => {
      const start = renderer.root.findAllByType('button')
        .find(button => button.children.includes('INICIAR BATALHA'));
      expect(start).toBeDefined();
      start!.props.onClick();
      await Promise.resolve();
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await flush();

    const persisted = JSON.parse(storage.get('poke_sim_battle_state')!) as BattleState;
    expect(storedState).toMatchObject({ turn: 1, winner: null, isBattleInProgress: true, waitingForAction: false });
    expect(storedState.currentPokemon1).toMatchObject({ name: 'Novo P1', hp: 250, isFainted: false });
    expect(storedState.currentPokemon2).toMatchObject({ name: 'Novo P2', hp: 250, isFainted: false });
    expect(storedState.logs.some(log => /Meganium|Nidoking/.test(log.message))).toBe(false);
    expect(persisted).toMatchObject({
      turn: 1,
      winner: null,
      currentPokemon1: { name: 'Novo P1', hp: 250 },
      currentPokemon2: { name: 'Novo P2', hp: 250 },
    });
    expect(resolutions).toHaveLength(1);
  });
});
