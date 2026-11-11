import { Pokemon } from '../../../../types';
import * as Comatose from '../abilities/comatose';

/**
 * Lógica para o movimento Feitiço (Hex).
 * Regra Oficial: O poder base dobra (65 -> 130) se o alvo estiver 
 * sob efeito de qualquer condição de status principal ou Comatoso.
 */
export function getHexPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // Verifica status (burn, paralysis, poison, toxic, sleep, freeze)
    const hasStatus = Object.keys(defender.statusEffects).length > 0 || Comatose.isTreatedAsAsleep(defender);
    
    return {
        power: hasStatus ? basePower * 2 : basePower,
        isBoosted: hasStatus
    };
}