
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Magnet Bomb (Bomba Magnética).
 * Movimento de precisão infinita que nunca erra.
 * Classificado como movimento de "bomba", sendo bloqueado por Bulletproof.
 */
export function handleMagnetBomb(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Magnet Bomb é um movimento físico de 60BP.
    // A lógica de "Always Hit" é tratada pelo motor central através da categoria ALWAYS_HIT_MOVES.
    // Este handler serve para manter a modularidade e permitir extensões específicas.
    return move.power;
}
