
import { Pokemon } from '../../../../types';

/**
 * Calcula o multiplicador de Defesa para a habilidade Escama Maravilha (Marvel Scale).
 * Regra: Aumenta a Defesa em 50% (1.5x) se o Pokémon tiver uma condição de status principal.
 */
export function getDefenseMultiplier(pokemon: Pokemon): number {
    if (pokemon.ability !== 'marvel-scale' || pokemon.isFainted) {
        return 1;
    }

    // Condições de status principais: burn, paralysis, poison, toxic, sleep, freeze
    const hasStatus = Object.keys(pokemon.statusEffects).some(status =>
        ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(status)
    );

    return hasStatus ? 1.5 : 1;
}
