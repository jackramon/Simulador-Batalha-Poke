
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Destemido (Scrappy).
 * 1. Ofensivo: Permite que movimentos de tipo Normal e Lutador atinjam alvos do tipo Fantasma.
 * 2. Defensivo: O Pokémon é imune à habilidade Intimidação (Intimidate).
 */

/**
 * Verifica se o Pokémon pode atingir Fantasmas com o golpe atual.
 */
export function canHitGhost(attackerAbility: string | undefined, moveType: string): boolean {
    if (attackerAbility !== 'scrappy') return false;
    const type = moveType.toLowerCase();
    return type === 'normal' || type === 'fighting';
}

/**
 * Verifica se o Pokémon é imune à Intimidação.
 */
export function isImmuneToIntimidate(pokemon: Pokemon): boolean {
    return pokemon.ability === 'scrappy' && !pokemon.isFainted;
}
