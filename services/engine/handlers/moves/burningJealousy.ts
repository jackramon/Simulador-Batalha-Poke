
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Inveja Ardente (Burning Jealousy).
 * Regra Oficial: Causa dano e queima (Burn) o alvo se ele teve seus atributos aumentados neste turno.
 */
export function handleBurningJealousy(
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
            'burn', 
            logs as any, 
            attacker, 
            false, 
            state
        );
    }
}
