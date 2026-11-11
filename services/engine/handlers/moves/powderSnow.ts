
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário do movimento Neve em Pó (Powder Snow).
 * Regra Oficial: 10% de chance de congelar o alvo.
 */
export function handlePowderSnowEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica congelamento. O helper central já lida com imunidades e habilidades.
    StatusConditions.applyStatus(
        defender, 
        'freeze', 
        logs as any, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}
