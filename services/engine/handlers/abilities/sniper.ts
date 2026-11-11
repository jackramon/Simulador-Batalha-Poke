
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Franco-Atirador (Sniper).
 * Regra Oficial: Aumenta o multiplicador de dano de acertos críticos de 1.5x para 2.25x.
 * O efeito é anulado se a habilidade estiver suprimida (ex: Gás Neutralizante).
 */
export function getCritMultiplier(attacker: Pokemon, isGasActive: boolean = false): number {
    if (attacker.ability === 'sniper' && !isGasActive) {
        return 2.25;
    }
    return 1.5;
}
