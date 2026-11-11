import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Olho da Mente (Mind's Eye).
 * 1. O Pokémon pode atingir Fantasmas com movimentos Normal e Lutador.
 * 2. A precisão do Pokémon não pode ser reduzida.
 * 3. O Pokémon ignora as mudanças de evasão do oponente.
 */

/**
 * Verifica se o Pokémon pode atingir Fantasmas com o golpe atual.
 */
export function canHitGhost(attackerAbility: string | undefined, moveType: string): boolean {
    if (attackerAbility !== 'minds-eye') return false;
    const type = moveType.toLowerCase();
    return type === 'normal' || type === 'fighting';
}

/**
 * Verifica se o Pokémon é imune à redução de precisão.
 */
export function isImmuneToAccuracyDrop(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    return pokemon.ability === 'minds-eye';
}
