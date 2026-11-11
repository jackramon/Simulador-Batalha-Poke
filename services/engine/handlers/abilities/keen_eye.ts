
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon é imune à redução de Precisão devido à habilidade Olhar Aguçado (Keen Eye) ou Olho da Mente (Mind's Eye).
 */
export function isImmuneToAccuracyDrop(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    
    return pokemon.ability === 'keen-eye' || pokemon.ability === 'minds-eye';
}
