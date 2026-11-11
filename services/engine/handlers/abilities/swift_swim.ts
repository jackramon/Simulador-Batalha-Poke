
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Nado Rápido (Swift Swim).
 * Regra Oficial: Dobra a Velocidade do Pokémon durante a chuva.
 */
export function getSpeedMultiplier(pokemon: Pokemon, weather: string): number {
    if (pokemon.ability === 'swift-swim' && weather === 'rain' && !pokemon.isFainted) {
        return 2;
    }
    return 1;
}
