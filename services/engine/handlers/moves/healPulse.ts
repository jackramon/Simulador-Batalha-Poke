
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as PsychicNoise from './psychicNoise';
import * as MegaLauncher from '../abilities/mega_launcher';

/**
 * Lógica para o movimento Pulso de Cura (Heal Pulse).
 * Regra Oficial: Restaura 50% do HP máximo do ALVO (diferente de Recover que é usuário).
 * Se o usuário tiver Mega Launcher, cura 75%.
 */
export function handleHealPulse(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // Verifica bloqueio por Ruído Psíquico / Heal Block no ALVO
    if (PsychicNoise.isHealBlocked(defender)) {
        log(logs, `O Bloqueio de Cura impede que ${defender.name} se cure!`, 'text-gray-500 italic');
        return;
    }

    if (defender.hp === defender.maxHP) {
        log(logs, `O HP de ${defender.name} já está cheio!`, 'text-gray-500 italic');
        return;
    }

    // Cura base de 50%
    let healRatio = 0.5;

    // Mega Launcher aumenta para 75%
    if (attacker.ability === 'mega-launcher') {
        healRatio = 0.75;
    }

    const healAmount = Math.floor(defender.maxHP * healRatio) || 1;
    const actualHeal = Math.min(defender.maxHP - defender.hp, healAmount);
    
    defender.hp += actualHeal;

    log(logs, `${defender.name} recuperou vida!`, 'text-green-600 font-bold');
}
