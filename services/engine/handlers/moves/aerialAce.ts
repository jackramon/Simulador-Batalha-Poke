
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Ás Aéreo (Aerial Ace).
 * Movimento físico do tipo Voador com 60 de poder base.
 * Faz contato. É um movimento de corte (Slicing).
 * Nunca erra (Accuracy Infinity) - Tratado em mechanics/accuracy.ts via ALWAYS_HIT_MOVES.
 */
export function handleAerialAce(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Aerial Ace é um movimento de dano padrão.
    // A propriedade de nunca errar é tratada pelo motor central (mechanics/accuracy.ts).
    // O bônus de Agudeza (Sharpness) é tratado em damageModifiers.ts via SLICING_MOVES.
    // O contato é padrão para movimentos físicos que não estão na lista de exceção.
    return move.power;
}
