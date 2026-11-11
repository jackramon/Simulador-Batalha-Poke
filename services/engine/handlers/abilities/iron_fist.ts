
import { Pokemon, Move } from '../../../../types';
import { PUNCH_MOVES } from '../../../../data/moves';

/**
 * Lógica para a habilidade Punhos de Ferro (Iron Fist).
 * Regra Oficial: Aumenta o poder de movimentos baseados em soco em 20% (1.2x).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'iron-fist' && PUNCH_MOVES.includes(move.name)) {
        return 1.2;
    }
    return 1.0;
}

export function isPunchMove(move: Move): boolean {
    return PUNCH_MOVES.includes(move.name);
}
