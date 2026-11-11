
import { Pokemon } from '../../../../types';

/**
 * Lista de habilidades que possuem o efeito de Quebra Molde (Mold Breaker).
 * Inclui variantes como Teravolt (Zekrom) e Turboblaze (Reshiram).
 */
export const MOLD_BREAKER_ABILITIES = ['mold-breaker', 'teravolt', 'turboblaze'];

/**
 * Verifica se o atacante possui uma habilidade ativa que ignora as habilidades do defensor.
 */
export function suppressesAbilities(attackerAbility: string | undefined): boolean {
    if (!attackerAbility) return false;
    return MOLD_BREAKER_ABILITIES.includes(attackerAbility);
}
