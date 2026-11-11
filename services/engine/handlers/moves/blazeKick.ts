
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário do movimento Chute Flamejante (Blaze Kick).
 * Regra Oficial: 10% de chance de causar Queimadura (Burn) no alvo.
 * (A chance de 10% é verificada no roteador antes de chamar esta função)
 * O crítico alto é tratado pelo pipeline de dano.
 */
export function handleBlazeKickEffect(
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
