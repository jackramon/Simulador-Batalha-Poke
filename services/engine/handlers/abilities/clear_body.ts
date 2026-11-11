
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon é imune a reduções de atributos devido à habilidade Corpo Puro (Clear Body).
 * Regra: Impede reduções causadas por oponentes, MAS é ignorada por Mold Breaker.
 */
export function isImmuneToStatDrops(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities) return false;
    return pokemon.ability === 'clear-body' && !pokemon.isFainted;
}
