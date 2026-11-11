
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Erupção (Eruption).
 * Regra Oficial: O poder base varia de 1 a 150, dependendo do HP atual do usuário.
 * Fórmula: 150 * (HP Atual / HP Máximo).
 */
export function getEruptionPower(attacker: Pokemon): number {
    const hpRatio = attacker.hp / attacker.maxHP;
    let power = Math.floor(150 * hpRatio);
    
    // O poder mínimo é 1
    return Math.max(1, power);
}
