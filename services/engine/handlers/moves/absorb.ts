
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Absorver (Absorb).
 * Movimento especial do tipo Grama com 20 de poder base.
 * Recupera 50% do dano causado.
 * A mecânica de drenagem é tratada pelo motor central via DRAIN_MOVES.
 */
export function handleAbsorb(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
