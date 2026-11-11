
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Retirada (Withdraw).
 * Regra Oficial: Aumenta a Defesa do usuário em 1 estágio.
 */
export function handleWithdraw(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Defesa em 1 estágio
    // isOpponentSource = false (False, é self-buff)
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-up',
        logs,
        false, 
        false, // ignoresAbilities
        'withdraw',
        state
    );
}
