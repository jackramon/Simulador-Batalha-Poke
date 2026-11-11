
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Lambida (Lick).
 * Regra Oficial: Causa dano e tem 30% de chance de paralisar o alvo.
 */
export function handleLickEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Paralisia
    // O helper central já lida com imunidades (tipo Elétrico, Limber, etc)
    StatusConditions.applyStatus(
        defender,
        'paralysis',
        logs as any,
        attacker,
        false, // isFromSynchronize
        state
    );
}
