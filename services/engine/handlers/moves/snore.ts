
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Comatose from '../abilities/comatose';

/**
 * Verifica se o Ronco (Snore) vai falhar.
 * Regra Oficial: Ronco só funciona se o usuário estiver dormindo (Sleep status) ou tiver a habilidade Comatoso.
 */
export function checkSnoreFailure(attacker: Pokemon, logs: {message: string, color: string}[]): boolean {
    const isAsleep = !!attacker.statusEffects.sleep || Comatose.isTreatedAsAsleep(attacker);
    
    if (!isAsleep) {
        log(logs, BATTLE_MESSAGES.SNORE_FAIL(attacker.name), 'text-gray-500 italic');
        return true;
    }
    return false;
}
