
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Doce Aroma (Sweet Scent).
 * Regra Oficial (Gen 6+): Reduz a Evasiva do alvo em 2 estágios.
 */
export function handleSweetScent(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica redução de Evasiva (-2)
    // A magnitude é controlada em statChanges.ts verificando o nome do movimento 'sweet-scent'
    StatChanges.applyMoveStatChange(
        defender,
        'evasion-down',
        logs,
        true, // isOpponentSource
        false, // ignoresAbilities (movimento de status padrão)
        'sweet-scent',
        state
    );
}
