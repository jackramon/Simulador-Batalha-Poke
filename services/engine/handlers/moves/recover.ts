
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as PsychicNoise from './psychicNoise';

/**
 * Lógica para o movimento Recuperação (Recover).
 * Regra Oficial: Restaura até 50% do HP Máximo do usuário.
 * Falha se o HP já estiver cheio ou se o usuário estiver sob efeito de Heal Block (Psychic Noise).
 */
export function handleRecover(attacker: Pokemon, logs: LogEntry[]) {
    if (attacker.isFainted) return;

    // Heal Block Check
    if (PsychicNoise.isHealBlocked(attacker)) {
        log(logs, `O Bloqueio de Cura impede que ${attacker.name} se cure!`, 'text-gray-500 italic');
        return;
    }

    // HP Cheio Check
    if (attacker.hp === attacker.maxHP) {
        log(logs, `O HP de ${attacker.name} já está cheio!`, 'text-gray-500 italic');
        return;
    }

    const healAmount = Math.floor(attacker.maxHP / 2) || 1;
    const actualHeal = Math.min(attacker.maxHP - attacker.hp, healAmount);
    
    attacker.hp += actualHeal;

    log(logs, `${attacker.name} recuperou vida!`, 'text-green-600 font-bold');
}
