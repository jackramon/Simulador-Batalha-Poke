
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Barreira (Barrier).
 * Regra Oficial: Aumenta a Defesa do usuário em 2 estágios (Drasticamente).
 */
export function handleBarrier(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Defesa em 2 estágios
    // A magnitude (2) é tratada internamente em statChanges.ts ao detectar o nome 'barrier' na lista 'magnitudeTwoMoves'
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'barrier',
        state
    );
}
