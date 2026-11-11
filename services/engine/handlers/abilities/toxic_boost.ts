
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Impulso Tóxico (Toxic Boost).
 * Regra Oficial: Aumenta o Ataque físico em 50% (1.5x) quando o Pokémon está envenenado.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability !== 'toxic-boost') {
        return 1.0;
    }

    // Verifica se o Pokémon está envenenado (poison ou toxic)
    const isPoisoned = attacker.statusEffects.poison || attacker.statusEffects.toxic;

    // O bônus só se aplica a ataques Físicos
    if (isPoisoned && move.damageClass === 'physical') {
        return 1.5;
    }

    return 1.0;
}
