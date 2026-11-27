import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReplayPlayer from '../../components/ReplayPlayer';
import { BattleCoordinator } from '../../services/engine/coordinator';
import * as Effects from '../../services/effectHandlers';
import * as ReplayLogic from '../../services/replayLogic';
import {
  appendReplayCheckpoint,
  createBattleReplay,
  createBattleReplayEvent,
} from '../../services/replayLogic';
import type { BattleReplay, BattleReplayEvent, BattleState, Pokemon } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';

// O card real é substituído por um espião de props: permite ler o estado que a UI
// realmente recebeu depois de Reiniciar/Voltar/upload.
const cardCaptures = vi.hoisted(() => ({
  entries: [] as { pokemon: Pokemon | null; isPlayer: boolean }[],
}));

// A animação é controlável: os testes de rajada precisam manter a transição aberta
// (durante os passos do generator) para provar que o segundo clique não executa o turno.
const animatorMock = vi.hoisted(() => ({ processStep: vi.fn() }));

vi.mock('../../components/PokemonCard', () => ({
  PokemonCard: (props: { pokemon: Pokemon | null; isPlayer: boolean }) => {
    cardCaptures.entries.push({ pokemon: props.pokemon, isPlayer: props.isPlayer });
    return null;
  },
}));
vi.mock('../../components/BattleLayout', () => ({ BattleHeader: () => null }));
vi.mock('../../services/animation/turnAnimator', () => ({
  TurnAnimator: { processStep: animatorMock.processStep },
}));

interface CoordinatorCapture {
  p1ActionName?: string;
  p2ActionName?: string;
  snapshots: BattleState[];
}

interface NavigationFixture {
  replay: BattleReplay;
  /** Estado final de cada turno, na ordem executada pelo coordenação ao vivo. */
  finals: BattleState[];
  /** Golpe do Jogador 1 em cada turno (alterna entre dois golpes válidos). */
  p1Moves: string[];
  /** Golpe do Jogador 1 no turno indicado que NÃO foi gravado (para adulteração). */
  otherP1Move: (turn: number) => string;
}

const withoutLogs = (state: BattleState): BattleState => {
  const normalized = JSON.parse(JSON.stringify(state)) as BattleState;
  normalized.logs = [];
  return normalized;
};

/**
 * Replay versionado de N turnos executado pelo coordenador real, com habilidades de
 * entrada aplicadas na mesma ordem do ReplayPlayer. Os dois golpes do Jogador 1
 * alternam por turno, de modo que um turno reexecutado ou adulterado muda o hash.
 */
const buildNavigationFixture = (
  seed: number,
  turnCount: number,
  label = 'Trava',
): NavigationFixture => {
  const p1 = createPokemon({
    id: 701,
    name: `Um da ${label}`,
    hp: 4000,
    maxHP: 4000,
    speedStat: 140,
    moves: [
      createMove({ name: 'brasa-da-trava', displayName: 'Brasa da Trava', power: 30, type: 'fire', uses: 30, maxUses: 30 }),
      createMove({ name: 'chama-da-trava', displayName: 'Chama da Trava', power: 35, type: 'fire', uses: 30, maxUses: 30 }),
    ],
  });
  const p2 = createPokemon({
    id: 702,
    name: `Dois da ${label}`,
    hp: 4000,
    maxHP: 4000,
    speedStat: 90,
    moves: [createMove({ name: 'resposta-da-trava', displayName: 'Resposta da Trava', power: 25, uses: 30, maxUses: 30 })],
  });
  const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1, itemsEnabled: false });
  let state = createBattleState([p1], [p2], {
    prngState: createBattlePRNGState(seed),
    p1TeraUsed: false,
    p2TeraUsed: false,
    p1MegaUsed: false,
    p2MegaUsed: false,
    p1Inventory: { items: [] },
    p2Inventory: { items: [] },
  });

  // O checkpoint inicial antecede as habilidades de entrada, como na batalha ao vivo.
  let replay = createBattleReplay(state, config, seed);
  const entryLogs: BattleState['logs'] = [];
  Effects.handleEntryAbilities(state.currentPokemon1!, state.currentPokemon2, false, entryLogs, state);
  Effects.handleEntryAbilities(state.currentPokemon2!, state.currentPokemon1, false, entryLogs, state);

  const finals: BattleState[] = [];
  const p1Moves: string[] = [];
  const events: BattleReplayEvent[] = [];

  for (let turn = 1; turn <= turnCount; turn += 1) {
    const p1Active = state.currentPokemon1!;
    const p2Active = state.currentPokemon2!;
    const p1Move = p1Active.moves[(turn - 1) % p1Active.moves.length];
    const p2Move = p2Active.moves[0];
    const completed = runCoordinatorTurn({
      seed,
      initialState: state,
      p1Action: { type: 'move', data: p1Move, user: p1Active, playerNum: 1, priority: 0 },
      p2Action: { type: 'move', data: p2Move, user: p2Active, playerNum: 2, priority: 0 },
      config,
      preservePrngState: turn > 1,
    });
    events.push(
      createBattleReplayEvent({ turn, player: 1, type: 'move', data: p1Move, user: p1Active }),
      createBattleReplayEvent({ turn, player: 2, type: 'move', data: p2Move, user: p2Active }),
    );
    p1Moves.push(p1Move.name);
    finals.push(completed.finalState);
    replay = appendReplayCheckpoint(replay, turn, completed.finalState);
    state = completed.finalState;
  }

  return {
    replay: { ...replay, events },
    finals,
    p1Moves,
    otherP1Move: turn => p1.moves[turn % p1.moves.length].name,
  };
};

describe('3.4.2 — navegação do replay idempotente durante toda a transição', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  let captures: CoordinatorCapture[];
  let checkpointTurns: number[];
  let uploadHandler: (event: unknown) => Promise<void>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('Rede proibida durante o replay');
    }));
    captures = [];
    checkpointTurns = [];
    cardCaptures.entries = [];
    animatorMock.processStep.mockReset();
    animatorMock.processStep.mockImplementation(async () => {});

    const originalRunTurn = BattleCoordinator.runTurn;
    vi.spyOn(BattleCoordinator, 'runTurn').mockImplementation((state, p1Action, p2Action, config) => {
      const capture: CoordinatorCapture = {
        p1ActionName: p1Action?.data?.name,
        p2ActionName: p2Action?.data?.name,
        snapshots: [],
      };
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

    // Registra cada validação de checkpoint realmente executada.
    const originalAssert = ReplayLogic.assertReplayCheckpoint;
    vi.spyOn(ReplayLogic, 'assertReplayCheckpoint').mockImplementation((replay, turn, state, stateBeforeTurn) => {
      checkpointTurns.push(turn);
      return originalAssert(replay, turn, state, stateBeforeTurn);
    });
  });

  afterEach(async () => {
    if (renderer) {
      const current = renderer;
      await act(async () => current.unmount());
      renderer = undefined;
    }
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const findButton = (label: string) => {
    const button = renderer!.root.findAllByType('button')
      .find(candidate => candidate.children.join('').includes(label));
    const messages = renderer!.root.findAllByType('p').map(node => node.children.join('')).join(' | ');
    expect(button, `${label}: ${messages}`).toBeDefined();
    return button!;
  };

  /** Dispara o clique sem avançar timers: é assim que se clica "durante a pausa". */
  const click = async (label: string) => {
    const button = findButton(label);
    await act(async () => {
      button.props.onClick();
      await Promise.resolve();
    });
  };

  const flush = async () => {
    await act(async () => {
      await vi.runAllTimersAsync();
    });
  };

  /** A reprodução automática encadeia efeitos após cada turno: mais de uma rodada. */
  const settle = async (rounds = 6) => {
    for (let round = 0; round < rounds; round += 1) {
      await flush();
    }
  };

  const clickAndFinish = async (label: string) => {
    await click(label);
    await flush();
  };

  const counter = () => {
    const text = renderer!.root.findAllByType('div').map(node => node.children.join('')).join(' ');
    const match = text.match(/Turno: (\d+) \/ (\d+)/);
    expect(match, text).toBeTruthy();
    return `${match![1]} / ${match![2]}`;
  };

  const alerts = () => renderer!.root.findAllByProps({ role: 'alert' });

  const latestCard = (isPlayer: boolean) => {
    const entry = [...cardCaptures.entries].reverse().find(capture => capture.isPlayer === isPlayer);
    expect(entry, `card do Jogador ${isPlayer ? 1 : 2} não foi renderizado`).toBeDefined();
    return entry!;
  };

  const loadReplay = async (replay: BattleReplay) => {
    if (renderer) {
      const current = renderer;
      await act(async () => current.unmount());
      renderer = undefined;
    }
    captures = [];
    checkpointTurns = [];
    cardCaptures.entries = [];
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(ReplayPlayer, { onClose: () => {} }));
    });
    uploadHandler = renderer!.root.findByProps({ type: 'file' }).props.onChange;
    await act(async () => {
      await uploadHandler({
        target: { files: [{ text: async () => JSON.stringify(replay) }] },
      });
    });
  };

  // 1. Dois cliques rápidos em Próximo.
  it('3.4.2: dois cliques rápidos em Próximo executam o turno uma única vez', async () => {
    const fixture = buildNavigationFixture(4201, 3);
    await loadReplay(fixture.replay);

    await click('Próximo');
    // Durante a pausa inter-turno a transição continua aberta: o controle fica desabilitado.
    expect(findButton('Próximo').props.disabled).toBe(true);
    await click('Próximo');
    await click('Próximo');
    await flush();

    expect(captures).toHaveLength(1);
    expect(captures[0]!.p1ActionName).toBe(fixture.p1Moves[0]);
    expect(checkpointTurns).toEqual([0, 1]);
    expect(counter()).toBe('1 / 3');
    expect(alerts()).toHaveLength(0);
    expect(findButton('Próximo').props.disabled).toBe(false);
  });

  // 2. Próximo + Reproduzir simultâneos.
  it('3.4.2: Próximo e Reproduzir simultâneos não duplicam o mesmo turno', async () => {
    const fixture = buildNavigationFixture(4202, 3);
    await loadReplay(fixture.replay);

    await click('Próximo');
    await click('Reproduzir');
    await settle();

    // Cada turno aparece uma única vez, na ordem gravada: sem repetição do índice 0.
    expect(captures.map(capture => capture.p1ActionName)).toEqual(fixture.p1Moves);
    expect(captures).toHaveLength(3);
    expect(counter()).toBe('3 / 3');
    expect(alerts()).toHaveLength(0);
  });

  // 3. Rajada de cliques em vários turnos.
  it('3.4.2: rajada de cliques mantém a sequência exata dos turnos', async () => {
    const fixture = buildNavigationFixture(4203, 3);
    await loadReplay(fixture.replay);

    for (let turn = 1; turn <= 3; turn += 1) {
      await click('Próximo');
      await click('Próximo');
      await click('Próximo');

      // A rajada não abre outra execução nem avança o índice antes do fim da pausa.
      expect(captures).toHaveLength(turn);
      expect(counter()).toBe(`${turn - 1} / 3`);

      await flush();

      expect(captures).toHaveLength(turn);
      expect(counter()).toBe(`${turn} / 3`);
      expect(withoutLogs(captures[turn - 1]!.snapshots.at(-1)!))
        .toEqual(withoutLogs(fixture.finals[turn - 1]!));
      expect(alerts()).toHaveLength(0);
    }

    expect(captures.map(capture => capture.p1ActionName)).toEqual(fixture.p1Moves);
    expect(checkpointTurns).toEqual([0, 1, 2, 3]);
  });

  // 4. Reiniciar durante a pausa.
  it('3.4.2: Reiniciar durante a pausa preserva o estado inicial sem incremento tardio', async () => {
    const fixture = buildNavigationFixture(4204, 2);
    await loadReplay(fixture.replay);

    await clickAndFinish('Próximo');
    expect(counter()).toBe('1 / 2');
    const capturesAfterFirstTurn = captures.length;

    await click('Próximo');
    await click('Reiniciar');
    await settle(3);

    // Nenhum incremento tardio: o índice permanece em 0 e o estado é o inicial.
    expect(counter()).toBe('0 / 2');
    expect(latestCard(true).pokemon?.hp).toBe(4000);
    expect(latestCard(true).pokemon?.moves[0].uses).toBe(30);
    expect(checkpointTurns.at(-1)).toBe(0);
    expect(captures).toHaveLength(capturesAfterFirstTurn + 1);

    // A trava foi liberada: reiniciar deixa o replay pronto para uso.
    await clickAndFinish('Próximo');
    expect(captures).toHaveLength(capturesAfterFirstTurn + 2);
    expect(counter()).toBe('1 / 2');
    expect(alerts()).toHaveLength(0);
  });

  // 5. Voltar durante a pausa.
  it('3.4.2: Voltar durante a pausa cancela a continuação antiga', async () => {
    const fixture = buildNavigationFixture(4205, 2);
    await loadReplay(fixture.replay);

    await clickAndFinish('Próximo');
    expect(counter()).toBe('1 / 2');
    const capturesAfterFirstTurn = captures.length;

    await click('Próximo');
    await click('Voltar');
    await settle(3);

    // Sem incremento tardio da transição cancelada e estado restaurado ao snapshot 0.
    expect(counter()).toBe('0 / 2');
    expect(latestCard(true).pokemon?.hp).toBe(4000);
    expect(captures).toHaveLength(capturesAfterFirstTurn + 1);

    // Reexecutar depois de voltar continua passando pelos checkpoints.
    await clickAndFinish('Próximo');
    expect(counter()).toBe('1 / 2');
    expect(captures).toHaveLength(capturesAfterFirstTurn + 2);
    expect(withoutLogs(captures.at(-1)!.snapshots.at(-1)!))
      .toEqual(withoutLogs(fixture.finals[0]!));
    expect(alerts()).toHaveLength(0);
  });

  // 6a. Novo upload durante a pausa.
  it('3.4.2: novo upload durante a pausa não recebe escrita tardia do replay anterior', async () => {
    const first = buildNavigationFixture(4206, 2, 'Anterior');
    const second = buildNavigationFixture(4207, 1, 'Novo');
    await loadReplay(first.replay);

    await clickAndFinish('Próximo');
    expect(counter()).toBe('1 / 2');

    await click('Próximo');
    const capturesBeforeUpload = captures.length;
    await act(async () => {
      await uploadHandler({
        target: { files: [{ text: async () => JSON.stringify(second.replay) }] },
      });
    });
    await settle(3);

    // O replay novo começa do zero e nenhuma continuação do anterior escreve nele.
    expect(counter()).toBe('0 / 1');
    expect(captures).toHaveLength(capturesBeforeUpload);
    expect(latestCard(true).pokemon?.name).toBe('Um da Novo');
    expect(alerts()).toHaveLength(0);

    await clickAndFinish('Próximo');
    expect(counter()).toBe('1 / 1');
    expect(withoutLogs(captures.at(-1)!.snapshots.at(-1)!)).toEqual(withoutLogs(second.finals[0]!));
    expect(alerts()).toHaveLength(0);
  });

  // 6b. Desmontagem durante a pausa.
  it('3.4.2: desmontagem durante a pausa descarta timer e continuação pendentes', async () => {
    const fixture = buildNavigationFixture(4208, 2);
    await loadReplay(fixture.replay);
    const consoleError = vi.spyOn(console, 'error');

    await click('Próximo');
    // A pausa inter-turno está agendada enquanto a transição segue aberta.
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    await act(async () => {
      renderer!.unmount();
    });
    renderer = undefined;
    await settle(3);

    expect(vi.getTimerCount()).toBe(0);
    expect(consoleError).not.toHaveBeenCalled();
  });

  // 7. Cópia adulterada continua sendo rejeitada uma única vez.
  it('3.4.2: cópia adulterada continua sendo rejeitada uma única vez', async () => {
    const fixture = buildNavigationFixture(4209, 2);
    const tamperedMove = fixture.otherP1Move(1);
    const tampered: BattleReplay = {
      ...fixture.replay,
      events: fixture.replay.events.map(event => (
        event.turn === 1 && event.actorId === 1 ? { ...event, moveId: tamperedMove } : event
      )),
    };
    expect(tamperedMove).not.toBe(fixture.p1Moves[0]);

    // Mantém a transição no primeiro passo do generator para a rajada cair dentro dela.
    animatorMock.processStep.mockImplementation(() => new Promise<void>(resolve => {
      setTimeout(resolve, 100);
    }));

    await loadReplay(tampered);

    await click('Próximo');
    expect(findButton('Próximo').props.disabled).toBe(true);
    await click('Próximo');
    await click('Próximo');
    await settle(3);

    expect(alerts()).toHaveLength(1);
    expect(alerts()[0]!.children.join('')).toContain('Divergência de replay no turno 1');
    expect(captures).toHaveLength(1);
    expect(checkpointTurns).toEqual([0, 1]);
    expect(counter()).toBe('0 / 2');
    expect(fetch).not.toHaveBeenCalled();
  });

  // 8. Fluxo normal e reprodução completa.
  it('3.4.2: fluxo manual e reprodução automática completa permanecem corretos', async () => {
    const fixture = buildNavigationFixture(4210, 3);

    await loadReplay(fixture.replay);
    for (let turn = 1; turn <= 3; turn += 1) {
      await clickAndFinish('Próximo');
      expect(captures).toHaveLength(turn);
      expect(counter()).toBe(`${turn} / 3`);
      expect(withoutLogs(captures[turn - 1]!.snapshots.at(-1)!))
        .toEqual(withoutLogs(fixture.finals[turn - 1]!));
      expect(alerts()).toHaveLength(0);
    }
    // No fim da reprodução manual não há mais turno a executar.
    expect(findButton('Próximo').props.disabled).toBe(true);
    expect(findButton('Reproduzir').props.disabled).toBe(true);

    await loadReplay(fixture.replay);
    await click('Reproduzir');
    await settle(8);

    expect(captures).toHaveLength(3);
    expect(counter()).toBe('3 / 3');
    captures.forEach((capture, index) => {
      expect(withoutLogs(capture.snapshots.at(-1)!)).toEqual(withoutLogs(fixture.finals[index]!));
    });
    expect(captures.map(capture => capture.p1ActionName)).toEqual(fixture.p1Moves);
    expect(alerts()).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});