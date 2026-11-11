
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Faca de Dois Gumes (Double-Edge).
 * Movimento físico do tipo Normal com 120 de poder base.
 * Causa dano de recuo igual a 33% (1/3) do dano causado.
 * O recuo é tratado genericamente pelo motor (recoilType: 'damage', recoilValue: 0.33).
 */
export function handleDoubleEdge(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
