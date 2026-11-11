
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Soco Dinâmico (Dynamic Punch).
 * Regra Oficial: Causa dano e tem 100% de chance de causar Confusão no alvo.
 * A precisão é baixa (50%), mas o efeito é garantido se acertar.
 */
export function handleDynamicPunchEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Confusão
    // StatusConditions.applyStatus lida com imunidades (Own Tempo, Misty Terrain, etc.)
    StatusConditions.applyStatus(
        defender,
        'confusion',
        logs,
        attacker,
        false, // isFromSynchronize
        state
    );
}
