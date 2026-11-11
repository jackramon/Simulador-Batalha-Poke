
import { Pokemon, Move } from '../../../../types';

/**
 * Calcula o multiplicador de poder para a habilidade Transistor.
 * Regra: Aumenta o poder de movimentos do tipo Elétrico em 30% (1.3x).
 * Nota: Originalmente era 1.5x na Gen 8, mas foi nerfada para 1.3x na Gen 9.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'transistor' && move.type === 'electric') {
        return 1.3;
    }
    return 1;
}
