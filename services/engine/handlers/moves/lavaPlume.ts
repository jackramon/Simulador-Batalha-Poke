
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário do movimento Penacho de Lava (Lava Plume).
 * Regra Oficial: Tem 30% de chance de causar Queimadura (Burn) no alvo.
 * (A chance de 30% é verificada no roteador antes de chamar esta função)
 */
export function handleLavaPlumeEffect(
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
