import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReplayPlayer from '../../components/ReplayPlayer';
import { BattleCoordinator } from '../../services/engine/coordinator';
import * as BattleEngine from '../../services/engine';
import * as Effects from '../../services/effectHandlers';
import * as ReplayLogic from '../../services/replayLogic';
import {
  appendReplayCheckpoint,
  createBattleReplay,
  createBattleReplayEvent,
} from '../../services/replayLogic';
import type { Action, BattleConfig, BattleReplay, BattleState, Pokemon } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, runCoordinatorTurn, type CompletedTurn } from './coordinator.helpers';

// O card real é substituído por um espião de props: cada render expõe o estado que a UI
// realmente recebeu, permitindo comparar a instância do ativo com a da equipe.
const cardCaptures = vi.hoisted(() => ({
  entries: [] as { pokemon: Pokemon | null; team: Pokemon[]; isPlayer: boolean }[],
}));

vi.mock('../../components/PokemonCard', () => ({
  PokemonCard: (props: { pokemon: Pokemon | null; team: Pokemon[]; isPlayer: boolean }) => {
    cardCaptures.entries.push({ pokemon: props.pokemon, team: props.team, isPlayer: props.isPlayer });
    return null;
  },
}));
vi.mock('../../components/BattleLayout', () => ({ BattleHeader: () => null }));
vi.mock('../../services/animation/turnAnimator', () => ({
  TurnAnimator: { processStep: vi.fn(async () => {}) },
}));

interface CoordinatorCapture {
  p1Action?: Action;
  p2Action?: Action;
  snapshots: BattleState[];
}

interface CheckpointCapture {
  turn: number;
  state: BattleState;
  stateBeforeTurn?: BattleState;
}

interface ReplayFixture {
  replay: BattleReplay;
  initialState: BattleState;
  config: BattleConfig;
  turn1: CompletedTurn;
  turn2: CompletedTurn;
}

const withoutLogs = (state: BattleState): BattleState => {
  const normalized = JSON.parse(JSON.stringify(state)) as BattleState;
  normalized.logs = [];
  return normalized;
};

/**
 * Equipe de dois turnos executada pelo coordenador real, com habilidades de entrada
 * aplicadas na mesma ordem do ReplayPlayer. A Intimidação altera o statStage do oponente
 * durante a entrada: sem a identidade ativo/equipe esse efeito se perde no primeiro turno.
 */
const buildReplayFixture = (
  seed: number,
  options: { intimidate?: boolean; megaProfile?: boolean } = {},
): ReplayFixture => {
  const p1 = createPokemon({
    id: 401,
    name: 'Um do Replay',
    hp: 400,
    maxHP: 400,
    speedStat: 120,
    ability: options.intimidate ? 'intimidate' : 'synchronize',
    moves: [
      createMove({
        name: 'brasa-replay',
        displayName: 'Brasa do Replay',
        power: 40,
        type: 'fire',
        uses: 10,
        maxUses: 10,
        effect: { status: 'burn', chance: 100 },
      }),
      createMove({ name: 'golpe-replay', displayName: 'Golpe do Replay', power: 60, uses: 10, maxUses: 10 }),
    ],
  });
  const p2 = createPokemon({
    id: 402,
    name: 'Dois do Replay',
    hp: 500,
    maxHP: 500,
    speedStat: 90,
    moves: [createMove({ name: 'resposta-replay', displayName: 'Resposta do Replay', power: 45, uses: 10, maxUses: 10 })],
  });
  const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
  const initialState = createBattleState([p1], [p2], {
    prngState: createBattlePRNGState(seed),
    p1TeraUsed: false,
    p2TeraUsed: false,
    p1MegaUsed: false,
    p2MegaUsed: false,
  });
  let replay = createBattleReplay(initialState, config, seed);

  // O checkpoint inicial antecede as habilidades de entrada, como na batalha ao vivo.
  const entryLogs: BattleState['logs'] = [];
  Effects.handleEntryAbilities(initialState.currentPokemon1!, initialState.currentPokemon2, false, entryLogs, initialState);
  Effects.handleEntryAbilities(initialState.currentPokemon2!, initialState.currentPokemon1, false, entryLogs, initialState);

  if (options.megaProfile) {
    // Hidratação assíncrona real: o perfil chega depois da criação do replay inicial.
    initialState.currentPokemon2!.megaProfile = {
      name: 'Mega Dois do Replay',
      stats: { hp: 80, attack: 135, defense: 85, spAttack: 70, spDefense: 95, speed: 150 },
      ability: 'tough-claws',
      types: ['rock', 'flying'],
      spriteUrl: 'mega-dois.png',
      backSpriteUrl: 'mega-dois-back.png',
      pixelSpriteUrl: 'mega-dois-pixel.png',
      weight: 790,
    };
  }

  const firstP1Action: Action = { type: 'move', data: p1.moves[0], user: p1, playerNum: 1, priority: 0 };
  const firstP2Action: Action = { type: 'move', data: p2.moves[0], user: p2, playerNum: 2, priority: 0 };
  const turn1 = runCoordinatorTurn({
    seed, initialState, p1Action: firstP1Action, p2Action: firstP2Action, config,
  });

  const secondP1 = turn1.finalState.currentPokemon1!;
  const secondP2 = turn1.finalState.currentPokemon2!;
  const turn2 = runCoordinatorTurn({
    seed,
    initialState: turn1.finalState,
    p1Action: { type: 'move', data: secondP1.moves[0], user: secondP1, playerNum: 1, priority: 0 },
    p2Action: { type: 'move', data: secondP2.moves[0], user: secondP2, playerNum: 2, priority: 0 },
    config,
    preservePrngState: true,
  });

  replay = appendReplayCheckpoint({
    ...replay,
    events: [
      createBattleReplayEvent({ turn: 1, player: 1, type: 'move', data: p1.moves[0], user: p1 }),
      createBattleReplayEvent({ turn: 1, player: 2, type: 'move', data: p2.moves[0], user: p2 }),
      createBattleReplayEvent({ turn: 2, player: 1, type: 'move', data: secondP1.moves[0], user: secondP1 }),
      createBattleReplayEvent({ turn: 2, player: 2, type: 'move', data: secondP2.moves[0], user: secondP2 }),
    ],
  }, 1, turn1.finalState);
  replay = appendReplayCheckpoint(replay, 2, turn2.finalState);

  return { replay, initialState, config, turn1, turn2 };
};

/** O substituto precisa ser exatamente o objeto da equipe do snapshot, não uma cópia. */
const expectActiveIsTeamEntry = (state: BattleState, player: 1 | 2): Pokemon => {
  const active = player === 1 ? state.currentPokemon1 : state.currentPokemon2;
  const team = player === 1 ? state.team1 : state.team2;
  expect(active).not.toBeNull();
  const entry = team.find(pokemon => pokemon.instanceId === active!.instanceId);
  expect(entry, `instância ${active!.instanceId} ausente da equipe do Jogador ${player}`).toBeDefined();
  expect(active).toBe(entry);
  return active!;
};

describe('3.3 — identidade entre o Pokémon ativo e sua entrada na equipe', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined;
  let captures: CoordinatorCapture[];
  let checkpoints: CheckpointCapture[];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('fetch', vi.fn(() => {
      throw new Error('Rede proibida durante o replay');
    }));
    captures = [];
    checkpoints = [];
    cardCaptures.entries = [];

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

    // Espia o estado exato entregue à verificação de checkpoint.
    const originalAssert = ReplayLogic.assertReplayCheckpoint;
    vi.spyOn(ReplayLogic, 'assertReplayCheckpoint').mockImplementation((replay, turn, state, stateBeforeTurn) => {
      checkpoints.push({ turn, state, stateBeforeTurn });
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

  const clickButton = async (label: string) => {
    const button = renderer!.root.findAllByType('button')
      .find(candidate => candidate.children.join('').includes(label));
    const messages = renderer!.root.findAllByType('p').map(node => node.children.join('')).join(' | ');
    expect(button, `${label}: ${messages}`).toBeDefined();
    await act(async () => {
      button!.props.onClick();
      await Promise.resolve();
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
  };

  const loadReplay = async (replay: BattleReplay) => {
    cardCaptures.entries = [];
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

  const latestCard = (isPlayer: boolean) => {
    const entry = [...cardCaptures.entries].reverse().find(capture => capture.isPlayer === isPlayer);
    expect(entry, `card do Jogador ${isPlayer ? 1 : 2} não foi renderizado`).toBeDefined();
    return entry!;
  };

  const expectNoAlert = () => {
    expect(renderer!.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
  };

  it('3.3: o reset liga o ativo à equipe clonada e preserva a identidade ao reiniciar', async () => {
    const { replay } = buildReplayFixture(3301, { intimidate: true });

    await loadReplay(replay);

    const initial = checkpoints.find(capture => capture.turn === 0)!.state;
    expect(initial.currentPokemon1).toBe(initial.team1[0]);
    expect(initial.currentPokemon2).toBe(initial.team2[0]);
    // Clones próprios: a reprodução não reutiliza as equipes do arquivo.
    expect(initial.team1[0].instanceId).toBe('p1-slot-0');
    expect(initial.currentPokemon1).not.toBe(replay.initialState.team1[0]);

    const p1Card = latestCard(true);
    const p2Card = latestCard(false);
    expect(p1Card.pokemon).toBe(p1Card.team[0]);
    expect(p2Card.pokemon).toBe(p2Card.team[0]);

    await clickButton('Próximo');
    await clickButton('Reiniciar');

    const restarted = checkpoints.filter(capture => capture.turn === 0).at(-1)!.state;
    expect(restarted.currentPokemon1).toBe(restarted.team1[0]);
    expect(restarted.currentPokemon2).toBe(restarted.team2[0]);
    expect(latestCard(true).pokemon).toBe(latestCard(true).team[0]);
    expect(latestCard(false).pokemon).toBe(latestCard(false).team[0]);
    expectNoAlert();
  });

  it('3.3: dano, PP, status e efeito de entrada chegam à mesma instância do ativo e da equipe', async () => {
    const { replay, turn1 } = buildReplayFixture(3302, { intimidate: true });

    await loadReplay(replay);
    await clickButton('Próximo');

    expect(captures).toHaveLength(1);
    const finalState = captures[0]!.snapshots.at(-1)!;
    const repaired = captures[0]!.snapshots.every(snapshot =>
      snapshot.currentPokemon1 === snapshot.team1[0] && snapshot.currentPokemon2 === snapshot.team2[0]);
    expect(repaired).toBe(true);

    const originalP2 = turn1.finalState.team2[0];
    const replayP2 = expectActiveIsTeamEntry(finalState, 2);
    const replayP1 = expectActiveIsTeamEntry(finalState, 1);

    // Dano e status: valores idênticos porque é o mesmo objeto.
    expect(replayP2.hp).toBe(originalP2.hp);
    expect(replayP2.hp).toBeLessThan(500);
    expect(replayP2.statusEffects.burn).toBeDefined();
    expect(finalState.currentPokemon2!.statusEffects).toBe(finalState.team2[0].statusEffects);

    // PP consumido no golpe da equipe, não em uma cópia paralela.
    expect(replayP1.moves[0].uses).toBe(9);
    expect(finalState.currentPokemon1!.moves[0].uses).toBe(finalState.team1[0].moves[0].uses);

    // Efeito da habilidade de entrada aplicado antes do turno sobrevive à fronteira transacional.
    expect(finalState.team2[0].statStages.attack).toBe(-1);
    expect(finalState.currentPokemon2!.statStages).toBe(finalState.team2[0].statStages);

    expect(withoutLogs(finalState)).toEqual(withoutLogs(turn1.finalState));
    expectNoAlert();
  });

  it('3.3: U-turn entrega o substituto exato da entrada da equipe', async () => {
    const attacker = createPokemon({
      id: 111,
      name: 'U-turn do Replay',
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
    const reserve = createPokemon({ id: 112, name: 'Reserva do U-turn', hp: 400, maxHP: 400 });
    const defender = createPokemon({
      id: 211,
      name: 'Oponente do U-turn',
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
      prngState: createBattlePRNGState(3303),
    });
    const forcedAction: Action = { type: 'switch', data: reserve, user: attacker, playerNum: 1, priority: 6 };
    const live = runCoordinatorTurn({
      seed: 3303,
      initialState,
      p1Action: { type: 'move', data: attacker.moves[0], user: attacker, playerNum: 1, priority: 0 },
      p2Action: { type: 'move', data: defender.moves[0], user: defender, playerNum: 2, priority: 0 },
      config,
      chooseForcedSwitch: () => forcedAction,
    });
    const replayData = appendReplayCheckpoint({
      ...createBattleReplay(initialState, config, 3303),
      events: [
        createBattleReplayEvent({ turn: 1, player: 1, type: 'move', data: attacker.moves[0], user: attacker }),
        createBattleReplayEvent({ turn: 1, player: 2, type: 'move', data: defender.moves[0], user: defender }),
        createBattleReplayEvent({ turn: 1, player: 1, type: 'switch', data: reserve, user: attacker, isForcedSwitch: true }),
      ],
    }, 1, live.finalState);

    await loadReplay(replayData);
    await clickButton('Próximo');

    const finalState = captures[0]!.snapshots.at(-1)!;
    const substitute = expectActiveIsTeamEntry(finalState, 1);
    expect(substitute.instanceId).toBe(reserve.instanceId);
    expect(substitute.name).toBe(reserve.name);
    // A entrada anterior continua na equipe como o mesmo objeto, sem duplicação.
    expect(finalState.team1.filter(pokemon => pokemon.instanceId === reserve.instanceId)).toHaveLength(1);
    expect(withoutLogs(finalState)).toEqual(withoutLogs(live.finalState));
    expectNoAlert();
  });

  it('3.3: troca pós-desmaio entrega o substituto exato da entrada da equipe', async () => {
    const attacker = createPokemon({
      id: 121,
      name: 'Atacante do Replay',
      hp: 400,
      maxHP: 400,
      attackStat: 400,
      speedStat: 200,
      moves: [createMove({ name: 'knockout-move', power: 500, uses: 10, maxUses: 10 })],
    });
    const defeated = createPokemon({
      id: 221,
      name: 'Titular do Replay',
      hp: 30,
      maxHP: 30,
      defenseStat: 1,
      speedStat: 100,
      moves: [createMove({ name: 'defeated-move' })],
    });
    const reserve = createPokemon({ id: 222, name: 'Reserva do Desmaio', hp: 300, maxHP: 300 });
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
    const initialState = createBattleState([attacker], [defeated, reserve], {
      p1TeraUsed: false,
      p2TeraUsed: false,
      p1MegaUsed: false,
      p2MegaUsed: false,
      prngState: createBattlePRNGState(3304),
    });
    const live = runCoordinatorTurn({
      seed: 3304,
      initialState,
      p1Action: { type: 'move', data: attacker.moves[0], user: attacker, playerNum: 1, priority: 0 },
      p2Action: { type: 'move', data: defeated.moves[0], user: defeated, playerNum: 2, priority: 0 },
      config,
    });
    expect(live.finalState.currentPokemon2?.isFainted).toBe(true);
    const replayData = appendReplayCheckpoint({
      ...createBattleReplay(initialState, config, 3304),
      events: [
        createBattleReplayEvent({ turn: 1, player: 1, type: 'move', data: attacker.moves[0], user: attacker }),
        createBattleReplayEvent({ turn: 1, player: 2, type: 'move', data: defeated.moves[0], user: defeated }),
        createBattleReplayEvent({ turn: 2, player: 2, type: 'switch', data: reserve, user: defeated, isForcedSwitch: true }),
      ],
    }, 1, live.finalState);

    await loadReplay(replayData);
    await clickButton('Próximo');

    const switchSpy = vi.spyOn(BattleEngine, 'performSwitch');
    await clickButton('Próximo');

    expect(switchSpy).toHaveBeenCalledTimes(1);
    const switched = switchSpy.mock.results[0]!.value.newState as BattleState;
    const substitute = expectActiveIsTeamEntry(switched, 2);
    expect(substitute.instanceId).toBe(reserve.instanceId);
    expect(substitute.hp).toBe(reserve.hp);
    expect(switched.team2.filter(pokemon => pokemon.instanceId === reserve.instanceId)).toHaveLength(1);
    expectNoAlert();
  });

  it('3.3: hidratação do perfil Mega não separa o ativo da equipe', async () => {
    const { replay } = buildReplayFixture(3305, { megaProfile: true });
    expect(replay.checkpoints?.[0]?.megaProfiles).toBeUndefined();
    expect(replay.checkpoints?.[1]?.megaProfiles?.['p2-slot-0']).toBeDefined();

    await loadReplay(replay);
    await clickButton('Próximo');

    const verified = checkpoints.find(capture => capture.turn === 1)!.state;
    const active = expectActiveIsTeamEntry(verified, 2);
    expect(active.megaProfile?.name).toBe('Mega Dois do Replay');
    expect(active.megaProfile?.stats.attack).toBe(135);
    expect(verified.team2[0].megaProfile).toBe(active.megaProfile);
    expect(latestCard(false).pokemon?.megaProfile?.name).toBe('Mega Dois do Replay');
    expect(latestCard(false).pokemon).toBe(latestCard(false).team[0]);
    expectNoAlert();
  });

  it('3.3: voltar turno mantém a identidade dentro de cada snapshot, sem compartilhar entre snapshots', async () => {
    const { replay, turn1, turn2 } = buildReplayFixture(3306);

    await loadReplay(replay);
    await clickButton('Próximo');
    await clickButton('Próximo');

    expect(captures).toHaveLength(2);
    const firstTurnState = captures[0]!.snapshots.at(-1)!;
    const secondTurnState = captures[1]!.snapshots.at(-1)!;

    expectActiveIsTeamEntry(firstTurnState, 1);
    expectActiveIsTeamEntry(firstTurnState, 2);
    expectActiveIsTeamEntry(secondTurnState, 1);
    expectActiveIsTeamEntry(secondTurnState, 2);

    // Cada snapshot tem suas próprias instâncias: nada de aliases entre turnos diferentes.
    expect(secondTurnState.team1).not.toBe(firstTurnState.team1);
    expect(secondTurnState.currentPokemon1).not.toBe(firstTurnState.currentPokemon1);
    expect(secondTurnState.currentPokemon2).not.toBe(firstTurnState.currentPokemon2);
    expect(firstTurnState.team1[0].hp).toBe(turn1.finalState.team1[0].hp);
    expect(secondTurnState.team1[0].hp).toBe(turn2.finalState.team1[0].hp);

    await clickButton('Voltar');

    const restoredP1 = latestCard(true);
    const restoredP2 = latestCard(false);
    expect(restoredP1.team).toBe(firstTurnState.team1);
    expect(restoredP1.pokemon).toBe(firstTurnState.currentPokemon1);
    expect(restoredP2.team).toBe(firstTurnState.team2);
    expect(restoredP2.pokemon).toBe(firstTurnState.currentPokemon2);
    expect(restoredP1.pokemon).toBe(restoredP1.team[0]);
    expect(restoredP2.pokemon).toBe(restoredP2.team[0]);

    // Reexecutar o turno a partir do snapshot restaurado mantém identidade e mesmos valores.
    await clickButton('Próximo');

    expect(captures).toHaveLength(3);
    const replayed = captures[2]!.snapshots.at(-1)!;
    expectActiveIsTeamEntry(replayed, 1);
    expectActiveIsTeamEntry(replayed, 2);
    expect(withoutLogs(replayed)).toEqual(withoutLogs(secondTurnState));
    expectNoAlert();
  });

  it('3.3: a reprodução completa permanece determinística', async () => {
    const { replay, turn1, turn2 } = buildReplayFixture(3307);

    await loadReplay(replay);
    await clickButton('Próximo');
    await clickButton('Próximo');
    const firstRun = captures.map(capture => capture.snapshots.map(withoutLogs));
    const firstTurnFinal = captures[0]!.snapshots.at(-1)!;
    const firstFinal = captures[1]!.snapshots.at(-1)!;
    expectNoAlert();

    await loadReplay(replay);
    await clickButton('Próximo');
    await clickButton('Próximo');
    const secondRun = captures.map(capture => capture.snapshots.map(withoutLogs));
    const secondFinal = captures[1]!.snapshots.at(-1)!;
    expectNoAlert();

    expect(secondRun).toEqual(firstRun);
    expect(secondFinal.prngState).toEqual(firstFinal.prngState);
    expect(secondFinal.currentPokemon1).not.toBe(firstFinal.currentPokemon1);
    expect(withoutLogs(firstTurnFinal)).toEqual(withoutLogs(turn1.finalState));
    expect(withoutLogs(secondFinal)).toEqual(withoutLogs(turn2.finalState));
    expect(secondFinal.prngState).toEqual(turn2.finalState.prngState);
    expect(fetch).not.toHaveBeenCalled();
  });
});