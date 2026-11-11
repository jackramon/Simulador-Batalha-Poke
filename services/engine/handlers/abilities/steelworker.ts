
import { Pokemon, Move } from '../../../../types';

/**
 * Calcula o multiplicador de poder para a habilidade Metalúrgico (Steelworker).
 * Regra: Aumenta o poder de movimentos do tipo Aço em 50% (1.5x).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'steelworker' && move.type === 'steel') {
        return 1.5;
    }
    return 1;
}
