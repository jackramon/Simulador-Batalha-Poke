
import { Pokemon, Move } from '../../../../types';
import { PULSE_MOVES } from '../../../../data/moves';

/**
 * Lógica para a habilidade Mega Lançador (Mega Launcher).
 * Regra Oficial: Aumenta o poder base de movimentos de aura e pulso em 50% (1.5x).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'mega-launcher' && PULSE_MOVES.includes(move.name)) {
        return 1.5;
    }
    return 1.0;
}

/**
 * Verifica se um movimento é considerado de aura ou pulso.
 */
export function isPulseMove(move: Move): boolean {
    return PULSE_MOVES.includes(move.name);
}
