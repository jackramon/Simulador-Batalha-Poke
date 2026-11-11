
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Voz Sedutora (Alluring Voice).
 * Regra Oficial: Causa dano e confunde o alvo SE o alvo teve seus atributos aumentados
 * durante este turno (100% de chance).
 */
export function handleAlluringVoice(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o defensor teve atributos aumentados neste turno.
    // O marcador 'stat-raised' é adicionado em statChanges.ts
    if (defender.statusEffects['stat-raised']) {
        StatusConditions.applyStatus(
            defender,
            'confusion',
            logs as any,
            attacker,
            false, // isFromSynchronize
            state
        );
    }
}
