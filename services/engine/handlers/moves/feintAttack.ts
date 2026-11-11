
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Ataque Furtivo (Feint Attack).
 * Movimento físico do tipo Noturno de 60BP.
 * Nunca erra (Accuracy Infinity) - Tratado em mechanics/accuracy.ts via ALWAYS_HIT_MOVES.
 */
export function handleFeintAttack(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Por ser um movimento de dano sem efeitos secundários que afetem o cálculo de poder base
    // (além do "nunca erra" que é tratado na precisão), o handler serve apenas para manter a modularidade.
    return move.power;
}
