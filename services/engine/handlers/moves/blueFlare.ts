
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Chama Azul (Blue Flare).
 * Regra Oficial: Causa dano e tem 20% de chance de queimar (Burn) o alvo.
 */
export function handleBlueFlareEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Queimadura
    StatusConditions.applyStatus(
        defender,
        'burn',
        logs as any,
        attacker,
        false, // isFromSynchronize
        state
    );
}
