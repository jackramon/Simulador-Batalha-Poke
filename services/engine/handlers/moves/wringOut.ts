
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Espremer (Wring Out) e Esmagamento (Crush Grip).
 * Regra Oficial: O poder base é calculado com base no HP restante do alvo.
 * Fórmula: 120 * (HP Atual / HP Máximo).
 * Poder Máximo: 120.
 * Poder Mínimo: 1 (na prática, o cálculo arredondado para baixo pode dar < 1, então limitamos a 1).
 */
export function getWringOutPower(defender: Pokemon): number {
    const hpRatio = defender.hp / defender.maxHP;
    const power = Math.floor(120 * hpRatio);
    
    // Garante que o poder seja pelo menos 1
    return Math.max(1, power);
}
