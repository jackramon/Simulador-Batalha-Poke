
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Cortador de Ar (Air Cutter).
 * Movimento especial do tipo Voador com 60 de poder base.
 * É um movimento de Vento (Wind) e de Corte (Slicing).
 * Possui alta chance de acerto crítico (+1 estágio).
 * 
 * A lógica de crítico é tratada em 'handlers/abilities/critical.ts' via HIGH_CRIT_MOVES.
 * A lógica de Sharpness é tratada em 'handlers/abilities/damageModifiers.ts' via SLICING_MOVES.
 * A lógica de Wind Rider/Wind Power é tratada via WIND_MOVES.
 */
export function handleAirCutter(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Retorna o poder base padrão. O restante das mecânicas são gerenciadas pelas categorias.
    return move.power;
}
