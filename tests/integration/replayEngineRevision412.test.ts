import { describe, expect, it } from 'vitest';
import {
  appendReplayCheckpoint,
  assertReplayCheckpoint,
  buildReplayTurnAction,
  createBattleReplay,
  hashBattleReplayState,
  REPLAY_ENGINE_REVISION,
  REPLAY_FORMAT_VERSION,
} from '../../services/replayLogic';
import type { Action, BattleReplayEvent } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';

// 4.1.2 — Os efeitos temporários passaram a ter ciclo de vida completo. A revisão semântica do motor
// precisa registrar isso para que replays antigos sejam reconhecidos como gravados por
// regras anteriores, sem criar tolerância que esconda divergências reais.
// formatVersion permanece 1: o formato do arquivo não mudou.

const SEED = 4116;

const CONFIG = createBattleConfig({
  forceAccuracyOutcome: 'hit',
  fixedRoll: 92.5,
  itemsEnabled: false,
});

const buildTeams = () => {
  const rockMove = createMove({
    name: 'rock-slide',
    displayName: 'Deslize de Rochas',
    type: 'rock',
    power: 75,
    damageClass: 'physical',
    accuracy: 100,
    uses: 10,
    maxUses: 10,
  });
  const tackle = createMove({
    name: 'tackle',
    displayName: 'Investida',
    type: 'normal',
    power: 40,
    accuracy: 100,
    uses: 10,
    maxUses: 10,
  });
  const bombirdier = createPokemon({
    id: 11,
    name: 'Bombirdier',
    types: ['flying', 'dark'],
    ability: 'rocky-payload',
    speedStat: 120,
    attackStat: 120,
    moves: [rockMove],
  });
  const target = createPokemon({
    id: 22,
    name: 'Alvo',
    types: ['normal'],
    speedStat: 80,
    hp: 320,
    maxHP: 320,
    moves: [tackle],
  });

  return { rockMove, tackle, bombirdier, target };
};

describe('4.1.2 revisão semântica do replay', () => {
  it('avança a revisão do motor sem mudar o formato', () => {
    expect(REPLAY_ENGINE_REVISION).toBe('4.1.2');
    expect(REPLAY_FORMAT_VERSION).toBe(1);
  });

  it('reproduz estado final, hash e cursores idênticos com as regras corrigidas', () => {
    const { rockMove, tackle, bombirdier, target } = buildTeams();

    const liveState = createBattleState([bombirdier], [target], {
      prngState: createBattlePRNGState(SEED),
    });
    const replay = createBattleReplay(liveState, CONFIG, SEED);
    expect(replay.engineRevision).toBe('4.1.2');

    const liveActions = {
      p1Action: { type: 'move', data: rockMove, user: bombirdier, playerNum: 1 } as Action,
      p2Action: { type: 'move', data: tackle, user: target, playerNum: 2 } as Action,
    };
    const live = runCoordinatorTurn({
      seed: SEED,
      initialState: liveState,
      ...liveActions,
      config: CONFIG,
    });
    const withCheckpoint = appendReplayCheckpoint(replay, 1, live.finalState);
    expect(() => assertReplayCheckpoint(withCheckpoint, 1, live.finalState)).not.toThrow();

    const replayState = createBattleState([bombirdier], [target], {
      prngState: createBattlePRNGState(SEED),
    });
    const p1Event: BattleReplayEvent = {
      turn: 1,
      actionType: 'move',
      actorId: 1,
      actorInstanceId: bombirdier.instanceId,
      moveId: 'rock-slide',
    };
    const p2Event: BattleReplayEvent = {
      turn: 1,
      actionType: 'move',
      actorId: 2,
      actorInstanceId: target.instanceId,
      moveId: 'tackle',
    };
    const p1Action = buildReplayTurnAction(replayState, p1Event, 1, 1);
    const p2Action = buildReplayTurnAction(replayState, p2Event, 2, 1);
    expect(p1Action).toBeDefined();
    expect(p2Action).toBeDefined();

    const replayed = runCoordinatorTurn({
      seed: SEED,
      initialState: replayState,
      p1Action,
      p2Action,
      config: CONFIG,
    });

    const checkpoint = withCheckpoint.checkpoints!.find(entry => entry.turn === 1)!;
    expect(hashBattleReplayState(replayed.finalState)).toBe(checkpoint.stateHash);
    expect(replayed.randomDraws).toBe(checkpoint.prngState.cursor);
  });

  it('a nova revisão não tolera divergência real', () => {
    const { rockMove, tackle, bombirdier, target } = buildTeams();
    const liveState = createBattleState([bombirdier], [target], {
      prngState: createBattlePRNGState(SEED),
    });
    const replay = createBattleReplay(liveState, CONFIG, SEED);
    const live = runCoordinatorTurn({
      seed: SEED,
      initialState: liveState,
      p1Action: { type: 'move', data: rockMove, user: bombirdier, playerNum: 1 } as Action,
      p2Action: { type: 'move', data: tackle, user: target, playerNum: 2 } as Action,
      config: CONFIG,
    });
    const withCheckpoint = appendReplayCheckpoint(replay, 1, live.finalState);
    const tampered = structuredClone(live.finalState);
    tampered.team2[0].hp -= 1;

    expect(() => assertReplayCheckpoint(withCheckpoint, 1, tampered))
      .toThrow(/Divergência de replay no turno 1/);
  });
});