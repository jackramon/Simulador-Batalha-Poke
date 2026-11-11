
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Caco de Gelo (Ice Shard).
 * Movimento físico do tipo Gelo com prioridade +1.
 * A prioridade é tratada em data/moves/categories.ts e engine/actions.ts.
 */
export function handleIceShard(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}
