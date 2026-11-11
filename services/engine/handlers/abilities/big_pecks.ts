
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon é imune à redução de Defesa devido à habilidade Peitorais (Big Pecks).
 */
export function isImmuneToDefenseDrop(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities) return false;
    return pokemon.ability === 'big-pecks';
}
