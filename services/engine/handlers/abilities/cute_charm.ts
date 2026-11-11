
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as StatusEffect from '../../../effectHandlers';

/**
 * Lógica para a habilidade Charme Gracioso (Cute Charm).
 * 30% de chance de causar apaixonamento (infatuation) se o atacante for do gênero oposto
 * e usar um movimento de contato.
 */
export function handleCuteCharm(attacker: Pokemon, defender: Pokemon, logs: {message: string, color: string}[]) {
    // Só funciona se os gêneros forem opostos e conhecidos
    if (!attacker.gender || !defender.gender || attacker.gender === defender.gender) {
        return;
    }

    if (Math.random() < 0.3) {
        if (!attacker.statusEffects.infatuation) {
            StatusEffect.applyStatus(attacker, 'infatuation', logs as any, defender);
            log(logs, `O Charme Gracioso de ${defender.name} encantou ${attacker.name}!`, 'text-pink-600 font-bold');
        }
    }
}
