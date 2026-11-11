
import { Move } from '../../../../types';

/**
 * Lógica para o movimento Explosão Aérea (Aeroblast).
 * Movimento Special do tipo Voador com 100BP.
 * Efeito: Alta chance de acerto crítico (+1 estágio).
 * A lógica de crítico é tratada centralmente em 'handlers/abilities/critical.ts' 
 * verificando a lista HIGH_CRIT_MOVES.
 */

export function isAeroblast(move: Move): boolean {
    return move.name === 'aeroblast';
}

export const AEROBLAST_CRIT_STAGE = 1;
