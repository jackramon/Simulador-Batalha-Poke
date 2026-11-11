
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Branch Poke (Cutucada de Galho).
 * Movimento físico padrão de 40BP sem efeitos secundários.
 */
export function handleBranchPoke(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Por ser um movimento de dano padrão, o motor de batalha (damageUtils) já lida com o cálculo.
    // Este arquivo serve como placeholder para consistência da arquitetura modular.
    return move.power;
}
