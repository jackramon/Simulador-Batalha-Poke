
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon é imune ao recuo (flinch) devido à habilidade Foco Interno (Inner Focus).
 */
export function isImmuneToFlinch(pokemon: Pokemon): boolean {
    return pokemon.ability === 'inner-focus';
}

/**
 * Verifica se o Pokémon é imune à redução de Ataque por Intimidação (Intimidate)
 * devido à habilidade Foco Interno (Regra Gen 8+).
 */
export function isImmuneToIntimidate(pokemon: Pokemon): boolean {
    return pokemon.ability === 'inner-focus';
}
