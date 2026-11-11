
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário do movimento Descarga (Discharge).
 * Regra Oficial: 30% de chance de paralisar o alvo.
 */
export function handleDischargeEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica paralisia. O helper central já lida com imunidades e habilidades (ex: Limber).
    StatusConditions.applyStatus(
        defender, 
        'paralysis', 
        logs as any, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}
