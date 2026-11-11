
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon é imune à redução de Ataque devido à habilidade Hiper Cortador (Hyper Cutter).
 * Regra: Impede reduções causadas por oponentes, MAS é ignorada por Mold Breaker.
 */
export function isImmuneToAttackDrop(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities) return false;
    return pokemon.ability === 'hyper-cutter' && !pokemon.isFainted;
}
