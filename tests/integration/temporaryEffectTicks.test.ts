import { describe, expect, it } from 'vitest';
import type { BattleState, LogEntry } from '../../types';
import { processTurnEnd } from '../../services/engine/turnEnd';
import { checkRestriction } from '../../services/engine/handlers/moves/restrictions';
import { calculateTypeEffectiveness } from '../../services/engine/mechanics/effectiveness';
import { calculateHitChance } from '../../services/engine/mechanics/accuracy';
import { isGrounded } from '../../services/engine/handlers/terrain';
import { calculateDamage } from '../../services/engine/handlers/damageUtils';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, createSwitchAction, runCoordinatorTurn } from './coordinator.helpers';
import { performSwitch } from '../../services/engine/switching';

// 4.1.2 — Taunt, Encore, Disable, Magnet Rise, Telekinesis e Glaive Rush passaram a ter
// ciclo de vida completo na fonte canônica `processTurnEnd`, com um único decremento por
// turno, tanto no caminho direto quanto no `BattleCoordinator.runTurn`.

const CONFIG = createBattleConfig();

const howlMove = () =>
  createMove({
    name: 'howl',
    displayName: 'Uivo',
    type: 'normal',
    power: 0,
    accuracy: 100,
    isStatus: true,
    damageClass: 'status',
    uses: 20,
    maxUses: 20,
  });

const tackleMove = () =>
  createMove({
    name: 'tackle',
    displayName: 'Investida',
    type: 'normal',
    power: 40,
    accuracy: 100,
    damageClass: 'physical',
    uses: 20,
    maxUses: 20,
  });

const countTurnEndSteps = (steps: { phase: string }[]) =>
  steps.filter(step => step.phase === 'turn-end').length;

const collectLogs = (steps: { logs: LogEntry[] }[]): string[] =>
  steps.flatMap(step => step.logs.map(entry => entry.message));

describe('4.1.2 ticks de efeitos temporários', () => {
  describe('Taunt', () => {
    it('decrementa 3 turnos pelo processTurnEnd direto e expira no terceiro', () => {
      const initialState = createBattleState();
      initialState.currentPokemon1!.statusEffects.taunt = {
        turns: 3,
        isVolatile: true,
        batonPassable: false,
      };

      const first = processTurnEnd(initialState, CONFIG);
      expect(first.newState.currentPokemon1!.statusEffects.taunt).toEqual(
        expect.objectContaining({ turns: 2 }),
      );

      const second = processTurnEnd(first.newState, CONFIG);
      expect(second.newState.currentPokemon1!.statusEffects.taunt).toEqual(
        expect.objectContaining({ turns: 1 }),
      );

      const third = processTurnEnd(second.newState, CONFIG);
      expect(third.newState.currentPokemon1!.statusEffects.taunt).toBeUndefined();
    });

    it('bloqueia golpes de status enquanto ativo e os libera após a expiração', () => {
      const taunted = createPokemon({ name: 'Provocado', moves: [howlMove()] });
      taunted.statusEffects.taunt = { turns: 2, isVolatile: true, batonPassable: false };

      expect(checkRestriction(taunted, howlMove(), [])).toBe(false);

      delete taunted.statusEffects.taunt;

      expect(checkRestriction(taunted, howlMove(), [])).toBe(true);
    });

    it('decrementa uma única vez por turno no coordenador e libera o status ao expirar', () => {
      const provoker = createPokemon({ id: 11, name: 'Provocado', moves: [howlMove()] });
      const opponent = createPokemon({ id: 12, name: 'Oponente', moves: [tackleMove()] });
      const initialState = createBattleState([provoker], [opponent]);
      initialState.currentPokemon1!.statusEffects.taunt = {
        turns: 2,
        isVolatile: true,
        batonPassable: false,
      };

      const firstTurn = runCoordinatorTurn({
        seed: 4121,
        initialState,
        p1Action: createMoveAction(initialState.currentPokemon1!, howlMove(), 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      expect(countTurnEndSteps(firstTurn.steps)).toBe(1);
      expect(firstTurn.finalState.currentPokemon1!.statusEffects.taunt).toEqual(
        expect.objectContaining({ turns: 1 }),
      );
      expect(firstTurn.finalState.currentPokemon1!.statStages.attack).toBe(0);
      expect(collectLogs(firstTurn.steps)).toContain(
        'Provocado não pode usar golpes de status devido à Provocação!',
      );

      const secondTurn = runCoordinatorTurn({
        seed: 4122,
        initialState: firstTurn.finalState,
        p1Action: createMoveAction(firstTurn.finalState.currentPokemon1!, howlMove(), 1),
        p2Action: createMoveAction(firstTurn.finalState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
        preservePrngState: true,
      });

      expect(countTurnEndSteps(secondTurn.steps)).toBe(1);
      expect(secondTurn.finalState.currentPokemon1!.statusEffects.taunt).toBeUndefined();
      expect(secondTurn.finalState.currentPokemon1!.statStages.attack).toBe(0);

      const thirdTurn = runCoordinatorTurn({
        seed: 4123,
        initialState: secondTurn.finalState,
        p1Action: createMoveAction(secondTurn.finalState.currentPokemon1!, howlMove(), 1),
        p2Action: createMoveAction(secondTurn.finalState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
        preservePrngState: true,
      });

      expect(countTurnEndSteps(thirdTurn.steps)).toBe(1);
      expect(thirdTurn.finalState.currentPokemon1!.statStages.attack).toBe(1);
    });
  });

  describe('Encore', () => {
    it('expira pelo processTurnEnd direto sem apagar o lockedMove de Choice Items', () => {
      const initialState = createBattleState();
      initialState.currentPokemon1!.heldItem = 'choice-band';
      initialState.currentPokemon1!.lockedMove = 'tackle';
      initialState.currentPokemon1!.statusEffects.encore = {
        turns: 2,
        moveName: 'tackle',
        isVolatile: true,
        batonPassable: false,
      };

      const first = processTurnEnd(initialState, CONFIG);
      expect(first.newState.currentPokemon1!.statusEffects.encore).toEqual(
        expect.objectContaining({ turns: 1, moveName: 'tackle' }),
      );
      expect(first.newState.currentPokemon1!.lockedMove).toBe('tackle');

      const second = processTurnEnd(first.newState, CONFIG);
      expect(second.newState.currentPokemon1!.statusEffects.encore).toBeUndefined();
      expect(second.newState.currentPokemon1!.lockedMove).toBe('tackle');
    });

    it('decrementa uma vez por turno e preserva o lock de Choice após expirar', () => {
      const encored = createPokemon({
        id: 21,
        name: 'Bisado',
        heldItem: 'choice-band',
        lockedMove: 'tackle',
        moves: [howlMove(), tackleMove()],
      });
      const opponent = createPokemon({ id: 22, name: 'Oponente', hp: 300, maxHP: 300, moves: [tackleMove()] });
      const initialState = createBattleState([encored], [opponent]);
      initialState.currentPokemon1!.statusEffects.encore = {
        turns: 1,
        moveName: 'howl',
        isVolatile: true,
        batonPassable: false,
      };

      const firstTurn = runCoordinatorTurn({
        seed: 4131,
        initialState,
        p1Action: createMoveAction(initialState.currentPokemon1!, tackleMove(), 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      expect(countTurnEndSteps(firstTurn.steps)).toBe(1);
      expect(firstTurn.finalState.currentPokemon1!.statusEffects.encore).toBeUndefined();
      expect(firstTurn.finalState.currentPokemon1!.lockedMove).toBe('tackle');
      expect(firstTurn.finalState.currentPokemon2!.hp).toBe(300);
      expect(collectLogs(firstTurn.steps)).toContain('Bisado só pode usar Uivo devido ao Bis!');

      const secondTurn = runCoordinatorTurn({
        seed: 4132,
        initialState: firstTurn.finalState,
        p1Action: createMoveAction(firstTurn.finalState.currentPokemon1!, tackleMove(), 1),
        p2Action: createMoveAction(firstTurn.finalState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
        preservePrngState: true,
      });

      expect(secondTurn.finalState.currentPokemon2!.hp).toBeLessThan(300);
      expect(secondTurn.finalState.currentPokemon1!.lockedMove).toBe('tackle');
    });
  });

  describe('Disable', () => {
    it('decrementa os contadores restantes e remove somente a entrada expirada', () => {
      const initialState = createBattleState();
      initialState.currentPokemon1!.disabledMoves = { tackle: 1, howl: 3 };

      const first = processTurnEnd(initialState, CONFIG);
      expect(first.newState.currentPokemon1!.disabledMoves).toEqual({ howl: 2 });

      const second = processTurnEnd(first.newState, CONFIG);
      expect(second.newState.currentPokemon1!.disabledMoves).toEqual({ howl: 1 });

      const third = processTurnEnd(second.newState, CONFIG);
      expect(third.newState.currentPokemon1!.disabledMoves).toBeUndefined();
    });

    it('bloqueia o golpe desativado e o libera quando o contador expira', () => {
      const disabled = createPokemon({ id: 31, name: 'Desativado', moves: [howlMove(), tackleMove()] });
      const opponent = createPokemon({ id: 32, name: 'Oponente', hp: 300, maxHP: 300, moves: [tackleMove()] });
      const initialState = createBattleState([disabled], [opponent]);
      initialState.currentPokemon1!.disabledMoves = { howl: 1 };

      const firstTurn = runCoordinatorTurn({
        seed: 4141,
        initialState,
        p1Action: createMoveAction(initialState.currentPokemon1!, howlMove(), 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      expect(countTurnEndSteps(firstTurn.steps)).toBe(1);
      expect(firstTurn.finalState.currentPokemon1!.disabledMoves).toBeUndefined();
      expect(firstTurn.finalState.currentPokemon1!.statStages.attack).toBe(0);
      expect(collectLogs(firstTurn.steps)).toContain('Uivo está desativado!');

      const secondTurn = runCoordinatorTurn({
        seed: 4142,
        initialState: firstTurn.finalState,
        p1Action: createMoveAction(firstTurn.finalState.currentPokemon1!, howlMove(), 1),
        p2Action: createMoveAction(firstTurn.finalState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
        preservePrngState: true,
      });

      expect(secondTurn.finalState.currentPokemon1!.statStages.attack).toBe(1);
    });

    it('limpa os contadores na troca voluntária', () => {
      const outgoing = createPokemon({ id: 33, name: 'Saindo', moves: [tackleMove()], disabledMoves: { tackle: 2 } });
      const incoming = createPokemon({ id: 34, name: 'Entrando', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 35, name: 'Oponente', hp: 300, maxHP: 300, moves: [tackleMove()] });
      const initialState = createBattleState([outgoing, incoming], [opponent]);

      const result = runCoordinatorTurn({
        seed: 4143,
        initialState,
        p1Action: createSwitchAction(initialState.currentPokemon1!, incoming, 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      const outgoingAfter = result.finalState.team1.find(pokemon => pokemon.name === 'Saindo')!;
      const incomingAfter = result.finalState.currentPokemon1!;
      expect(incomingAfter.name).toBe('Entrando');
      expect(outgoingAfter.disabledMoves).toBeUndefined();
      expect(incomingAfter.disabledMoves).toBeUndefined();
    });

    it('limpa os contadores também no Baton Pass, sem transferi-los ao substituto', () => {
      const outgoing = createPokemon({ id: 36, name: 'Passando', moves: [tackleMove()], disabledMoves: { tackle: 2, howl: 1 } });
      const incoming = createPokemon({ id: 37, name: 'Recebendo', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 38, name: 'Oponente', moves: [tackleMove()] });
      const initialState = createBattleState([outgoing, incoming], [opponent]);

      const result = performSwitch(initialState, incoming, 1, false, true);

      const outgoingAfter = result.newState.team1.find(pokemon => pokemon.name === 'Passando')!;
      expect(result.newState.currentPokemon1!.name).toBe('Recebendo');
      expect(outgoingAfter.disabledMoves).toBeUndefined();
      expect(result.newState.currentPokemon1!.disabledMoves).toBeUndefined();
    });
  });

  describe('Magnet Rise', () => {
    it('decrementa 5 turnos, expira e devolve a imunidade ao solo', () => {
      const initialState = createBattleState();
      const flyingTarget = initialState.currentPokemon1!;
      flyingTarget.statusEffects['magnet-rise'] = { turns: 5 };

      expect(isGrounded(flyingTarget)).toBe(false);
      expect(
        calculateTypeEffectiveness('ground', flyingTarget.types, flyingTarget.ability, undefined, 'earthquake', flyingTarget.statusEffects).multiplier,
      ).toBe(0);

      let state: BattleState = initialState;
      for (const expected of [4, 3, 2, 1]) {
        const ticked = processTurnEnd(state, CONFIG);
        state = ticked.newState;
        expect(state.currentPokemon1!.statusEffects['magnet-rise']).toEqual({ turns: expected });
        expect(isGrounded(state.currentPokemon1!)).toBe(false);
      }

      const expired = processTurnEnd(state, CONFIG);
      expect(expired.newState.currentPokemon1!.statusEffects['magnet-rise']).toBeUndefined();
      expect(isGrounded(expired.newState.currentPokemon1!)).toBe(true);
      expect(
        calculateTypeEffectiveness('ground', expired.newState.currentPokemon1!.types, expired.newState.currentPokemon1!.ability, undefined, 'earthquake', expired.newState.currentPokemon1!.statusEffects).multiplier,
      ).toBe(1);
    });

    it('decrementa exatamente uma vez por turno no coordenador', () => {
      const levitating = createPokemon({ id: 41, name: 'Levitando', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 42, name: 'Oponente', hp: 300, maxHP: 300, moves: [tackleMove()] });
      const initialState = createBattleState([levitating], [opponent]);
      initialState.currentPokemon1!.statusEffects['magnet-rise'] = { turns: 5 };

      const turn = runCoordinatorTurn({
        seed: 4151,
        initialState,
        p1Action: createMoveAction(initialState.currentPokemon1!, tackleMove(), 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      expect(countTurnEndSteps(turn.steps)).toBe(1);
      expect(turn.finalState.currentPokemon1!.statusEffects['magnet-rise']).toEqual({ turns: 4 });
    });

    it('perde o efeito na troca normal e mantém a herança do Baton Pass', () => {
      const outgoing = createPokemon({ id: 43, name: 'Saindo', moves: [tackleMove()] });
      const incoming = createPokemon({ id: 44, name: 'Entrando', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 45, name: 'Oponente', moves: [tackleMove()] });
      const baseState = createBattleState([outgoing, incoming], [opponent]);
      baseState.currentPokemon1!.statusEffects['magnet-rise'] = { turns: 3 };

      const normalSwitch = performSwitch(baseState, incoming, 1, false, false);
      expect(normalSwitch.newState.team1.find(pokemon => pokemon.name === 'Saindo')!.statusEffects['magnet-rise']).toBeUndefined();
      expect(normalSwitch.newState.currentPokemon1!.statusEffects['magnet-rise']).toBeUndefined();

      const batonPass = performSwitch(baseState, incoming, 1, false, true);
      expect(batonPass.newState.currentPokemon1!.statusEffects['magnet-rise']).toEqual({ turns: 3 });
      expect(batonPass.newState.team1.find(pokemon => pokemon.name === 'Saindo')!.statusEffects['magnet-rise']).toBeUndefined();
    });
  });

  describe('Telekinesis', () => {
    it('decrementa 3 turnos, expira e encerra imunidade ao solo e precisão garantida', () => {
      const initialState = createBattleState();
      const target = initialState.currentPokemon1!;
      target.statusEffects['telekinesis'] = { turns: 3 };
      const attacker = initialState.currentPokemon2!;

      expect(isGrounded(target)).toBe(false);
      expect(calculateHitChance(tackleMove(), attacker, target, 'none')).toBe('∞');

      const first = processTurnEnd(initialState, CONFIG);
      expect(first.newState.currentPokemon1!.statusEffects['telekinesis']).toEqual({ turns: 2 });

      const second = processTurnEnd(first.newState, CONFIG);
      expect(second.newState.currentPokemon1!.statusEffects['telekinesis']).toEqual({ turns: 1 });

      const third = processTurnEnd(second.newState, CONFIG);
      const expiredTarget = third.newState.currentPokemon1!;
      expect(expiredTarget.statusEffects['telekinesis']).toBeUndefined();
      expect(isGrounded(expiredTarget)).toBe(true);
      expect(calculateHitChance(tackleMove(), third.newState.currentPokemon2!, expiredTarget, 'none')).toBe(100);
    });

    it('decrementa exatamente uma vez por turno no coordenador', () => {
      const lifted = createPokemon({ id: 51, name: 'Levantado', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 52, name: 'Oponente', hp: 300, maxHP: 300, moves: [tackleMove()] });
      const initialState = createBattleState([lifted], [opponent]);
      initialState.currentPokemon1!.statusEffects['telekinesis'] = { turns: 3 };

      const turn = runCoordinatorTurn({
        seed: 4152,
        initialState,
        p1Action: createMoveAction(initialState.currentPokemon1!, tackleMove(), 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      expect(countTurnEndSteps(turn.steps)).toBe(1);
      expect(turn.finalState.currentPokemon1!.statusEffects['telekinesis']).toEqual({ turns: 2 });
    });

    it('não atravessa a troca, inclusive no Baton Pass', () => {
      const outgoing = createPokemon({ id: 53, name: 'Saindo', moves: [tackleMove()] });
      const incoming = createPokemon({ id: 54, name: 'Entrando', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 55, name: 'Oponente', moves: [tackleMove()] });
      const baseState = createBattleState([outgoing, incoming], [opponent]);
      baseState.currentPokemon1!.statusEffects['telekinesis'] = { turns: 2 };

      const normalSwitch = performSwitch(baseState, incoming, 1, false, false);
      expect(normalSwitch.newState.currentPokemon1!.statusEffects['telekinesis']).toBeUndefined();

      const batonPass = performSwitch(baseState, incoming, 1, false, true);
      expect(batonPass.newState.currentPokemon1!.statusEffects['telekinesis']).toBeUndefined();
      expect(isGrounded(batonPass.newState.currentPokemon1!)).toBe(true);
    });
  });

  describe('Glaive Rush', () => {
    it('decrementa 2 turnos e encerra dano dobrado e precisão garantida', () => {
      const attacker = createPokemon({ id: 61, name: 'Atacante', moves: [tackleMove()] });
      const vulnerable = createPokemon({ id: 62, name: 'Vulnerável', hp: 400, maxHP: 400, defenseStat: 100, moves: [tackleMove()] });
      const initialState = createBattleState([attacker], [vulnerable]);
      const state = initialState;
      const baseline = structuredClone(state.currentPokemon2!);
      state.currentPokemon2!.statusEffects['glaive-rush'] = { turns: 2 };

      const damageWithVulnerability = calculateDamage(
        state.currentPokemon1!,
        state.currentPokemon2!,
        tackleMove(),
        'none',
        false,
        1,
        0,
        [],
        state,
        100,
      );
      const damageWithoutVulnerability = calculateDamage(
        state.currentPokemon1!,
        baseline,
        tackleMove(),
        'none',
        false,
        1,
        0,
        [],
        state,
        100,
      );

      expect(damageWithVulnerability).toBeGreaterThan(damageWithoutVulnerability);
      expect(damageWithVulnerability).toBe(damageWithoutVulnerability * 2);
      expect(calculateHitChance(tackleMove(), state.currentPokemon1!, state.currentPokemon2!, 'none')).toBe('∞');

      const first = processTurnEnd(state, CONFIG);
      expect(first.newState.currentPokemon2!.statusEffects['glaive-rush']).toEqual({ turns: 1 });

      const second = processTurnEnd(first.newState, CONFIG);
      const expired = second.newState.currentPokemon2!;
      expect(expired.statusEffects['glaive-rush']).toBeUndefined();
      expect(calculateHitChance(tackleMove(), second.newState.currentPokemon1!, expired, 'none')).toBe(100);
      expect(
        calculateDamage(second.newState.currentPokemon1!, expired, tackleMove(), 'none', false, 1, 0, [], second.newState, 100),
      ).toBe(damageWithoutVulnerability);
    });

    it('decrementa exatamente uma vez por turno no coordenador', () => {
      const attacker = createPokemon({ id: 63, name: 'Investidor', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 64, name: 'Oponente', hp: 300, maxHP: 300, moves: [tackleMove()] });
      const initialState = createBattleState([attacker], [opponent]);
      initialState.currentPokemon1!.statusEffects['glaive-rush'] = { turns: 2 };

      const turn = runCoordinatorTurn({
        seed: 4161,
        initialState,
        p1Action: createMoveAction(initialState.currentPokemon1!, tackleMove(), 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      expect(countTurnEndSteps(turn.steps)).toBe(1);
      expect(turn.finalState.currentPokemon1!.statusEffects['glaive-rush']).toEqual({ turns: 1 });
    });

    it('não sobrevive à troca normal nem ao Baton Pass', () => {
      const outgoing = createPokemon({ id: 65, name: 'Saindo', moves: [tackleMove()] });
      const incoming = createPokemon({ id: 66, name: 'Entrando', moves: [tackleMove()] });
      const opponent = createPokemon({ id: 67, name: 'Oponente', moves: [tackleMove()] });
      const baseState = createBattleState([outgoing, incoming], [opponent]);
      baseState.currentPokemon1!.statusEffects['glaive-rush'] = { turns: 2 };

      const normalSwitch = performSwitch(baseState, incoming, 1, false, false);
      expect(normalSwitch.newState.currentPokemon1!.statusEffects['glaive-rush']).toBeUndefined();

      const batonPass = performSwitch(baseState, incoming, 1, false, true);
      expect(batonPass.newState.currentPokemon1!.statusEffects['glaive-rush']).toBeUndefined();
    });
  });

  describe('criação pelo caminho público', () => {
    const fastUser = (name: string, moves: ReturnType<typeof createMove>[]) =>
      createPokemon({ id: 71, name, speedStat: 150, moves });
    const slowTarget = (name: string) =>
      createPokemon({ id: 72, name, speedStat: 50, hp: 400, maxHP: 400, moves: [tackleMove()] });

    it('aplica Provocar pelo movimento e decrementa no mesmo turno', () => {
      const tauntMove = createMove({
        name: 'taunt',
        displayName: 'Provocar',
        type: 'dark',
        power: 0,
        isStatus: true,
        damageClass: 'status',
        accuracy: 100,
        uses: 20,
        maxUses: 20,
      });
      const user = fastUser('Provocador', [tauntMove]);
      const target = slowTarget('Provocado');
      const initialState = createBattleState([user], [target]);

      const turn = runCoordinatorTurn({
        seed: 4171,
        initialState,
        p1Action: createMoveAction(initialState.currentPokemon1!, tauntMove, 1),
        p2Action: createMoveAction(initialState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
      });

      expect(turn.finalState.currentPokemon2!.statusEffects.taunt).toEqual(
        expect.objectContaining({ turns: 2 }),
      );
    });

    it('aplica Bis pelo movimento e decrementa no mesmo turno', () => {
      const encoreMove = createMove({
        name: 'encore',
        displayName: 'Bis',
        type: 'normal',
        power: 0,
        isStatus: true,
        damageClass: 'status',
        accuracy: 100,
        uses: 20,
        maxUses: 20,
      });
      const user = fastUser('Bisador', [tackleMove(), encoreMove]);
      const target = slowTarget('Bisado');

      const firstTurn = runCoordinatorTurn({
        seed: 4172,
        initialState: createBattleState([user], [target]),
        p1Action: createMoveAction(user, tackleMove(), 1),
        p2Action: createMoveAction(target, tackleMove(), 2),
        config: CONFIG,
      });

      const secondTurn = runCoordinatorTurn({
        seed: 4173,
        initialState: firstTurn.finalState,
        p1Action: createMoveAction(firstTurn.finalState.currentPokemon1!, encoreMove, 1),
        p2Action: createMoveAction(firstTurn.finalState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
        preservePrngState: true,
      });

      expect(secondTurn.finalState.currentPokemon2!.statusEffects.encore).toEqual(
        expect.objectContaining({ turns: 2, moveName: 'tackle' }),
      );
    });

    it('aplica Desativação pelo movimento e decrementa no mesmo turno', () => {
      const disableMove = createMove({
        name: 'disable',
        displayName: 'Desativar',
        type: 'normal',
        power: 0,
        isStatus: true,
        damageClass: 'status',
        accuracy: 100,
        uses: 20,
        maxUses: 20,
      });
      const user = fastUser('Desativador', [tackleMove(), disableMove]);
      const target = slowTarget('Desativado');

      const firstTurn = runCoordinatorTurn({
        seed: 4174,
        initialState: createBattleState([user], [target]),
        p1Action: createMoveAction(user, tackleMove(), 1),
        p2Action: createMoveAction(target, tackleMove(), 2),
        config: CONFIG,
      });

      const secondTurn = runCoordinatorTurn({
        seed: 4175,
        initialState: firstTurn.finalState,
        p1Action: createMoveAction(firstTurn.finalState.currentPokemon1!, disableMove, 1),
        p2Action: createMoveAction(firstTurn.finalState.currentPokemon2!, tackleMove(), 2),
        config: CONFIG,
        preservePrngState: true,
      });

      expect(secondTurn.finalState.currentPokemon2!.disabledMoves).toEqual({ tackle: 3 });
    });

    it('aplica Levitação Magnética e Telecinesia pelos movimentos e decrementa', () => {
      const magnetRiseMove = createMove({
        name: 'magnet-rise',
        displayName: 'Levitação Magnética',
        type: 'electric',
        power: 0,
        isStatus: true,
        damageClass: 'status',
        accuracy: 100,
        uses: 20,
        maxUses: 20,
      });
      const telekinesisMove = createMove({
        name: 'telekinesis',
        displayName: 'Telecinesia',
        type: 'psychic',
        power: 0,
        isStatus: true,
        damageClass: 'status',
        accuracy: 100,
        uses: 20,
        maxUses: 20,
      });

      const levitatingUser = fastUser('Levitador', [magnetRiseMove]);
      const levitatingTarget = slowTarget('Alvo');
      const liftTurn = runCoordinatorTurn({
        seed: 4176,
        initialState: createBattleState([levitatingUser], [levitatingTarget]),
        p1Action: createMoveAction(levitatingUser, magnetRiseMove, 1),
        p2Action: createMoveAction(levitatingTarget, tackleMove(), 2),
        config: CONFIG,
      });

      expect(liftTurn.finalState.currentPokemon1!.statusEffects['magnet-rise']).toEqual({ turns: 4 });

      const user = fastUser('Telecinético', [telekinesisMove]);
      const target = slowTarget('Levantado');
      const telekinesisTurn = runCoordinatorTurn({
        seed: 4177,
        initialState: createBattleState([user], [target]),
        p1Action: createMoveAction(user, telekinesisMove, 1),
        p2Action: createMoveAction(target, tackleMove(), 2),
        config: CONFIG,
      });

      expect(telekinesisTurn.finalState.currentPokemon2!.statusEffects['telekinesis']).toEqual({ turns: 2 });
    });

    it('aplica Investida de Glaive pelo golpe e decrementa no mesmo turno', () => {
      const glaiveRushMove = createMove({
        name: 'glaive-rush',
        displayName: 'Investida de Glaive',
        type: 'dragon',
        power: 120,
        damageClass: 'physical',
        accuracy: 100,
        uses: 5,
        maxUses: 5,
        effect: { status: 'glaive-rush', chance: 100 },
      });
      const user = fastUser('Investidor', [glaiveRushMove]);
      const target = slowTarget('Alvo');

      const turn = runCoordinatorTurn({
        seed: 4178,
        initialState: createBattleState([user], [target]),
        p1Action: createMoveAction(user, glaiveRushMove, 1),
        p2Action: createMoveAction(target, tackleMove(), 2),
        config: CONFIG,
      });

      expect(turn.finalState.currentPokemon1!.statusEffects['glaive-rush']).toEqual({ turns: 1 });
      expect(collectLogs(turn.steps)).toContain('Investidor baixou a guarda e ficou vulnerável!');
    });
  });
});
