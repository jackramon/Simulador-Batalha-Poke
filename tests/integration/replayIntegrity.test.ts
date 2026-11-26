import { describe, expect, it } from 'vitest';
import {
  appendReplayCheckpoint,
  assertReplayCheckpoint,
  createBattleReplay,
  createReplayCheckpoint,
  hashBattleReplayState,
  parseBattleReplay,
  REPLAY_ENGINE_REVISION,
  REPLAY_FORMAT_VERSION,
} from '../../services/replayLogic';
import type { BattleReplay, BattleState } from '../../types';
import { createBattlePRNGState, nextBattleRandom } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

const createVerifiedFixture = () => {
  const seed = 3201;
  const attacker = createPokemon({
    id: 101,
    name: 'Atacante Íntegro',
    hp: 300,
    maxHP: 300,
    speedStat: 120,
    moves: [createMove({ name: 'golpe-integro', power: 45, uses: 10, maxUses: 10 })],
  });
  const defender = createPokemon({
    id: 201,
    name: 'Defensor Íntegro',
    hp: 300,
    maxHP: 300,
    speedStat: 80,
    moves: [createMove({ name: 'resposta-integra', power: 35, uses: 12, maxUses: 12 })],
  });
  const initialState = createBattleState([attacker], [defender], {
    prngState: createBattlePRNGState(seed),
  });
  const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
  const replay = createBattleReplay(initialState, config, seed);
  const live = runCoordinatorTurn({
    seed,
    initialState,
    p1Action: createMoveAction(attacker, attacker.moves[0], 1),
    p2Action: createMoveAction(defender, defender.moves[0], 2),
    config,
  });
  return { initialState, live, replay: appendReplayCheckpoint(replay, 1, live.finalState) };
};

describe('integridade e versionamento do replay', () => {
  it('3.2: exporta versão, revisão do motor e checkpoints inicial e por turno, sem snapshots', () => {
    const { replay } = createVerifiedFixture();
    const serialized = JSON.parse(JSON.stringify(replay)) as BattleReplay;

    expect(serialized.formatVersion).toBe(REPLAY_FORMAT_VERSION);
    expect(serialized.engineRevision).toBe(REPLAY_ENGINE_REVISION);
    expect(serialized.checkpoints?.map(checkpoint => checkpoint.turn)).toEqual([0, 1]);
    expect(serialized.checkpoints?.[0]).toMatchObject({
      prngState: { seed: 3201, state: 3201, cursor: 0 },
      stateHash: expect.stringMatching(/^[a-z0-9]+:[0-9a-f]{8}$/),
    });
    expect(serialized.checkpoints?.[1]?.prngState.cursor).toBeGreaterThan(0);
    expect(serialized.checkpoints?.[1]?.stateHash).not.toBe(serialized.checkpoints?.[0]?.stateHash);
    expect(serialized.checkpoints?.every(checkpoint => !('snapshot' in checkpoint))).toBe(true);
  });

  it('mantém o hash estável com chaves reordenadas, clones e apresentação alterada', () => {
    const state = createBattleState(
      [createPokemon({ id: 1, spriteUrl: 'sprite-original', moves: [createMove()] })],
      [createPokemon({ id: 2 })],
      {
        prngState: createBattlePRNGState(77),
        logs: [{ message: 'Log original', color: 'text-original' }],
      },
    );
    const reordered = Object.fromEntries(Object.entries(structuredClone(state)).reverse()) as BattleState;

    expect(hashBattleReplayState(reordered)).toBe(hashBattleReplayState(state));
    expect(hashBattleReplayState(structuredClone(state))).toBe(hashBattleReplayState(state));

    const presentationOnly = structuredClone(state);
    presentationOnly.logs = [{ message: 'Log completamente diferente', color: 'text-other' }];
    presentationOnly.waitingForAction = !state.waitingForAction;
    presentationOnly.team1[0].name = 'Nome apenas visual';
    presentationOnly.team1[0].spriteUrl = 'sprite-alterado';
    presentationOnly.team1[0].fallbackUrls = ['fallback-alterado'];
    presentationOnly.team1[0].isShiny = true;
    presentationOnly.team1[0].moves[0].displayName = 'Nome de apresentação';
    presentationOnly.team1[0].moves[0].description = 'Descrição de apresentação';

    expect(hashBattleReplayState(presentationOnly)).toBe(hashBattleReplayState(state));
  });

  it('altera o hash quando HP, PP, status, campo, inventário, vencedor ou regra relevante muda', () => {
    const state = createBattleState(
      [createPokemon({ id: 1, moves: [createMove()] })],
      [createPokemon({ id: 2 })],
      { prngState: createBattlePRNGState(88) },
    );
    const originalHash = hashBattleReplayState(state);
    const mutations: Array<(clone: BattleState) => void> = [
      clone => { clone.team1[0].hp -= 1; },
      clone => { clone.team1[0].moves[0].uses -= 1; },
      clone => { clone.team1[0].statusEffects.burn = { turns: 1 }; },
      clone => { clone.team1[0].statStages.attack = 1; },
      clone => { clone.weather = 'rain'; clone.weatherTurns = 5; },
      clone => { clone.p1Hazards.spikes = 1; },
      clone => { clone.p1Inventory.items = [{ id: 'potion', quantity: 2 }]; },
      clone => { clone.winner = 1; clone.isBattleInProgress = false; },
      clone => { clone.team1[0].moves[0].power += 1; },
      clone => { clone.prngState!.cursor += 1; },
    ];

    for (const mutate of mutations) {
      const changed = structuredClone(state);
      mutate(changed);
      expect(hashBattleReplayState(changed)).not.toBe(originalHash);
    }
  });

  it('não altera o snapshot nem a sequência do PRNG ao criar hashes e checkpoints', () => {
    const state = createBattleState(
      [createPokemon({ id: 1, moves: [createMove()] })],
      [createPokemon({ id: 2 })],
      { prngState: createBattlePRNGState(99) },
    );
    const control = structuredClone(state);
    const replay = createBattleReplay(state, createBattleConfig(), 99);

    hashBattleReplayState(state);
    createReplayCheckpoint(0, state);
    appendReplayCheckpoint(replay, 1, state);

    expect(state).toEqual(control);
    expect(nextBattleRandom(state)).toBe(nextBattleRandom(control));
  });

  it('rejeita versão futura e lê explicitamente o formato antigo como legado sem verificação', () => {
    const { initialState, live, replay } = createVerifiedFixture();
    expect(() => parseBattleReplay({ ...replay, formatVersion: REPLAY_FORMAT_VERSION + 1 }))
      .toThrow(`Versão de replay ${REPLAY_FORMAT_VERSION + 1} não suportada`);

    const legacy: BattleReplay = {
      initialState: structuredClone(replay.initialState),
      seed: replay.seed,
      events: structuredClone(replay.events),
    };
    const parsed = parseBattleReplay(JSON.parse(JSON.stringify(legacy)));

    expect(parsed.legacy).toBe(true);
    expect(parsed.replay.formatVersion).toBeUndefined();
    expect(parsed.replay.checkpoints).toBeUndefined();
    expect(parsed.warning).toContain('sem verificação');
    expect(() => assertReplayCheckpoint(parsed.replay, 1, live.finalState)).not.toThrow();
    expect(initialState.turn).toBe(1);
  });

  it('interrompe no checkpoint divergente informando turno e hashes esperado e obtido', () => {
    const { live, replay } = createVerifiedFixture();
    const changed = structuredClone(live.finalState);
    changed.team1[0].hp -= 1;
    const actualHash = hashBattleReplayState(changed);
    const expectedHash = replay.checkpoints?.[1]?.stateHash;

    let error: Error | undefined;
    try {
      assertReplayCheckpoint(replay, 1, changed);
    } catch (caught) {
      error = caught as Error;
    }

    expect(error?.message).toContain('Divergência de replay no turno 1');
    expect(error?.message).toContain(`hash esperado ${expectedHash}`);
    expect(error?.message).toContain(`hash obtido ${actualHash}`);
  });
});
