
import { Pokemon } from '../../../../types';

/**
 * Calcula o poder para movimentos baseados no HP restante do usuário (Reversal, Flail).
 * Fórmula Oficial (Gen 5+):
 * 0% - 4.17%: 200 Poder
 * 4.17% - 10.42%: 150 Poder
 * 10.42% - 20.83%: 100 Poder
 * 20.83% - 35.42%: 80 Poder
 * 35.42% - 68.75%: 40 Poder
 * 68.75% - 100%: 20 Poder
 */
export function getHpBasedPower(attacker: Pokemon): { power: number, intensity: string } {
    const hpPercent = (attacker.hp / attacker.maxHP) * 100;
    
    let power = 20;
    let intensity = 'mínimo';

    // Usamos aproximações seguras para as frações de 48 avos
    if (hpPercent < 4.17) {
        power = 200;
        intensity = 'devastador';
    } else if (hpPercent <= 10.42) {
        power = 150;
        intensity = 'extremo';
    } else if (hpPercent <= 20.83) {
        power = 100;
        intensity = 'máximo';
    } else if (hpPercent <= 35.42) {
        power = 80;
        intensity = 'alto';
    } else if (hpPercent <= 68.75) {
        power = 40;
        intensity = 'moderado';
    } else {
        power = 20;
        intensity = 'mínimo';
    }

    return { power, intensity };
}
