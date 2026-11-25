import { describe, expect, it } from 'vitest';
import { executeMove } from '../../services/engine/moves';
import { performSwitch } from '../../services/engine/switching';
import { processTurnEnd } from '../../services/engine/turnEnd';
import { createBattleState, createMove, createPokemon, createSideHazards, createStatStages } from '../factories';
import { createBattleConfig, createMoveAction, createSwitchAction, runCoordinatorTurn } from './coordinator.helpers';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.getOwnPropertyNames(value).forEach(property => {
      deepFreeze((value as Record<string, unknown>)[property]);
    });
  }
  return value;
};

describe('fronteiras transacionais do estado da batalha', () => {
  it('processa o fim do turno sem mutar uma entrada profundamente congelada', () => {
    const initialState = createBattleState(
      [createPokemon({
        id: 301,
        statusEffects: {
          'avalanche-tracker': { turns: 1 },
          toxic: { turns: 2 },
        },
      })],
      [createPokemon({ id: 302 })],
      {
        p1Hazards: createSideHazards({ reflect: 2 }),
        p2Hazards: createSideHazards({ lightScreen: 3 }),
      },
    );
    deepFreeze(initialState);

    const result = processTurnEnd(initialState, createBattleConfig());

    expect(result.newState).not.toBe(initialState);
    expect(result.newState.p1Hazards.reflect).toBe(1);
    expect(result.newState.p2Hazards.lightScreen).toBe(2);
    expect(result.newState.currentPokemon1?.turnsActive).toBe(1);
    expect(result.newState.currentPokemon1?.statusEffects['avalanche-tracker']).toBeUndefined();
    expect(result.newState.currentPokemon1).toBe(result.newState.team1[0]);
    expect(result.newState.currentPokemon2).toBe(result.newState.team2[0]);
    expect(initialState.p1Hazards.reflect).toBe(2);
    expect(initialState.p2Hazards.lightScreen).toBe(3);
    expect(initialState.currentPokemon1?.turnsActive).toBe(0);
    expect(initialState.currentPokemon1?.statusEffects['avalanche-tracker']).toEqual({ turns: 1 });
    expect(initialState.currentPokemon1?.statusEffects.toxic).toEqual({ turns: 2 });
  });

  it('executa a troca sem mutar equipe, antigo ou novo Pokémon recebidos', () => {
    const initialState = createBattleState(
      [createPokemon({
        id: 311,
        name: 'Titular Congelado',
        hp: 400,
        maxHP: 400,
        statStages: createStatStages({ attack: 2 }),
        statusEffects: { confusion: { turns: 2, isVolatile: true } },
      }), createPokemon({ id: 312, name: 'Reserva Congelada', hp: 400, maxHP: 400 })],
      [createPokemon({ id: 313, hp: 400, maxHP: 400 })],
      { p1Hazards: createSideHazards({ stealthRock: true }) },
    );
    deepFreeze(initialState);

    const result = performSwitch(initialState, initialState.team1[1], 1, false);

    expect(result.newState).not.toBe(initialState);
    expect(result.newState.currentPokemon1).toBe(result.newState.team1[1]);
    expect(result.newState.currentPokemon1).not.toBe(initialState.team1[1]);
    expect(result.newState.currentPokemon1?.hp).toBe(350);
    expect(result.newState.team1[0].statStages.attack).toBe(0);
    expect(result.newState.team1[0].statusEffects.confusion).toBeUndefined();
    expect(initialState.currentPokemon1).toBe(initialState.team1[0]);
    expect(initialState.team1[0].statStages.attack).toBe(2);
    expect(initialState.team1[0].statusEffects.confusion).toEqual({ turns: 2, isVolatile: true });
    expect(initialState.team1[1].hp).toBe(400);
    expect(initialState.team1[1].statusEffects).toEqual({});
  });

  it('executa um golpe sem alterar HP ou PP da entrada', () => {
    const initialState = createBattleState(
      [createPokemon({
        id: 321,
        name: 'Atacante Transacional',
        hp: 400,
        maxHP: 400,
        moves: [createMove({ name: 'golpe-transacional', uses: 10, maxUses: 10 })],
      })],
      [createPokemon({ id: 322, name: 'Defensor Transacional', hp: 400, maxHP: 400 })],
    );
    deepFreeze(initialState);

    const result = executeMove(
      initialState,
      initialState.currentPokemon1!,
      initialState.currentPokemon2!,
      initialState.currentPokemon1!.moves[0],
      createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    );

    expect(result.newState).not.toBe(initialState);
    expect(result.damageDealt).toBe(true);
    expect(result.newState.currentPokemon2?.hp).toBeLessThan(400);
    expect(result.newState.currentPokemon2?.hp).toBeGreaterThan(0);
    expect(result.newState.currentPokemon1?.moves[0].uses).toBe(9);
    expect(result.newState.currentPokemon1).toBe(result.newState.team1[0]);
    expect(result.newState.currentPokemon2).toBe(result.newState.team2[0]);
    expect(initialState.currentPokemon1?.hp).toBe(400);
    expect(initialState.currentPokemon2?.hp).toBe(400);
    expect(initialState.currentPokemon1?.moves[0].uses).toBe(10);
    expect(initialState.currentPokemon1?.movesUsed).toEqual([]);
  });

  it('mantém snapshots anteriores inalterados e sem referências compartilhadas entre yields', () => {
    const initialState = createBattleState(
      [createPokemon({
        id: 331,
        name: 'Atacante dos Snapshots',
        hp: 400,
        maxHP: 400,
        moves: [createMove({ name: 'golpe-de-snapshot', uses: 10, maxUses: 10 })],
      })],
      [createPokemon({ id: 332, name: 'Defensor dos Snapshots', hp: 400, maxHP: 400 })],
    );

    const result = runCoordinatorTurn({
      seed: 2504,
      initialState,
      p1Action: createMoveAction(initialState.currentPokemon1!, initialState.currentPokemon1!.moves[0], 1),
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    const start = result.steps.find(step => step.phase === 'start');
    const beforeAction = result.steps.find(step => step.phase === 'before-action');
    const afterAction = result.steps.find(step => step.phase === 'after-action');
    const turnEnd = result.steps.find(step => step.phase === 'turn-end');

    expect(result.completed).toBe(true);
    expect(start?.state.currentPokemon1?.movedThisTurn).toBe(false);
    expect(beforeAction?.state.currentPokemon1?.movedThisTurn).toBe(false);
    expect(start?.state.currentPokemon1?.moves[0].uses).toBe(10);
    expect(start?.state.currentPokemon2?.hp).toBe(400);
    expect(afterAction?.state.currentPokemon2?.hp).toBeLessThan(400);
    expect(afterAction?.state.currentPokemon1?.moves[0].uses).toBe(9);
    expect(start?.state.turn).toBe(1);
    expect(beforeAction?.state.turn).toBe(1);
    expect(afterAction?.state.turn).toBe(1);
    expect(turnEnd?.state.turn).toBe(2);

    for (const step of result.steps) {
      expect(step.state.currentPokemon1).toBe(step.state.team1[0]);
      expect(step.state.currentPokemon2).toBe(step.state.team2[0]);
    }
    for (let left = 0; left < result.steps.length; left += 1) {
      for (let right = left + 1; right < result.steps.length; right += 1) {
        const leftState = result.steps[left].state;
        const rightState = result.steps[right].state;
        expect(leftState).not.toBe(rightState);
        expect(leftState.team1).not.toBe(rightState.team1);
        expect(leftState.team1[0]).not.toBe(rightState.team1[0]);
        expect(leftState.p1Hazards).not.toBe(rightState.p1Hazards);
        expect(leftState.team1[0].statusEffects).not.toBe(rightState.team1[0].statusEffects);
      }
    }
  });

  it('reidrata ações externas por instância em espelho sem mutar estado ou ações recebidos', () => {
    const initialState = createBattleState(
      [createPokemon({
        id: 25,
        name: 'Espelho Externo P1',
        hp: 400,
        maxHP: 400,
        speedStat: 140,
        moves: [createMove({ name: 'golpe-externo-p1', uses: 10, maxUses: 10 })],
      })],
      [createPokemon({
        id: 25,
        name: 'Espelho Externo P2',
        hp: 400,
        maxHP: 400,
        speedStat: 90,
        moves: [createMove({ name: 'golpe-externo-p2', uses: 8, maxUses: 8 })],
      })],
    );
    const p1Action = createMoveAction(initialState.currentPokemon1!, initialState.currentPokemon1!.moves[0], 1);
    const p2Action = createMoveAction(initialState.currentPokemon2!, initialState.currentPokemon2!.moves[0], 2);
    deepFreeze(initialState);
    deepFreeze(p1Action);
    deepFreeze(p2Action);

    const result = runCoordinatorTurn({
      seed: 2505,
      initialState,
      p1Action,
      p2Action,
      config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
    });

    expect(result.completed).toBe(true);
    expect(result.finalState.currentPokemon1).toBe(result.finalState.team1[0]);
    expect(result.finalState.currentPokemon2).toBe(result.finalState.team2[0]);
    expect(result.finalState.currentPokemon1?.instanceId).toBe('p1-slot-0');
    expect(result.finalState.currentPokemon2?.instanceId).toBe('p2-slot-0');
    expect(result.finalState.currentPokemon1?.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon2?.hp).toBeLessThan(400);
    expect(result.finalState.currentPokemon1?.moves[0].uses).toBe(9);
    expect(result.finalState.currentPokemon2?.moves[0].uses).toBe(7);
    expect(result.finalState.currentPokemon1?.movedThisTurn).toBe(true);
    expect(result.finalState.currentPokemon2?.movedThisTurn).toBe(true);
    expect(result.randomDraws).toBe(4);
    expect(initialState.currentPokemon1?.hp).toBe(400);
    expect(initialState.currentPokemon2?.hp).toBe(400);
    expect(initialState.currentPokemon1?.moves[0].uses).toBe(10);
    expect(initialState.currentPokemon2?.moves[0].uses).toBe(8);
    expect(p1Action.calculatedPriority).toBeUndefined();
    expect(p2Action.calculatedPriority).toBeUndefined();
  });

  it.each([
    { moveName: 'u-turn', displayName: 'U-turn', isBatonPass: false, power: 70, damageClass: 'physical', isStatus: false, expectedDraws: 4 },
    { moveName: 'baton-pass', displayName: 'Baton Pass', isBatonPass: true, power: 0, damageClass: 'status', isStatus: true, expectedDraws: 2 },
  ])('reidrata a escolha de um snapshot e reproduz $displayName sem draws adicionais', ({
    moveName,
    displayName,
    isBatonPass,
    power,
    damageClass,
    isStatus,
    expectedDraws,
  }) => {
    const executeReplay = () => {
      const initialState = createBattleState(
        [createPokemon({
          id: 341,
          name: `Usuário Externo de ${displayName}`,
          hp: 400,
          maxHP: 400,
          speedStat: 300,
          statStages: createStatStages({ attack: 3, speed: -2 }),
          moves: [createMove({
            name: moveName,
            displayName,
            power,
            damageClass,
            isStatus,
            uses: 10,
            maxUses: 10,
            effect: { status: 'switch-self', chance: 100 },
          })],
        }), createPokemon({ id: 342, name: 'Reserva Externa', hp: 400, maxHP: 400 })],
        [createPokemon({
          id: 343,
          name: 'Oponente Pendente',
          hp: 500,
          maxHP: 500,
          speedStat: 100,
          moves: [createMove({ name: 'golpe-pendente-externo', power: 50, uses: 12, maxUses: 12 })],
        })],
      );
      const p1Action = createMoveAction(initialState.currentPokemon1!, initialState.currentPokemon1!.moves[0], 1);
      const p2Action = createMoveAction(initialState.currentPokemon2!, initialState.currentPokemon2!.moves[0], 2);
      deepFreeze(initialState);
      deepFreeze(p1Action);
      deepFreeze(p2Action);

      const result = runCoordinatorTurn({
        seed: 2506,
        initialState,
        p1Action,
        p2Action,
        config: createBattleConfig({ forceAccuracyOutcome: 'hit', fixedRoll: 1 }),
        chooseForcedSwitch: step => createSwitchAction(step.state.currentPokemon1!, step.state.team1[1], 1),
      });
      return { initialState, p1Action, p2Action, result };
    };

    const first = executeReplay();
    const second = executeReplay();
    const prompt = first.result.steps.find(step => step.phase === 'switch-forced');
    const finalState = first.result.finalState;

    expect(first.result.completed).toBe(true);
    expect(first.result.steps.map(step => [step.phase, step.actionType])).toEqual([
      ['start', undefined],
      ['before-action', 'move'],
      ['after-action', 'move'],
      ['switch-forced', undefined],
      ['after-action', 'switch'],
      ['before-action', 'move'],
      ['after-action', 'move'],
      ['turn-end', undefined],
    ]);
    expect(prompt?.switchPrompt).toEqual({ player: 1, isBatonPass, canCancel: false });
    expect(prompt?.state.currentPokemon1?.instanceId).toBe('p1-slot-0');
    expect(prompt?.state.currentPokemon1).toBe(prompt?.state.team1[0]);
    expect(prompt?.state.team1[1].hp).toBe(400);
    expect(finalState.currentPokemon1).toBe(finalState.team1[1]);
    expect(finalState.currentPokemon1?.instanceId).toBe('p1-slot-1');
    expect(finalState.currentPokemon1?.hp).toBeLessThan(400);
    expect(finalState.currentPokemon1?.hp).toBeGreaterThan(0);
    expect(finalState.currentPokemon1?.statStages.attack).toBe(isBatonPass ? 3 : 0);
    expect(finalState.currentPokemon1?.statStages.speed).toBe(isBatonPass ? -2 : 0);
    expect(finalState.currentPokemon2?.moves[0].uses).toBe(11);
    expect(first.result.steps.filter(step => step.phase === 'turn-end')).toHaveLength(1);
    expect(first.initialState.currentPokemon1).toBe(first.initialState.team1[0]);
    expect(first.initialState.team1[1].hp).toBe(400);
    expect(first.initialState.currentPokemon1?.moves[0].uses).toBe(10);
    expect(first.initialState.currentPokemon2?.moves[0].uses).toBe(12);
    expect(first.initialState.currentPokemon2?.hp).toBe(500);
    expect(first.p1Action.calculatedPriority).toBeUndefined();
    expect(first.p2Action.calculatedPriority).toBeUndefined();
    expect(second.result.steps).toEqual(first.result.steps);
    expect(second.result.finalState).toEqual(finalState);
    expect(second.result.randomDraws).toBe(first.result.randomDraws);
    expect(first.result.randomDraws).toBe(expectedDraws);
  });
});
