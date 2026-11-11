
import { Pokemon } from '../../../../types';

/**
 * Calcula o dano de um movimento OHKO (One-Hit Knockout).
 * Regra: Causa dano igual ao HP Máximo do alvo.
 */
export function calculateOHKODamage(defender: Pokemon): number {
    return defender.maxHP;
}
