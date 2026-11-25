import { afterEach, describe, expect, it, vi } from 'vitest';
import { performSwitch } from '../../services/engine/switching';
import { normalizeBattleTeams } from '../../utils/pokemonIdentity';
import { createBattleState, createPokemon } from '../factories';

describe('identidade única das instâncias de Pokémon', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gera IDs por lado e slot para espelho e duplicatas importadas, sem consumir PRNG', () => {
    const team1 = [
      createPokemon({ id: 25, name: 'Pikachu A' }),
      createPokemon({ id: 25, name: 'Pikachu B' }),
    ];
    const team2 = [createPokemon({ id: 25, name: 'Pikachu C' })];
    const randomSpy = vi.spyOn(Math, 'random');

    const normalized = normalizeBattleTeams(team1, team2);
    const allPokemon = [...normalized.team1, ...normalized.team2];

    expect(normalized.team1.map(pokemon => pokemon.instanceId)).toEqual(['p1-slot-0', 'p1-slot-1']);
    expect(normalized.team2.map(pokemon => pokemon.instanceId)).toEqual(['p2-slot-0']);
    expect(new Set(allPokemon.map(pokemon => pokemon.instanceId)).size).toBe(allPokemon.length);
    expect(allPokemon.map(pokemon => pokemon.id)).toEqual([25, 25, 25]);
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it('preserva IDs existentes e referências ao normalizar novamente', () => {
    const first = normalizeBattleTeams(
      [createPokemon({ id: 25 }), createPokemon({ id: 25 })],
      [createPokemon({ id: 25 })],
    );

    const second = normalizeBattleTeams(first.team1, first.team2);

    expect(second.team1.map(pokemon => pokemon.instanceId)).toEqual(first.team1.map(pokemon => pokemon.instanceId));
    expect(second.team2.map(pokemon => pokemon.instanceId)).toEqual(first.team2.map(pokemon => pokemon.instanceId));
    expect(second.team1[0]).toBe(first.team1[0]);
    expect(second.team1[1]).toBe(first.team1[1]);
    expect(second.team2[0]).toBe(first.team2[0]);
  });

  it('mantém o instanceId em clones e trocas', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    const state = createBattleState(
      [createPokemon({ id: 25, name: 'Titular' }), createPokemon({ id: 25, name: 'Reserva' })],
      [createPokemon({ id: 25, name: 'Oponente' })],
    );
    const reserve = state.team1[1];
    const reserveInstanceId = reserve.instanceId;
    const clone = structuredClone(reserve);

    expect(clone.instanceId).toBe(reserveInstanceId);
    expect(reserveInstanceId).toBe('p1-slot-1');

    const result = performSwitch(state, reserve, 1, false);

    expect(result.newState.currentPokemon1).toBe(reserve);
    expect(result.newState.currentPokemon1?.instanceId).toBe(reserveInstanceId);
    expect(result.newState.team1[0].instanceId).toBe('p1-slot-0');
    expect(result.newState.team1[1].instanceId).toBe(reserveInstanceId);
    expect(result.newState.currentPokemon2?.instanceId).toBe('p2-slot-0');
    expect(randomSpy).not.toHaveBeenCalled();
  });
});
