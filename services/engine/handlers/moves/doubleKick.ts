
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Chute Duplo (Double Kick).
 * Movimento físico do tipo Lutador que atinge exatamente 2 vezes.
 * Poder Base: 30 (por acerto).
 * A quantidade de acertos é gerenciada por MULTI_HIT_MOVES em data/moves/categories.ts.
 */
export function getDoubleKickPower(attacker: Pokemon, basePower: number): number {
    return basePower;
}
