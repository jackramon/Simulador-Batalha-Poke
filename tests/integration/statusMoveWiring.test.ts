import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../types';
import { createBattleState, createMove, createPokemon, createSideHazards } from '../factories';
import {
  createBattleConfig,
  createMoveAction,
  createSwitchAction,
  runCoordinatorTurn,
  type CompletedTurn,
} from './coordinator.helpers';

const config = createBattleConfig();

const createStatusMove = (name: string) => createMove({
  name,
  displayName: name,
  power: 0,
  isStatus: true,
  damageClass: 'status',
});

const runP1StatusMove = (state: BattleState, name: string, seed: number): CompletedTurn => {
  const result = runCoordinatorTurn({
    seed,
    initialState: state,
    p1Action: createMoveAction(state.currentPokemon1!, createStatusMove(name), 1),
    config,
  });
  expect(result.completed).toBe(true);
  return result;
};

const getAfterActionSnapshot = (result: CompletedTurn): BattleState => {
  const index = result.steps.findIndex(step => step.phase === 'after-action');
  expect(index).toBeGreaterThanOrEqual(0);
  return result.stateSnapshots[index];
};

describe('wiring público de golpes de status', () => {
  it('cria hazards no lado adversário, limita camadas e os aplica na próxima entrada', () => {
    const user = createPokemon({ id: 301, name: 'Usuário' });
    const defender = createPokemon({ id: 401, name: 'Defensor' });
    const reserve = createPokemon({
      id: 402,
      name: 'Reserva',
      hp: 400,
      maxHP: 400,
      types: ['normal'],
    });
    let state = createBattleState([user], [defender, reserve]);
    const uses = [
      'stealth-rock',
      'sticky-web',
      'spikes',
      'spikes',
      'spikes',
      'spikes',
      'toxic-spikes',
      'toxic-spikes',
      'toxic-spikes',
    ];

    uses.forEach((name, index) => {
      state = runP1StatusMove(state, name, 2300 + index).finalState;
    });

    expect(state.p2Hazards).toMatchObject({
      stealthRock: true,
      stickyWeb: true,
      spikes: 3,
      toxicSpikes: 2,
    });
    expect(state.p1Hazards).toEqual(createSideHazards());
    expect(defender.statusEffects).toEqual({});

    const switchResult = runCoordinatorTurn({
      seed: 2399,
      initialState: state,
      p2Action: createSwitchAction(defender, reserve, 2),
      config,
    });
    const entryState = getAfterActionSnapshot(switchResult);

    expect(switchResult.completed).toBe(true);
    expect(entryState.currentPokemon2?.id).toBe(reserve.id);
    expect(entryState.currentPokemon2?.hp).toBe(250);
    expect(entryState.currentPokemon2?.statusEffects.toxic).toEqual({ turns: 0 });
    expect(entryState.currentPokemon2?.statStages.speed).toBe(-1);
  });

  it.each([
    { name: 'reflect', property: 'reflect', damageClass: 'physical', seed: 2411 },
    { name: 'light-screen', property: 'lightScreen', damageClass: 'special', seed: 2412 },
    { name: 'aurora-veil', property: 'auroraVeil', damageClass: 'physical', seed: 2413 },
  ] as const)('cria $name no lado do usuário e reduz o dano $damageClass', ({
    name,
    property,
    damageClass,
    seed,
  }) => {
    const type = name === 'aurora-veil' ? 'ice' : 'normal';
    const user = createPokemon({ id: 311, name: 'Usuário', hp: 400, maxHP: 400, types: [type] });
    const defender = createPokemon({ id: 411, name: 'Defensor', types: [type] });
    const initialState = createBattleState([user], [defender], {
      weather: name === 'aurora-veil' ? 'hail' : 'none',
      weatherTurns: name === 'aurora-veil' ? 5 : 0,
    });

    const setup = runP1StatusMove(initialState, name, seed);
    const activeState = getAfterActionSnapshot(setup);

    expect(activeState.p1Hazards[property]).toBe(5);
    expect(activeState.p2Hazards[property]).toBe(0);
    expect(setup.finalState.p1Hazards[property]).toBe(4);
    expect(defender.statusEffects).toEqual({});

    const unprotectedState = structuredClone(setup.finalState);
    unprotectedState.p1Hazards[property] = 0;
    const runAttack = (state: BattleState) => runCoordinatorTurn({
      seed: seed + 100,
      initialState: state,
      p2Action: createMoveAction(state.currentPokemon2!, createMove({
        name: `ataque-${damageClass}`,
        power: 100,
        type: 'fighting',
        damageClass,
      }), 2),
      config,
    });
    const protectedAttack = runAttack(setup.finalState);
    const unprotectedAttack = runAttack(unprotectedState);
    const protectedHp = getAfterActionSnapshot(protectedAttack).currentPokemon1!.hp;
    const unprotectedHp = getAfterActionSnapshot(unprotectedAttack).currentPokemon1!.hp;
    const unprotectedDamage = 400 - unprotectedHp;
    const protectedDamage = 400 - protectedHp;

    expect(unprotectedDamage).toBeGreaterThan(0);
    expect(protectedDamage).toBe(Math.floor(unprotectedDamage / 2));
  });

  it('mantém o requisito de neve para Aurora Veil', () => {
    // A ausência de clima já impedia o efeito antes do wiring; este limite deve ser preservado.
    const user = createPokemon({ id: 312, name: 'Usuário' });
    const defender = createPokemon({ id: 412, name: 'Defensor' });
    const result = runP1StatusMove(createBattleState([user], [defender]), 'aurora-veil', 2499);
    const activeState = getAfterActionSnapshot(result);

    expect(activeState.weather).toBe('none');
    expect(activeState.p1Hazards.auroraVeil).toBe(0);
    expect(activeState.p2Hazards.auroraVeil).toBe(0);
    expect(defender.statusEffects).toEqual({});
  });

  it.each([
    { name: 'trick-room', activeKey: 'trickRoomActive', turnsKey: 'trickRoomTurns', seed: 2511 },
    { name: 'gravity', activeKey: 'gravity', turnsKey: 'gravityTurns', seed: 2512 },
  ] as const)('ativa $name com duração e o expira pelo turnEnd', ({
    name,
    activeKey,
    turnsKey,
    seed,
  }) => {
    const user = createPokemon({ id: 321, name: 'Usuário' });
    const defender = createPokemon({ id: 421, name: 'Defensor' });
    const setup = runP1StatusMove(createBattleState([user], [defender]), name, seed);
    const activeState = getAfterActionSnapshot(setup);

    expect(activeState[activeKey]).toBe(true);
    expect(activeState[turnsKey]).toBe(5);
    expect(setup.finalState[turnsKey]).toBe(4);
    expect(defender.statusEffects).toEqual({});

    let state = setup.finalState;
    for (const remaining of [3, 2, 1]) {
      const result = runCoordinatorTurn({ seed: seed + 10 + remaining, initialState: state, config });
      expect(result.completed).toBe(true);
      state = result.finalState;
      expect(state[activeKey]).toBe(true);
      expect(state[turnsKey]).toBe(remaining);
    }

    state = runCoordinatorTurn({ seed: seed + 20, initialState: state, config }).finalState;
    expect(state[activeKey]).toBe(false);
    expect(state[turnsKey]).toBe(0);
  });

  it.each([
    { name: 'safeguard', property: 'safeguard', seed: 2611 },
    { name: 'mist', property: 'mist', seed: 2612 },
    { name: 'lucky-chant', property: 'luckyChant', seed: 2613 },
  ] as const)('cria $name no lado do usuário e o expira pelo turnEnd', ({
    name,
    property,
    seed,
  }) => {
    const user = createPokemon({ id: 331, name: 'Usuário' });
    const defender = createPokemon({ id: 431, name: 'Defensor' });
    const setup = runP1StatusMove(createBattleState([user], [defender]), name, seed);
    const activeState = getAfterActionSnapshot(setup);

    expect(activeState.p1Hazards[property]).toBe(5);
    expect(activeState.p2Hazards[property]).toBe(0);
    expect(setup.finalState.p1Hazards[property]).toBe(4);
    expect(defender.statusEffects).toEqual({});

    let state = setup.finalState;
    for (const remaining of [3, 2, 1]) {
      state = runCoordinatorTurn({
        seed: seed + 10 + remaining,
        initialState: state,
        config,
      }).finalState;
      expect(state.p1Hazards[property]).toBe(remaining);
    }

    state = runCoordinatorTurn({ seed: seed + 20, initialState: state, config }).finalState;
    expect(state.p1Hazards[property]).toBe(0);
    expect(state.p2Hazards[property]).toBe(0);
  });
});
