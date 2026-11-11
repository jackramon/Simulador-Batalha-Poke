
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Ataque Rápido (Quick Attack).
 * Movimento físico do tipo Normal com 40BP.
 * Possui Prioridade +1 (tratada em data/moves/categories.ts).
 */
export function handleQuickAttack(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Quick Attack é um movimento de dano padrão com prioridade.
    // A prioridade é gerenciada pelo sistema de ações.
    // O dano é calculado normalmente.
    return move.power;
}
