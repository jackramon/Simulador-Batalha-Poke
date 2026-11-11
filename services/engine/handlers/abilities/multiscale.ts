import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Multiescamas (Multiscale) e Escudo das Sombras (Shadow Shield).
 * Regra Oficial: Reduz o dano recebido em 50% (0.5x) se o Pokémon estiver com HP cheio.
 */
export function getDamageMultiplier(defender: Pokemon, ignoresAbilities: boolean): number {
    if (defender.isFainted) return 1.0;

    // Multiscale: Reduz dano em 50% se HP estiver cheio. É ignorada por Mold Breaker.
    if (defender.ability === 'multiscale' && defender.hp === defender.maxHP && !ignoresAbilities) {
        return 0.5;
    }

    // Shadow Shield: Efeito idêntico ao Multiscale, mas NÃO é ignorada por Mold Breaker.
    if (defender.ability === 'shadow-shield' && defender.hp === defender.maxHP) {
        return 0.5;
    }

    return 1.0;
}
