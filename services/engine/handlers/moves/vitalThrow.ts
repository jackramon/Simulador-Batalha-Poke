
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Arremesso Vital (Vital Throw).
 * Movimento físico do tipo Lutador.
 * Prioridade: -1 (Ataca por último).
 * Precisão: Infinita (Nunca erra).
 */
export function handleVitalThrow(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Por ser um movimento de dano com precisão e prioridade tratadas nas configurações gerais,
    // o handler serve apenas para manter a modularidade.
    // O motor central (accuracy.ts) verifica 'vital-throw' em ALWAYS_HIT_MOVES.
    // O motor de ações (actions.ts) verifica 'vital-throw' em MOVE_PRIORITIES (-1).
    return move.power;
}
