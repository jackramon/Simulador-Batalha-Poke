import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { decideAIAction } from '../../services/aiLogic';
import { decideLLMAction } from '../../services/llmAiLogic';
import type { Action, BattleReplay } from '../../types';
import { disableDeterministicRandom, enableDeterministicRandom } from '../../utils/prng';
import { createBattleState, createMove, createPlayerInventory, createPokemon } from '../factories';
import {
  createBattleConfig,
  createMoveAction,
  createSwitchAction,
  runCoordinatorTurn,
} from './coordinator.helpers';

describe('replay manual e decisões de IA no núcleo', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede externa proibida nos testes do núcleo');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    disableDeterministicRandom();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reconstrói as decisões manuais e reproduz o mesmo estado com a mesma seed', () => {
    const outgoing = createPokemon({
      id: 101,
      name: 'Titular do Replay',
      hp: 400,
      maxHP: 400,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const reserve = createPokemon({
      id: 102,
      name: 'Reserva do Replay',
      hp: 400,
      maxHP: 400,
      moves: [createMove({ uses: 10, maxUses: 10 })],
    });
    const opponent = createPokemon({
      id: 201,
      name: 'Oponente do Replay',
      hp: 400,
      maxHP: 400,
      speedStat: 90,
      moves: [createMove({ uses: 12, maxUses: 12 })],
    });
    const replay: BattleReplay = {
      initialState: {
        team1: [outgoing, reserve],
        team2: [opponent],
        p1Inventory: createPlayerInventory(),
        p2Inventory: createPlayerInventory(),
        config: createBattleConfig(),
      },
      seed: 1501,
      events: [
        { turn: 1, actorId: 1, actionType: 'switch', switchId: reserve.id },
        { turn: 1, actorId: 2, actionType: 'move', moveId: opponent.moves[0].name },
      ],
    };

    const runs = [0, 1].map(() => {
      const initialState = createBattleState(
        structuredClone(replay.initialState.team1),
        structuredClone(replay.initialState.team2),
        {
          p1Inventory: structuredClone(replay.initialState.p1Inventory),
          p2Inventory: structuredClone(replay.initialState.p2Inventory),
        },
      );
      const actions = replay.events
        .filter(event => event.turn === initialState.turn && !event.isForcedSwitch && !event.isBatonPass)
        .map((event): Action => {
          const user = event.actorId === 1 ? initialState.currentPokemon1 : initialState.currentPokemon2;
          if (!user) throw new Error('Evento sem Pokémon ativo');

          let data: Action['data'];
          let priority = 6;
          if (event.actionType === 'move') {
            data = user.moves.find(move => move.name === event.moveId);
            if (!data) throw new Error('Golpe gravado não encontrado');
            priority = data.priority ?? 0;
          } else if (event.actionType === 'switch') {
            const team = event.actorId === 1 ? initialState.team1 : initialState.team2;
            data = team.find(pokemon => pokemon.id === event.switchId);
            if (!data) throw new Error('Troca gravada não encontrada');
          } else {
            data = { itemId: event.itemId, targetId: event.targetId, isGive: event.isGive };
          }

          return {
            type: event.actionType,
            data,
            user,
            playerNum: event.actorId,
            priority,
            shouldTerastallize: event.shouldTerastallize,
            shouldMegaEvolve: event.shouldMegaEvolve,
          };
        });

      const result = runCoordinatorTurn({
        seed: replay.seed,
        initialState,
        p1Action: actions.find(action => action.playerNum === 1),
        p2Action: actions.find(action => action.playerNum === 2),
        config: replay.initialState.config,
      });
      const decisions = actions.map(action => [
        action.playerNum,
        action.type,
        action.type === 'move' ? action.data.name : action.type === 'switch' ? action.data.id : action.data.itemId,
      ]);

      return { result, decisions };
    });

    const expectedDecisions = [
      [1, 'switch', reserve.id],
      [2, 'move', opponent.moves[0].name],
    ];
    expect(runs[0].decisions).toEqual(expectedDecisions);
    expect(runs[1].decisions).toEqual(expectedDecisions);

    for (const run of runs) {
      expect(run.result.completed).toBe(true);
      expect(
        run.result.steps
          .filter(step => step.phase === 'after-action')
          .map(step => [step.activeActorId, step.actionType]),
      ).toEqual([
        [outgoing.id, 'switch'],
        [opponent.id, 'move'],
      ]);
    }

    const first = runs[0].result.finalState;
    const second = runs[1].result.finalState;
    expect(runs[1].result.stateSnapshots).toEqual(runs[0].result.stateSnapshots);
    expect(structuredClone(second)).toEqual(structuredClone(first));
    expect(first.turn).toBe(2);
    expect(first.currentPokemon1?.id).toBe(reserve.id);
    expect(first.currentPokemon1).toBe(first.team1[1]);
    expect(first.team1[0].hp).toBe(400);
    expect(first.currentPokemon1?.hp).toBeLessThan(400);
    expect(first.currentPokemon1?.hp).toBeGreaterThan(0);
    expect(first.currentPokemon2?.hp).toBe(400);
    expect(first.currentPokemon2?.moves[0].uses).toBe(11);
    expect(second.currentPokemon1?.hp).toBe(first.currentPokemon1?.hp);
    expect(second.currentPokemon2?.moves[0].uses).toBe(first.currentPokemon2?.moves[0].uses);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reproduz troca forçada coordenada com a mesma seed e as mesmas ações', () => {
    const executeReplay = () => {
      const attacker = createPokemon({
        id: 111,
        name: 'Usuário do Replay Forçado',
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
      const reserve = createPokemon({ id: 112, name: 'Reserva do Replay Forçado', hp: 400, maxHP: 400 });
      const defender = createPokemon({
        id: 211,
        name: 'Oponente do Replay Forçado',
        hp: 500,
        maxHP: 500,
        speedStat: 100,
        moves: [createMove({ name: 'golpe-regravado', power: 50, uses: 12, maxUses: 12 })],
      });
      const initialState = createBattleState([attacker, reserve], [defender]);
      const p1Action = createMoveAction(attacker, attacker.moves[0], 1);
      const p2Action = createMoveAction(defender, defender.moves[0], 2);
      const forcedEvent = { actorId: 1 as const, switchId: reserve.id, isForcedSwitch: true };

      const result = runCoordinatorTurn({
        seed: 1510,
        initialState,
        p1Action,
        p2Action,
        config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
        chooseForcedSwitch: step => createSwitchAction(step.state.currentPokemon1!, reserve, forcedEvent.actorId),
      });

      return {
        result,
        decisions: [p1Action.data.name, p2Action.data.name, forcedEvent.switchId],
      };
    };

    const first = executeReplay();
    const second = executeReplay();

    expect(second.decisions).toEqual(first.decisions);
    expect(second.result.stateSnapshots).toEqual(first.result.stateSnapshots);
    expect(structuredClone(second.result.finalState)).toEqual(structuredClone(first.result.finalState));
    for (const run of [first, second]) {
      expect(run.result.completed).toBe(true);
      expect(run.result.steps.filter(step => step.phase === 'switch-forced')).toHaveLength(1);
      expect(run.result.steps.filter(step => step.phase === 'turn-end')).toHaveLength(1);
      expect(run.result.finalState.turn).toBe(2);
      expect(run.result.finalState.currentPokemon1).toBe(run.result.finalState.team1[1]);
      expect(run.result.finalState.currentPokemon1?.hp).toBeLessThan(400);
      expect(run.result.finalState.currentPokemon1?.hp).toBeGreaterThan(0);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('decide pela mesma ação local para P2 ao redefinir a seed e restaura o PRNG em finally', () => {
    const weakMove = createMove({ name: 'weak-move', power: 40, priority: 0, uses: 10, maxUses: 10 });
    const strongMove = createMove({ name: 'strong-move', power: 120, priority: 0, uses: 10, maxUses: 10 });
    const aiPokemon = createPokemon({
      id: 202,
      name: 'IA Local',
      hp: 400,
      maxHP: 400,
      speedStat: 140,
      moves: [weakMove, strongMove],
    });
    const opponent = createPokemon({
      id: 102,
      name: 'Oponente da IA',
      hp: 400,
      maxHP: 400,
      speedStat: 90,
      moves: [createMove({ name: 'opponent-move', power: 50, uses: 10, maxUses: 10 })],
    });
    const state = createBattleState([opponent], [aiPokemon]);
    const decisions: Action[] = [];
    const originalRandom = Math.random;

    for (let iteration = 0; iteration < 2; iteration += 1) {
      enableDeterministicRandom(1502);
      try {
        decisions.push(decideAIAction(
          aiPokemon,
          opponent,
          state.team2,
          state.team1,
          state.weather,
          true,
          undefined,
          false,
          false,
          state,
          false,
          false,
        ));
      } finally {
        disableDeterministicRandom();
      }
      expect(Math.random).toBe(originalRandom);
    }

    expect(decisions[0]).toMatchObject({
      type: 'move',
      user: aiPokemon,
      playerNum: 2,
      priority: 0,
    });
    // A avaliação ótima depende de 3.4/3.5 para consumir os novos estados transacionais.
    expect([weakMove.name, strongMove.name]).toContain(decisions[0].data.name);
    expect(decisions[0].data.uses).toBe(10);
    expect(decisions[1]).toEqual(decisions[0]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('converte uma resposta válida de golpe do LLM na ação correspondente', async () => {
    const requestedMove = createMove({ name: 'thunder-shock', type: 'electric', uses: 15, maxUses: 15 });
    const attacker = createPokemon({ id: 203, name: 'Atacante LLM', moves: [requestedMove] });
    const defender = createPokemon({ id: 103, name: 'Defensor LLM', moves: [createMove()] });
    const state = createBattleState([defender], [attacker]);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      result: JSON.stringify({
        type: 'move',
        data: { name: 'thunder-shock' },
        shouldTerastallize: false,
        shouldMegaEvolve: false,
      }),
    }), { status: 200 }));

    const action = await decideLLMAction(
      attacker,
      defender,
      state.team2,
      state.team1,
      state.weather,
      true,
      undefined,
      false,
      false,
      state,
      false,
      false,
      'openrouter',
      'modelo-local',
    );

    expect(action).toEqual({
      type: 'move',
      data: requestedMove,
      user: attacker,
      playerNum: 2,
      priority: 0,
      shouldTerastallize: false,
      shouldMegaEvolve: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/llm-action', expect.objectContaining({ method: 'POST' }));
  });

  it('converte uma resposta válida de troca do LLM no reserva correspondente', async () => {
    const attacker = createPokemon({ id: 204, name: 'Titular LLM', moves: [createMove()] });
    const reserve = createPokemon({ id: 205, name: 'Reserva LLM', moves: [createMove()] });
    const defender = createPokemon({ id: 104, name: 'Oponente LLM', moves: [createMove()] });
    const state = createBattleState([defender], [attacker, reserve]);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      result: JSON.stringify({ type: 'switch', data: { id: reserve.id } }),
    }), { status: 200 }));

    const action = await decideLLMAction(
      attacker,
      defender,
      state.team2,
      state.team1,
      state.weather,
      true,
      undefined,
      false,
      false,
      state,
      false,
      false,
    );

    expect(action).toEqual({
      type: 'switch',
      data: reserve,
      user: attacker,
      playerNum: 2,
      priority: 6,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/llm-action', expect.objectContaining({ method: 'POST' }));
  });

  it('usa o primeiro golpe disponível quando a resposta do LLM é inválida', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const exhaustedMove = createMove({ name: 'exhausted-move', uses: 0, maxUses: 10 });
    const availableMove = createMove({ name: 'available-move', uses: 8, maxUses: 10 });
    const attacker = createPokemon({
      id: 206,
      name: 'Fallback LLM',
      moves: [exhaustedMove, availableMove],
    });
    const defender = createPokemon({ id: 106, name: 'Oponente do Fallback', moves: [createMove()] });
    const state = createBattleState([defender], [attacker]);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ result: 'resposta sem JSON válido' }), { status: 200 }));

    const action = await decideLLMAction(
      attacker,
      defender,
      state.team2,
      state.team1,
      state.weather,
      true,
      undefined,
      false,
      false,
      state,
      false,
      false,
    );

    expect(action).toEqual({
      type: 'move',
      data: availableMove,
      user: attacker,
      playerNum: 2,
      priority: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/llm-action', expect.objectContaining({ method: 'POST' }));
  });

  it.todo('3.1: reproduzir replay com LLM sem executar a IA local para consumir PRNG');
  it.todo('3.3: preservar a identidade entre o Pokémon ativo e sua entrada na equipe no ReplayPlayer');
});
