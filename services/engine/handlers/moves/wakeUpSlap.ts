
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Comatose from '../abilities/comatose';

/**
 * Lógica para o movimento Tapa de Despertar (Wake-Up Slap).
 * Regra Oficial: 
 * 1. Se o alvo estiver dormindo, o poder base dobra (70 -> 140).
 * 2. Se o alvo estiver dormindo, ele acorda após receber o dano.
 */

export function getWakeUpSlapPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // Verifica se o alvo está dormindo ou tem a habilidade Comatoso (que conta como dormindo para dano)
    const isAsleep = !!defender.statusEffects.sleep || Comatose.isTreatedAsAsleep(defender);
    
    return {
        power: isAsleep ? basePower * 2 : basePower,
        isBoosted: isAsleep
    };
}

export function handleWakeUpEffect(defender: Pokemon, logs: {message: string, color: string}[]) {
    // Apenas acorda se tiver o status real de sono (Comatoso não pode ser removido)
    if (defender.statusEffects.sleep) {
        delete defender.statusEffects.sleep;
        log(logs, BATTLE_MESSAGES.WAKE_UP_SLAP_CURE(defender.name), 'text-blue-600 font-bold italic');
    }
}
