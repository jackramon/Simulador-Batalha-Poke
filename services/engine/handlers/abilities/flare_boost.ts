
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Impulso de Chamas (Flare Boost).
 * Regra Oficial: Aumenta o Ataque Especial em 50% (1.5x) quando o Pokémon está queimado.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'flare-boost' && attacker.statusEffects.burn && move.damageClass === 'special') {
        return 1.5;
    }
    return 1.0;
}
