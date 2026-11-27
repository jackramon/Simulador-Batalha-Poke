import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  applyReplayCheckpointMegaProfiles,
  assertReplayCheckpoint,
  buildReplayAction,
  buildReplayForcedSwitchAction,
  buildReplayTurnAction,
  hashBattleReplayState,
  normalizeReplayTeams,
  parseBattleReplay,
  resolveReplaySwitchTarget,
} from '../../services/replayLogic';
import { BattleCoordinator } from '../../services/engine/coordinator';
import { TurnAnimator } from '../../services/animation/turnAnimator';
import * as BattleEngine from '../../services/engine';
import * as Effects from '../../services/effectHandlers';
import { decideAIAction } from '../../services/aiLogic';
import type { Action, BattleReplay, BattleState, BattleReplayEvent } from '../../types';
import { createBattlePRNGState } from '../../utils/prng';
import { createBattleConfig, runCoordinatorTurn } from './coordinator.helpers';
import { createBattleState, createMove, createPokemon } from '../factories';

// Fixture derivada do replay real anexado ao hotfix 3.4.1 (seed 649171). Só campos de
// apresentação foram removidos; seed, eventos, checkpoints e revisão são os originais.
const FIXTURE_URL = new URL('../fixtures/replay-3.2.2-recharge.json', import.meta.url);
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

interface TurnResult {
  turn: number;
  hash: string;
  expectedHash?: string;
  cursor: number;
  expectedCursor?: number;
  prngState: number;
  expectedPrngState?: number;
  warning: string | null;
}

const replayFixture = async (replay: BattleReplay) => {
  const warnings: string[] = [];
  const turns: TurnResult[] = [];
  const stateBeforeTurn = new Map<number, BattleState>();
  let state = buildInitialState(replay);
  applyReplayCheckpointMegaProfiles(replay, 0, state);
  const initialWarning = assertReplayCheckpoint(replay, 0, state);
  if (initialWarning) warnings.push(initialWarning);
  const entryLogs: any[] = [];
  Effects.handleEntryAbilities(state.currentPokemon1!, state.currentPokemon2!, replay.initialState.config?.weatherEnabled ?? true, entryLogs, state);
  Effects.handleEntryAbilities(state.currentPokemon2!, state.currentPokemon1!, replay.initialState.config?.weatherEnabled ?? true, entryLogs, state);
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
      stateBeforeTurn.set(turn, structuredClone(state));
      const stateBeforeTurnSnapshot = structuredClone(state);
      const generator = BattleCoordinator.runTurn(
        state,
        buildReplayTurnAction(state, p1Event, 1, turn),
        buildReplayTurnAction(state, p2Event, 2, turn),
        replay.initialState.config,
      );
      let result = generator.next();
      let guard = 0;
      let verificationState: BattleState | null = null;
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
          // O checkpoint é gravado antes das trocas externas pós-desmaio.
          verificationState = structuredClone(step.state);
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

      const warning = assertReplayCheckpoint(replay, turn, verificationState ?? state, stateBeforeTurnSnapshot);
      if (warning) warnings.push(warning);
      const checkpoint = replay.checkpoints?.find(entry => entry.turn === turn);
      // O checkpoint de um turno com `faint-switch` é o passo anterior às trocas externas.
      const verifiedState = verificationState ?? state;
      turns.push({
        turn,
        hash: hashBattleReplayState(verifiedState),
        expectedHash: checkpoint?.stateHash,
        cursor: verifiedState.prngState!.cursor,
        expectedCursor: checkpoint?.prngState.cursor,
        prngState: verifiedState.prngState!.state,
        expectedPrngState: checkpoint?.prngState.state,
        warning,
      });
    }
  }

  return { state, warnings, turns, stateBeforeTurn };
};

// Uma execução completa da fixture (33 turnos) é compartilhada entre os cenários.
let cachedFixtureRun: ReturnType<typeof replayFixture> | null = null;
const runFixture = () => {
  if (!cachedFixtureRun) cachedFixtureRun = replayFixture(loadFixture());
  return cachedFixtureRun;
};

describe('ações temporárias (recarga e Debater) na fixture real 3.2.2', () => {
  it('reproduz do turno 1 ao 33 passando por 9, 11, 19 e 21 sem divergência', async () => {
    const { warnings, turns, state } = await runFixture();

    expect(turns.map(entry => entry.turn)).toEqual(Array.from({ length: 33 }, (_, index) => index + 1));
    expect(warnings).toEqual([]);
    for (const turn of [9, 11, 19, 21]) {
      const entry = turns.find(item => item.turn === turn)!;
      expect(entry.expectedHash).toBe(entry.hash);
      expect(entry.expectedCursor).toBe(entry.cursor);
      expect(entry.expectedPrngState).toBe(entry.prngState);
    }
    expect(state.turn).toBe(34);
  }, 120000);

  it('valida exatamente fnv1a32:84f2edb4 no turno 9', async () => {
    const { turns } = await runFixture();
    expect(turns.find(entry => entry.turn === 9)!.hash).toBe('fnv1a32:84f2edb4');
  }, 120000);

  it('mantém PRNG e hashes iguais aos gravados em todos os 33 turnos, sem chamadas de rede', async () => {
    const fetchSpy = vi.fn(() => { throw new Error('rede bloqueada durante a reprodução'); });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as any;
    try {
      const { turns } = await runFixture();
      expect(turns).toHaveLength(33);
      for (const entry of turns) {
        expect(entry.expectedHash).toBe(entry.hash);
        expect(entry.expectedCursor).toBe(entry.cursor);
        expect(entry.expectedPrngState).toBe(entry.prngState);
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  }, 120000);

  it('reconstrói a recarga exatamente igual à ação usada pela IA ao vivo', async () => {
    const replay = loadFixture();
    const { stateBeforeTurn } = await runFixture();
    const beforeTurn9 = stateBeforeTurn.get(9)!;
    expect(beforeTurn9.currentPokemon2?.mustRecharge).toBe(true);

    const liveAction = decideAIAction(
      beforeTurn9.currentPokemon2!,
      beforeTurn9.currentPokemon1!,
      structuredClone(beforeTurn9.team2),
      structuredClone(beforeTurn9.team1),
      beforeTurn9.weather,
      replay.initialState.config.moveLimitEnabled,
      undefined,
      false,
      false,
      structuredClone(beforeTurn9),
      false,
      false,
      2,
    );

    const rechargeEvent = replay.events.find(event => event.turn === 9 && event.moveId === 'recharge')!;
    const replayAction = buildReplayAction(structuredClone(beforeTurn9), rechargeEvent)!;

    expect(liveAction.data).toEqual(replayAction.data);
    expect(replayAction.data).toEqual({ name: 'recharge', displayName: 'Recarregar', priority: 0 });
  }, 120000);

  it('reconstrói o Debater com power 50 e o mesmo dano/recuo do caminho ao vivo', () => {
    const config = createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1, moveLimitEnabled: true });
    const seed = 918273;

    const buildCombatants = () => {
      const striker = createPokemon({
        id: 701, name: 'Debatedor', hp: 200, maxHP: 200, speedStat: 120,
        moves: [createMove({ name: 'golpe-esgotado', power: 40, uses: 0, maxUses: 5 })],
      });
      striker.instanceId = 'p2-slot-0';
      const defender = createPokemon({
        id: 702, name: 'Alvo', hp: 400, maxHP: 400, speedStat: 80,
        moves: [createMove({ name: 'golpe-do-alvo', power: 10, uses: 10, maxUses: 10 })],
      });
      defender.instanceId = 'p1-slot-0';
      return { striker, defender };
    };

    const { striker, defender } = buildCombatants();
    const state = createBattleState([structuredClone(defender)], [striker], { prngState: createBattlePRNGState(seed) });

    const liveAction = decideAIAction(
      state.currentPokemon2!, state.currentPokemon1!,
      structuredClone(state.team2), structuredClone(state.team1),
      state.weather, config.moveLimitEnabled, undefined, false, false, structuredClone(state), false, false, 2,
    );
    expect(liveAction.data.name).toBe('struggle');

    const event: BattleReplayEvent = {
      turn: 1, actionType: 'move', actorId: 2, actorInstanceId: 'p2-slot-0', moveId: 'struggle',
    };
    const replayAction = buildReplayAction(structuredClone(state), event)!;

    expect(replayAction.data).toEqual(liveAction.data);
    expect(replayAction.data.power).toBe(50);
    expect(replayAction.data.type).toBe('normal');

    const live = runCoordinatorTurn({
      seed,
      initialState: createBattleState([structuredClone(defender)], [structuredClone(striker)], { prngState: createBattlePRNGState(seed) }),
      p2Action: liveAction as Action,
      config,
    });
    const replayed = runCoordinatorTurn({
      seed,
      initialState: createBattleState([structuredClone(defender)], [structuredClone(striker)], { prngState: createBattlePRNGState(seed) }),
      p2Action: replayAction,
      config,
    });

    // Dano real do Debater (power 50), não o objeto de status com power 0.
    expect(replayed.finalState.team1[0].hp).toBeLessThan(400);
    expect(live.finalState.team1[0].hp).toBe(replayed.finalState.team1[0].hp);
    // Recuo fixo de 25% do HP máximo, idêntico nos dois caminhos.
    expect(replayed.finalState.team2[0].hp).toBe(200 - Math.floor(200 * 0.25));
    expect(live.finalState.team2[0].hp).toBe(replayed.finalState.team2[0].hp);
    // Nenhum draw extra: cursor/estado e hash finais são iguais.
    expect(live.finalState.prngState).toEqual(replayed.finalState.prngState);
    expect(hashBattleReplayState(live.finalState)).toBe(hashBattleReplayState(replayed.finalState));
  }, 120000);

  it('rejeita a cópia com a recarga adulterada no turno 9', async () => {
    const replay = loadFixture();
    const events = replay.events.map(event => event.turn === 9 && event.moveId === 'recharge'
      ? { ...event, moveId: 'struggle' }
      : event);
    await expect(replayFixture({ ...replay, events })).rejects.toThrow(/Divergência de replay/);
  }, 120000);

  it('mantém a evidência original na fixture reduzida', () => {
    const replay = loadFixture();
    expect(replay.engineRevision).toBe('3.2.2');
    expect(replay.seed).toBe(649171);
    expect(replay.checkpoints?.map(checkpoint => checkpoint.turn)).toEqual(
      Array.from({ length: 34 }, (_, index) => index),
    );
    expect(replay.checkpoints?.[9].stateHash).toBe('fnv1a32:84f2edb4');
    expect(replay.events.filter(event => event.moveId === 'recharge').map(event => event.turn)).toEqual([9, 11, 19, 21]);
  });
});