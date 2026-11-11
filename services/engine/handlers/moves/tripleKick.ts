
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Chute Triplo (Triple Kick).
 * Regra Oficial: 
 * - Acerta até 3 vezes.
 * - O poder base aumenta a cada acerto bem-sucedido.
 * - Hit 1: 10 BP
 * - Hit 2: 20 BP
 * - Hit 3: 30 BP
 * 
 * Fórmula: Base Power * (Hit Index + 1)
 */
export function getTripleKickPower(basePower: number, hitIndex: number): number {
    // Base Power padrão é 10 (definido em VARIABLE_POWER_MOVES ou API)
    return basePower * (hitIndex + 1);
}
