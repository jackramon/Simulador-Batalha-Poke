
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

export function handleDizzyPunchEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Confusão
    // O helper central já lida com imunidades (Own Tempo) e proteções
    StatusConditions.applyStatus(
        defender,
        'confusion',
        logs as any,
        attacker,
        false, // isFromSynchronize
        state
    );
}
