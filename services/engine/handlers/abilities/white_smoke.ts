
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon é imune a reduções de atributos causadas por outros Pokémon
 * devido à habilidade Fumaça Branca (White Smoke).
 */
export function isImmuneToStatDrops(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities) return false;
    return pokemon.ability === 'white-smoke';
}
