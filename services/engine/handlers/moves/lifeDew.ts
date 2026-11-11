
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as PsychicNoise from './psychicNoise';

/**
 * Lógica para o movimento Gota de Vida (Life Dew).
 * Regra Oficial: Restaura 25% do HP máximo do usuário e de seus aliados.
 * Em 1v1, afeta apenas o usuário.
 */
export function handleLifeDew(attacker: Pokemon, logs: LogEntry[], state?: BattleState) {
    if (attacker.isFainted) return;

    // Verifica bloqueio por Ruído Psíquico / Heal Block
    if (PsychicNoise.isHealBlocked(attacker)) {
        log(logs, `O Bloqueio de Cura impede que ${attacker.name} se cure!`, 'text-gray-500 italic');
        return;
    }

    if (attacker.hp === attacker.maxHP) {
        log(logs, `O HP de ${attacker.name} já está cheio!`, 'text-gray-500 italic');
        return;
    }

    // Cura 25% do HP Máximo
    const healAmount = Math.floor(attacker.maxHP * 0.25) || 1;
    const actualHeal = Math.min(attacker.maxHP - attacker.hp, healAmount);
    
    attacker.hp += actualHeal;
    log(logs, `${attacker.name} restaurou um pouco de vida com a Gota de Vida!`, 'text-green-600 font-bold');
}
