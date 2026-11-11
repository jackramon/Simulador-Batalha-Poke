import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Punishment (Punição).
 * O poder base aumenta em 20 para cada estágio de atributo aumentado do alvo.
 * Poder máximo: 200.
 */
export function getPunishmentPower(
    defender: Pokemon,
    basePower: number,
    logs: LogEntry[]
): number {
    let statBoosts = 0;
    const stats = ['attack', 'defense', 'spAttack', 'spDefense', 'speed', 'accuracy', 'evasion'];

    stats.forEach(stat => {
        if (defender.statStages[stat as keyof typeof defender.statStages] > 0) {
            statBoosts += defender.statStages[stat as keyof typeof defender.statStages];
        }
    });

    const bonusPower = statBoosts * 20;
    const finalPower = Math.min(200, basePower + bonusPower);

    if (bonusPower > 0) {
        log(logs, `O poder aumentou devido aos boosts do oponente! (${finalPower} BP)`, 'text-purple-700 font-bold');
    }

    return finalPower;
}
