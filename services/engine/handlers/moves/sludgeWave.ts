
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o efeito secundário da Onda de Lama (Sludge Wave).
 * Regra Oficial: Tem 10% de chance de envenenar (Poison) o alvo.
 */
export function handleSludgeWaveEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Envenenamento
    // StatusConditions.applyStatus lida com imunidades (Steel/Poison types, Immunity ability, Misty Terrain, etc.)
    StatusConditions.applyStatus(
        defender,
        'poison',
        logs,
        attacker,
        false, // isFromSynchronize
        state
    );
}
