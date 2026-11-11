
import { Pokemon, Move, BattleState } from '../../../../types';
import * as Dazzling from './dazzling';

/**
 * Lógica para a habilidade Majestade Real (Queenly Majesty).
 * Mecanicamente idêntica à habilidade Ofuscante (Dazzling).
 * Impede movimentos de prioridade do oponente.
 */
export function blocksPriorityMove(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    state: BattleState
): boolean {
    return Dazzling.blocksPriorityMove(attacker, defender, move, state);
}
