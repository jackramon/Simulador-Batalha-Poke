import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  appendReplayCheckpoint,
  applyReplayCheckpointMegaProfiles,
  assertReplayCheckpoint,
  buildReplayForcedSwitchAction,
  buildReplayTurnAction,
  createBattleReplay,
  hashBattleReplayState,
  normalizeReplayTeams,
  parseBattleReplay,
  REPLAY_ENGINE_REVISION,
  resolveReplaySwitchTarget,
} from '../../services/replayLogic';
import { BattleCoordinator } from '../../services/engine/coordinator';
import { TurnAnimator } from '../../services/animation/turnAnimator';
import * as BattleEngine from '../../services/engine';
import * as Effects from '../../services/effectHandlers';
import type { BattleReplay, BattleState } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

// Fixture derivada do replay real anexado ao hotfix 3.2.2 (seed 662638). Só os campos
// de apresentação foram removidos; os hashes gravados são os originais do arquivo.
const FIXTURE_URL = new URL('../fixtures/replay-3.2.1-hash-divergente.json', import.meta.url);
const loadFixture = (): BattleReplay =>
  parseBattleReplay(JSON.parse(readFileSync(FIXTURE_URL, 'utf8'))).replay;

const buildInitialState = (data: BattleReplay): BattleState => {
  const normalizedTeams = normalizeReplayTeams(data.initialState);
  const state: BattleState = {
    prngState: createBattlePRNGState(data.seed),
    team1: structuredClone(normalizedTeams.team1),
    team2: structuredClone(normalizedTeams.team2),
    currentPokemon1: structuredClone(normalizedTeams.team1[0]),
    currentPokemon2: structuredClone(normalizedTeams.team2[0]),
    p1Inventory: structuredClone(data.initialState.p1Inventory),
    p2Inventory: structuredClone(data.initialState.p2Inventory),
    p1TeraUsed: false, p2TeraUsed: false, p1MegaUsed: false, p2MegaUsed: false,
    turn: 1, weather: 'none', weatherTurns: 0, terrain: 'none', terrainTurns: 0,
    gravity: false, gravityTurns: 0, mudSportTurns: 0, waterSportTurns: 0, ionDelugeActive: false,
    wonderRoomActive: false, wonderRoomTurns: 0, magicRoomActive: false, magicRoomTurns: 0,
    trickRoomActive: false, trickRoomTurns: 0,
    p1Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 },
    p2Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 },
    logs: [], isBattleInProgress: true, winner: null, waitingForAction: false,
  };
  return state;
};

const replayFixture = async (replay: BattleReplay) => {
  const warnings: string[] = [];
  interface TurnResult {
    turn: number; hash: string; cursor: number; warning: string | null;
    expectedCursor?: number; expectedState?: number; actualState?: number; expectedHash?: string;
  }
  const turns: TurnResult[] = [];
  let state = buildInitialState(replay);
  applyReplayCheckpointMegaProfiles(replay, 0, state);
  const initialWarning = assertReplayCheckpoint(replay, 0, state);
  if (initialWarning) warnings.push(initialWarning);
  const entryLogs: any[] = [];
  Effects.handleEntryAbilities(state.currentPokemon1, state.currentPokemon2, replay.initialState.config?.weatherEnabled ?? true, entryLogs, state);
  Effects.handleEntryAbilities(state.currentPokemon2, state.currentPokemon1, replay.initialState.config?.weatherEnabled ?? true, entryLogs, state);
  state.logs = [...state.logs, ...entryLogs];

  const uiActions = { setAnimationState: () => {} } as any;
  const turnNumbers = Array.from(new Set(replay.events.map(event => event.turn))).sort((a, b) => Number(a) - Number(b));

  for (const turn of turnNumbers) {
    const turnEvents = replay.events.filter(event => event.turn === turn);
    ([1, 2] as const).forEach(playerNum => {
      const active = playerNum === 1 ? state.currentPokemon1 : state.currentPokemon2;
      if (active?.isFainted) {
        const forcedEvent = turnEvents.find(event => event.actorId === playerNum && event.isForcedSwitch);
        if (!forcedEvent) return;
        const forcedAction = buildReplayForcedSwitchAction(state, forcedEvent, playerNum, turn);
        const result = BattleEngine.performSwitch(state, forcedAction.data, playerNum, replay.initialState.config.weatherEnabled);
        state = { ...result.newState, logs: [...state.logs, ...result.logs] };
      }
    });

    const p1Event = turnEvents.find(event => event.actorId === 1 && !event.isForcedSwitch && !event.isBatonPass);
    const p2Event = turnEvents.find(event => event.actorId === 2 && !event.isForcedSwitch && !event.isBatonPass);

    if (p1Event || p2Event) {
      applyReplayCheckpointMegaProfiles(replay, turn, state);
      const stateBeforeTurn = structuredClone(state);
      const generator = BattleCoordinator.runTurn(
        state,
        buildReplayTurnAction(state, p1Event, 1, turn),
        buildReplayTurnAction(state, p2Event, 2, turn),
        replay.initialState.config,
      );
      let result = generator.next();
      let guard = 0;
      while (!result.done && guard < 200) {
        guard += 1;
        const step: any = result.value;
        await TurnAnimator.processStep(step, uiActions, 8);
        state = { ...step.state, logs: [...state.logs, ...step.logs] };
        if (step.switchPrompt) {
          const playerNum = step.switchPrompt.player;
          const forcedEvent = turnEvents.find(event => event.actorId === playerNum && (event.isForcedSwitch || event.isBatonPass));
          result = generator.next(buildReplayForcedSwitchAction(state, forcedEvent, playerNum, turn));
          continue;
        }
        if (step.phase === 'faint-switch') {
          ([1, 2] as const).forEach(playerNum => {
            const active = playerNum === 1 ? state.currentPokemon1 : state.currentPokemon2;
            if (!active?.isFainted) return;
            const forcedEvent = turnEvents.find(event => event.actorId === playerNum && event.isForcedSwitch);
            if (!forcedEvent || (!forcedEvent.switchInstanceId && forcedEvent.switchId === undefined)) return;
            const switchTarget = resolveReplaySwitchTarget(state, forcedEvent);
            if (!switchTarget) return;
            const switchResult = BattleEngine.performSwitch(state, switchTarget, playerNum, replay.initialState.config.weatherEnabled);
            state = { ...switchResult.newState, logs: [...state.logs, ...switchResult.logs] };
          });
        }
        result = generator.next();
      }

      const warning = assertReplayCheckpoint(replay, turn, state, stateBeforeTurn);
      if (warning) warnings.push(warning);
      const checkpoint = replay.checkpoints?.find(entry => entry.turn === turn);
      turns.push({
        turn,
        hash: hashBattleReplayState(state),
        cursor: state.prngState!.cursor,
        warning,
        expectedCursor: checkpoint?.prngState.cursor,
        expectedState: checkpoint?.prngState.state,
        actualState: state.prngState!.state,
        expectedHash: checkpoint?.stateHash,
      });
    }
  }

  return { state, warnings, turns };
};

describe('replay real 3.2.1 (seed 662638) sem divergência após a canonicalização de PP', () => {
  it('reproduz o arquivo anexado do início ao fim com todos os hashes conferindo', async () => {
    const replay = loadFixture();
    const { state, warnings, turns } = await replayFixture(replay);

    expect(replay.engineRevision).toBe('3.2.1');
    expect(turns.map(entry => entry.turn)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // Turno 2 é o caso relatado: o hash gravado bf73055b agora confere.
    expect(turns[0].hash).toBe('fnv1a32:b5949867');
    expect(turns[1].hash).toBe('fnv1a32:bf73055b');
    expect(warnings).toEqual([]);
    expect(state.turn).toBe(11);
  });

  it('mantém PRNG (seed, estado e cursor) e hashes coincidentes em todos os checkpoints', async () => {
    const replay = loadFixture();
    const { turns } = await replayFixture(replay);
    for (const entry of turns) {
      expect(entry.expectedCursor).toBe(entry.cursor);
      expect(entry.expectedState).toBe(entry.actualState);
      expect(entry.expectedHash).toBe(entry.hash);
    }
    expect(replay.checkpoints?.map(checkpoint => checkpoint.prngState.cursor)).toEqual([0, 5, 12, 25, 31, 37, 44, 50, 59, 65, 71]);
  });

  it('rejeita a cópia com seed adulterada', async () => {
    const replay = loadFixture();
    await expect(replayFixture({ ...replay, seed: replay.seed + 1 })).rejects.toThrow(/PRNG esperado/);
  });

  it('rejeita a cópia com ação adulterada que muda o estado (revisão antiga avisa, não rejeita)', async () => {
    const replay = loadFixture();
    const events = replay.events.map(event => event.turn === 2 && event.actorId === 1
      ? { ...event, moveId: 'skull-bash' }
      : event);
    // A revisão 3.2.1 não guarda a decisão no PRNG: com PRNG coincidente a diferença
    // aparece como aviso explícito de integridade não confiável, nunca em silêncio.
    const { warnings } = await replayFixture({ ...replay, events });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('não tem integridade confiável');
    // No formato novo o mesmo tipo de cópia é rejeitado (ver política de compatibilidade).
    await expect(replayFixture({ ...replay, engineRevision: '3.2.2', events }))
      .rejects.toThrow(/Divergência de replay/);
  });
});

describe('canonicalização independente do alias entre moves e movePool', () => {
  const createAliasedState = () => {
    const aliased = createMove({ name: 'golpe-aliased', power: 40, uses: 8, maxUses: 8 });
    const extra = createMove({ name: 'golpe-extra', power: 30, uses: 5, maxUses: 5 });
    const attacker = createPokemon({ id: 301, name: 'Alias', hp: 200, maxHP: 200 });
    attacker.moves = [aliased];
    // Em memória a fábrica compartilha o MESMO objeto entre moves e movePool.
    attacker.movePool = [aliased, extra];
    const defender = createPokemon({ id: 302, name: 'Alvo', hp: 200, maxHP: 200 });
    return { attacker, defender, aliased };
  };

  it('RED: hash igual entre o estado ao vivo (pool em alias) e o replay (pool com PP antigo)', () => {
    const { attacker, defender, aliased } = createAliasedState();
    const liveState = createBattleState([attacker], [defender], { prngState: createBattlePRNGState(4001) });

    // O motor decrementa o objeto usado; em memória o pool acompanha pelo alias.
    aliased.uses -= 1;
    const liveHash = hashBattleReplayState(liveState);

    // No replay o pool é cópia própria e mantém o PP original do arquivo.
    const restored = JSON.parse(JSON.stringify(liveState));
    restored.team1[0].moves[0].uses = 7;
    restored.team1[0].movePool[0].uses = 8;

    expect(hashBattleReplayState(restored)).toBe(liveHash);
  });

  it('usa o PP de moves como autoridade e ignora o PP do pool', () => {
    const { attacker, defender } = createAliasedState();
    // Pool com objetos próprios: representa o estado desserializado do replay.
    attacker.movePool = attacker.movePool!.map(move => ({ ...move }));
    const state = createBattleState([attacker], [defender], { prngState: createBattlePRNGState(4002) });
    state.team1[0].moves[0].uses = 3;
    state.team1[0].movePool[0].uses = 8;
    const withDrift = hashBattleReplayState(state);
    state.team1[0].movePool[0].uses = 3;
    expect(hashBattleReplayState(state)).toBe(withDrift);
    // O PP do golpe utilizável continua detectando alteração.
    state.team1[0].moves[0].uses = 2;
    expect(hashBattleReplayState(state)).not.toBe(withDrift);
  });
});

describe('política de compatibilidade por revisão', () => {
  const createLiveReplay = () => {
    const seed = 3303;
    const attacker = createPokemon({
      id: 401, name: 'Compat Atacante', hp: 300, maxHP: 300, speedStat: 120,
      moves: [createMove({ name: 'golpe-compat', power: 40, uses: 10, maxUses: 10 })],
    });
    const defender = createPokemon({
      id: 402, name: 'Compat Defensor', hp: 300, maxHP: 300, speedStat: 80,
      moves: [createMove({ name: 'resposta-compat', power: 30, uses: 10, maxUses: 10 })],
    });
    const state = createBattleState([attacker], [defender], { prngState: createBattlePRNGState(seed) });
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 });
    const live = runCoordinatorTurn({
      seed,
      initialState: state,
      p1Action: createMoveAction(attacker, attacker.moves[0], 1),
      p2Action: createMoveAction(defender, defender.moves[0], 2),
      config,
    });
    const replay = appendReplayCheckpoint(createBattleReplay(state, config, seed), 1, live.finalState);
    return { replay, live };
  };

  it('revisão antiga com PRNG coincidente e hash divergente gera aviso, não erro', () => {
    const { replay, live } = createLiveReplay();
    const changed = structuredClone(live.finalState);
    changed.team1[0].hp -= 1;
    const warning = assertReplayCheckpoint({ ...replay, engineRevision: '3.2.1' }, 1, changed);
    expect(warning).toContain('não tem integridade confiável');
    expect(warning).toContain('turno 1');
  });

  it('revisão antiga com PRNG divergente é rejeitada como estado incompatível', () => {
    const { replay, live } = createLiveReplay();
    const cursorTampered = {
      ...replay,
      engineRevision: '3.2.1',
      checkpoints: replay.checkpoints!.map(checkpoint => checkpoint.turn === 1
        ? { ...checkpoint, prngState: { ...checkpoint.prngState, cursor: checkpoint.prngState.cursor + 1 } }
        : checkpoint),
    };
    expect(() => assertReplayCheckpoint(cursorTampered, 1, live.finalState)).toThrow(/PRNG esperado/);
  });

  it('revisão atual (3.2.2) continua rejeitando hash divergente', () => {
    const { replay, live } = createLiveReplay();
    expect(replay.engineRevision).toBe(REPLAY_ENGINE_REVISION);
    const changed = structuredClone(live.finalState);
    changed.team1[0].hp -= 1;
    expect(() => assertReplayCheckpoint(replay, 1, changed)).toThrow(/Divergência de replay no turno 1/);
  });
});


// Confere que a fixture reduzida preserva a evidência exata do arquivo anexado.
describe('evidência do arquivo anexado (seed 662638)', () => {
  it('mantém seed, checkpoints e hashes originais na fixture reduzida', () => {
    const replay = loadFixture();
    expect(replay.seed).toBe(662638);
    expect(replay.checkpoints?.map(checkpoint => checkpoint.turn)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(replay.checkpoints?.[0].stateHash).toBe('fnv1a32:d4ff07c4');
    expect(replay.checkpoints?.[1].stateHash).toBe('fnv1a32:b5949867');
    expect(replay.checkpoints?.[2].stateHash).toBe('fnv1a32:bf73055b');
    expect(replay.events.filter(event => event.turn === 1).map(event => event.actionType)).toEqual(['switch', 'item']);
    expect(replay.events.filter(event => event.turn === 2).map(event => event.moveId)).toEqual(['thunderbolt', 'hydro-pump']);
  });
});
