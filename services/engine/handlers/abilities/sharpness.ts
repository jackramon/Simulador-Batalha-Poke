
import { Pokemon, Move } from '../../../../types';
import { SLICING_MOVES } from '../../../../data/moves';

/**
 * Calcula o multiplicador de poder para a habilidade Agudeza (Sharpness).
 * Regra Gen 9: Aumenta o poder de movimentos de corte (slicing moves) em 50% (1.5x).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'sharpness' && SLICING_MOVES.includes(move.name)) {
        return 1.5;
    }
    return 1;
}

/**
 * Verifica se um movimento é considerado um movimento de corte.
 */
export function isSlicingMove(move: Move): boolean {
    return SLICING_MOVES.includes(move.name);
}
