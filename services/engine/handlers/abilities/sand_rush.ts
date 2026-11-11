
import { Pokemon } from '../../../../types';

/**
 * Calcula o multiplicador de velocidade para a habilidade Ímpeto de Areia (Sand Rush).
 * Regra: Dobra a velocidade durante uma Tempestade de Areia (Sandstorm).
 */
export function getSpeedMultiplier(pokemon: Pokemon, weather: string): number {
    if (pokemon.ability === 'sand-rush' && weather === 'sand') {
        return 2;
    }
    return 1;
}
