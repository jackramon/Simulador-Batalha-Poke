
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário do movimento Canhão Zap (Zap Cannon).
 * Regra Oficial: Se o golpe atingir o alvo, causa paralisia garantida (100% de chance).
 */
export function handleZapCannonEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica paralisia. O helper central já lida com imunidades (tipo Elétrico/Terra) e habilidades.
    StatusConditions.applyStatus(
        defender, 
        'paralysis', 
        logs as any, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}
