
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Proteção de Algodão (Cotton Guard).
 * Regra Oficial: Aumenta a Defesa do usuário em 3 estágios (Drasticamente).
 */
export function handleCottonGuard(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Defesa em 3 estágios
    // A magnitude (3) é tratada internamente em statChanges.ts ao detectar o nome 'cotton-guard' na lista 'plusThreeMoves'
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'cotton-guard',
        state
    );
}
