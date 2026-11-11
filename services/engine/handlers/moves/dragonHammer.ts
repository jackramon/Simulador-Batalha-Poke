
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Martelo do Dragão (Dragon Hammer).
 * Movimento físico do tipo Dragão com 90 de poder base.
 * Faz contato. Sem efeitos secundários.
 */
export function handleDragonHammer(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Por ser um movimento de dano padrão, o motor de batalha (damageUtils) já lida com o cálculo.
    // Este handler serve para manter a modularidade.
    return move.power;
}
