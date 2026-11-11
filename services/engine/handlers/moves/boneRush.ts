
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Ataque de Osso (Bone Rush).
 * Movimento físico do tipo Terra que atinge de 2 a 5 vezes.
 * Classificado como não-contato físico em data/moves/categories.ts.
 */
export function handleBoneRush(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Bone Rush é um movimento de múltiplos acertos padrão.
    // A lógica de hits (2-5) e a interação com Skill Link são tratadas pelo motor central (engine/moves.ts).
    // Este handler serve para manter a modularidade da arquitetura.
    return move.power;
}
