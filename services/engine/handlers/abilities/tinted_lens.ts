
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Lentes Coloridas (Tinted Lens).
 * Regra Oficial: Dobra o poder de movimentos que "não são muito efetivos" (eficácia < 1.0).
 */
export function getDamageMultiplier(attacker: Pokemon, typeEffectiveness: number, isGasActive: boolean = false): number {
    if (isGasActive || attacker.ability !== 'tinted-lens' || attacker.isFainted) {
        return 1.0;
    }

    // Se a eficácia for menor que 1 (0.5x, 0.25x), o dano é dobrado.
    if (typeEffectiveness < 1.0 && typeEffectiveness > 0) {
        return 2.0;
    }

    return 1.0;
}
