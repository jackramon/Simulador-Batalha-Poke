
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Prensa Dura (Hard Press).
 * Regra Oficial: O poder base é calculado com base no HP restante do alvo.
 * Fórmula: 100 * (HP Atual / HP Máximo).
 * Poder Máximo: 100.
 * Poder Mínimo: 1.
 */
export function getHardPressPower(defender: Pokemon): number {
    const hpRatio = defender.hp / defender.maxHP;
    const power = Math.floor(100 * hpRatio);
    
    // Garante que o poder seja pelo menos 1
    return Math.max(1, power);
}
