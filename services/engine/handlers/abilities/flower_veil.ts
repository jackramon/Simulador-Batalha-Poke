
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Véu de Flor (Flower Veil).
 * Regra Oficial: Protege Pokémon do tipo Grama de reduções de atributos e condições de status.
 * Esta habilidade É ignorada por Mold Breaker.
 */

/**
 * Verifica se o Pokémon está protegido contra condições de status pelo Véu de Flor.
 */
export function isImmuneToStatus(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    
    // O efeito só se aplica se o Pokémon for do tipo Grama
    return pokemon.ability === 'flower-veil' && pokemon.types.includes('grass');
}

/**
 * Verifica se o Pokémon está protegido contra redução de atributos pelo Véu de Flor.
 */
export function isImmuneToStatDrops(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    
    // O efeito só se aplica se o Pokémon for do tipo Grama
    return pokemon.ability === 'flower-veil' && pokemon.types.includes('grass');
}
