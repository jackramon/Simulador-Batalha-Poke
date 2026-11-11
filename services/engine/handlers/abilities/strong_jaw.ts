
import { Pokemon, Move } from '../../../../types';
import { BITING_MOVES } from '../../../../data/moves';

/**
 * Lógica para a habilidade Mandíbula Forte (Strong Jaw).
 * Regra Oficial: Aumenta o poder base de movimentos de mordida em 50% (1.5x).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'strong-jaw' && BITING_MOVES.includes(move.name)) {
        return 1.5;
    }
    return 1.0;
}
