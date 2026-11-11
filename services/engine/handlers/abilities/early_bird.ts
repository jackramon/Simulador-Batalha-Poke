
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Madrugador (Early Bird).
 * Regra Oficial: O Pokémon acorda do sono duas vezes mais rápido.
 * Na prática, cada turno dormindo conta como 2 turnos para o progresso do despertar.
 */
export function getSleepIncrement(pokemon: Pokemon, isGasActive: boolean = false): number {
    if (pokemon.ability === 'early-bird' && !isGasActive && !pokemon.isFainted) {
        return 2;
    }
    return 1;
}
