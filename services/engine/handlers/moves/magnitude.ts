import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Magnitude.
 * O poder base varia aleatoriamente entre 10 e 150.
 * Distribuição de probabilidade:
 * - 10: 5%
 * - 30: 10%
 * - 50: 20%
 * - 70: 30%
 * - 90: 20%
 * - 110: 10%
 * - 150: 5%
 */
export function getMagnitudePower(
    attacker: Pokemon,
    logs: LogEntry[]
): number {
    const rand = Math.random() * 100;
    let power = 0;
    let magnitudeLevel = 0;

    if (rand < 5) { power = 10; magnitudeLevel = 4; }
    else if (rand < 15) { power = 30; magnitudeLevel = 5; }
    else if (rand < 35) { power = 50; magnitudeLevel = 6; }
    else if (rand < 65) { power = 70; magnitudeLevel = 7; }
    else if (rand < 85) { power = 90; magnitudeLevel = 8; }
    else if (rand < 95) { power = 110; magnitudeLevel = 9; }
    else { power = 150; magnitudeLevel = 10; }

    log(logs, `Magnitude ${magnitudeLevel}!`, 'text-yellow-600 font-bold');
    
    return power;
}
