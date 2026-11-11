
import { Pokemon, Move } from '../../../../types';

// Movimentos que não são afetados pelo Normalize (Regra Oficial)
const IGNORED_MOVES = [
    'hidden-power', 'weather-ball', 'natural-gift', 'struggle', 
    'techno-blast', 'multi-attack', 'judgment', 'terrain-pulse'
];

/**
 * Lógica para a habilidade Normalizar (Normalize).
 * Regra Oficial (Gen 7+): 
 * 1. Todos os movimentos do usuário se tornam do tipo Normal.
 * 2. O poder desses movimentos aumenta em 20% (1.2x).
 */

export function getEffectiveMoveType(attacker: Pokemon, move: Move): string {
    if (attacker.ability === 'normalize' && !IGNORED_MOVES.includes(move.name)) {
        // Nota: Normalize afeta até movimentos de Status (ex: Thunder Wave vira Normal e pode ser bloqueado por Fantasmas)
        return 'normal';
    }
    return move.type;
}

export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    // O bônus de 1.2x aplica-se a qualquer movimento afetado que cause dano
    if (attacker.ability === 'normalize' && 
        move.damageClass !== 'status' && 
        !IGNORED_MOVES.includes(move.name)) {
        return 1.2;
    }
    return 1.0;
}
