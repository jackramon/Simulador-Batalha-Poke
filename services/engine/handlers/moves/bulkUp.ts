
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Musculação (Bulk Up).
 * Regra Oficial: Aumenta o Ataque e a Defesa do usuário em 1 estágio cada.
 */
export function handleBulkUp(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Ataque em 1 estágio
    StatChanges.applyMoveStatChange(
        attacker,
        'attack-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'bulk-up',
        state
    );

    // Aumenta Defesa em 1 estágio
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-up',
        logs,
        false, // isOpponentSource
        false, // ignoresAbilities
        'bulk-up',
        state
    );
}
