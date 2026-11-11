
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Ossomerangue (Bonemerang).
 * Movimento físico do tipo Terra que atinge exatamente 2 vezes.
 * Classificado como não-contato físico em data/moves/categories.ts.
 */
export function handleBonemerang(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Bonemerang é um movimento de múltiplos acertos fixo em 2.
    // A lógica de hits (2) é tratada pelo motor central (engine/moves.ts) usando minHits/maxHits.
    return move.power;
}
