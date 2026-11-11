
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Amnésia (Amnesia).
 * Regra Oficial: Aumenta a Defesa Especial do usuário em 2 estágios (Drasticamente).
 */
export function handleAmnesia(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Defesa Especial em 2 estágios
    // A magnitude (2) é tratada internamente em statChanges.ts ao detectar o nome 'amnesia' na lista 'magnitudeTwoMoves'
    StatChanges.applyMoveStatChange(
        attacker,
        'spDefense-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'amnesia',
        state
    );
}
