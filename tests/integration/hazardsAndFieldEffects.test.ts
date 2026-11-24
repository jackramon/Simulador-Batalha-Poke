import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateDamage } from '../../services/engine/handlers/damageUtils';
import { performSwitch } from '../../services/engine/switching';
import { processTurnEnd } from '../../services/engine/turnEnd';
import { disableDeterministicRandom, enableDeterministicRandom } from '../../utils/prng';
import { createBattleState, createMove, createPokemon, createSideHazards } from '../factories';
import { createBattleConfig } from './coordinator.helpers';

describe('integração de hazards, telas e efeitos temporários', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => {
      throw new Error('Rede proibida nos testes de integração de campo');
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('aplica o dano de Stealth Rock e Spikes na entrada por troca', () => {
    enableDeterministicRandom(1301);
    try {
      const outgoing = createPokemon({ id: 101, name: 'Titular' });
      const reserve = createPokemon({
        id: 102,
        name: 'Reserva de Fogo',
        hp: 400,
        maxHP: 400,
        types: ['fire'],
      });
      const opponent = createPokemon({ id: 201, name: 'Oponente' });
      const initialState = createBattleState([outgoing, reserve], [opponent], {
        p1Hazards: { ...createSideHazards(), stealthRock: true, spikes: 1 },
      });

      const { newState } = performSwitch(initialState, reserve, 1, false);

      expect(newState.currentPokemon1).toBe(reserve);
      expect(reserve.hp).toBe(250);
      expect(reserve.isFainted).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      disableDeterministicRandom();
    }
  });

  it('preserva um Pokémon voador dos hazards que exigem contato com o chão', () => {
    enableDeterministicRandom(1302);
    try {
      const outgoing = createPokemon({ id: 111, name: 'Titular' });
      const reserve = createPokemon({
        id: 112,
        name: 'Reserva Voadora',
        hp: 400,
        maxHP: 400,
        types: ['flying'],
      });
      const opponent = createPokemon({ id: 211, name: 'Oponente' });
      const initialState = createBattleState([outgoing, reserve], [opponent], {
        p1Hazards: { ...createSideHazards(), spikes: 3, toxicSpikes: 2, stickyWeb: true },
      });

      performSwitch(initialState, reserve, 1, false);

      expect(reserve.hp).toBe(400);
      expect(reserve.statusEffects.poison).toBeUndefined();
      expect(reserve.statusEffects.toxic).toBeUndefined();
      expect(reserve.statStages.speed).toBe(0);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      disableDeterministicRandom();
    }
  });

  it('aplica Toxic Spikes e Sticky Web já presentes na entrada por troca', () => {
    enableDeterministicRandom(1303);
    try {
      const outgoing = createPokemon({ id: 121, name: 'Titular' });
      const reserve = createPokemon({ id: 122, name: 'Reserva Terrestre', hp: 400, maxHP: 400 });
      const opponent = createPokemon({ id: 221, name: 'Oponente' });
      const initialState = createBattleState([outgoing, reserve], [opponent], {
        p1Hazards: { ...createSideHazards(), toxicSpikes: 2, stickyWeb: true },
      });

      performSwitch(initialState, reserve, 1, false);

      expect(reserve.hp).toBe(400);
      expect(reserve.statusEffects.toxic).toEqual({ turns: 0 });
      expect(reserve.statusEffects.poison).toBeUndefined();
      expect(reserve.statStages.speed).toBe(-1);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      disableDeterministicRandom();
    }
  });

  it.each([
    { damageClass: 'physical', screen: 'reflect', seed: 1311, label: 'físico com Reflect' },
    { damageClass: 'special', screen: 'lightScreen', seed: 1312, label: 'especial com Light Screen' },
  ] as const)('reduz pela metade o dano $label já ativo', ({ damageClass, screen, seed }) => {
    enableDeterministicRandom(seed);
    try {
      const defender = createPokemon({ id: 131, name: 'Defensor', hp: 400, maxHP: 400 });
      const attacker = createPokemon({ id: 231, name: 'Atacante', hp: 400, maxHP: 400 });
      const baseState = createBattleState([defender], [attacker]);
      const unprotectedState = structuredClone(baseState);
      const protectedState = structuredClone(baseState);
      protectedState.p1Hazards[screen] = 3;
      const move = createMove({
        name: `teste-${damageClass}`,
        power: 100,
        type: 'fighting',
        damageClass,
      });

      const unprotectedDamage = calculateDamage(
        unprotectedState.currentPokemon2!,
        unprotectedState.currentPokemon1!,
        move,
        'none',
        false,
        1,
        0,
        [],
        unprotectedState,
        100,
      );
      const protectedDamage = calculateDamage(
        protectedState.currentPokemon2!,
        protectedState.currentPokemon1!,
        move,
        'none',
        false,
        1,
        0,
        [],
        protectedState,
        100,
      );

      expect(unprotectedDamage).toBeGreaterThan(0);
      expect(protectedDamage).toBe(Math.floor(unprotectedDamage / 2));
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      disableDeterministicRandom();
    }
  });

  it('decrementa telas e efeitos temporários sem expirar quem ainda tem duração', () => {
    enableDeterministicRandom(1321);
    try {
      const initialState = createBattleState(undefined, undefined, {
        turn: 8,
        trickRoomActive: true,
        trickRoomTurns: 3,
        mudSportTurns: 2,
        p1Hazards: { ...createSideHazards(),
          reflect: 3,
          lightScreen: 2,
          auroraVeil: 4,
          safeguard: 2,
          mist: 3,
          tailwind: 2,
        },
        p2Hazards: { ...createSideHazards(),
          reflect: 4,
          lightScreen: 5,
          auroraVeil: 5,
          safeguard: 4,
          mist: 5,
          tailwind: 4,
        },
      });
      const before = structuredClone(initialState);

      const { newState } = processTurnEnd(initialState, createBattleConfig());

      expect(newState.p1Hazards).toEqual({
        ...before.p1Hazards,
        reflect: 2,
        lightScreen: 1,
        auroraVeil: 3,
        safeguard: 1,
        mist: 2,
        tailwind: 1,
      });
      expect(newState.p2Hazards).toEqual({
        ...before.p2Hazards,
        reflect: 3,
        lightScreen: 4,
        auroraVeil: 4,
        safeguard: 3,
        mist: 4,
        tailwind: 3,
      });
      expect(newState.trickRoomActive).toBe(true);
      expect(newState.trickRoomTurns).toBe(2);
      expect(newState.mudSportTurns).toBe(1);
      expect(newState.turn).toBe(before.turn + 1);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      disableDeterministicRandom();
    }
  });

  it('expira telas e efeitos temporários quando seu último tick termina', () => {
    enableDeterministicRandom(1322);
    try {
      const initialState = createBattleState(undefined, undefined, {
        turn: 12,
        trickRoomActive: true,
        trickRoomTurns: 1,
        mudSportTurns: 1,
        p1Hazards: { ...createSideHazards(),
          reflect: 1,
          lightScreen: 1,
          auroraVeil: 1,
          safeguard: 1,
          mist: 1,
          tailwind: 1,
        },
      });
      const before = structuredClone(initialState);

      const { newState } = processTurnEnd(initialState, createBattleConfig());

      expect(newState.p1Hazards).toEqual({
        ...before.p1Hazards,
        reflect: 0,
        lightScreen: 0,
        auroraVeil: 0,
        safeguard: 0,
        mist: 0,
        tailwind: 0,
      });
      expect(newState.p2Hazards).toEqual(before.p2Hazards);
      expect(newState.trickRoomActive).toBe(false);
      expect(newState.trickRoomTurns).toBe(0);
      expect(newState.mudSportTurns).toBe(0);
      expect(newState.turn).toBe(before.turn + 1);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      disableDeterministicRandom();
    }
  });
});
