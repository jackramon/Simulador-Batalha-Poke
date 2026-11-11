
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon é imune a reduções de atributos devido à habilidade Corpo Metálico (Full Metal Body).
 * Regra Especial: Diferente de Clear Body/White Smoke, esta habilidade NÃO é ignorada por Mold Breaker.
 */
export function isImmuneToStatDrops(pokemon: Pokemon): boolean {
    return pokemon.ability === 'full-metal-body' && !pokemon.isFainted;
}
