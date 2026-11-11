
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Escamas de Gelo (Ice Scales).
 * Regra Oficial: Reduz o dano recebido de ataques ESPECIAIS pela metade (0.5x).
 * Esta habilidade é ignorada por Mold Breaker, Teravolt e Turboblaze.
 */
export function getDamageMultiplier(defender: Pokemon, move: Move, ignoresAbilities: boolean): number {
    if (defender.ability !== 'ice-scales' || defender.isFainted || ignoresAbilities) {
        return 1.0;
    }

    // Apenas movimentos da categoria Especial são afetados
    if (move.damageClass === 'special') {
        return 0.5;
    }

    return 1.0;
}
