import { Move } from '../../../../types';

/**
 * Lógica para a habilidade Vaso da Ruína (Vessel of Ruin).
 * Regra Oficial: Reduz o Ataque Especial de todos os outros Pokémon em campo em 25%.
 * No cálculo de dano, isso equivale a um multiplicador de 0.75x no dano final especial do oponente.
 * Nota: Pokémon com a habilidade Vaso da Ruína são imunes a este efeito.
 */
export function getDamageMultiplier(defenderAbility: string | undefined, attackerAbility: string | undefined, move: Move): number {
    if (defenderAbility !== 'vessel-of-ruin' || move.damageClass !== 'special') {
        return 1.0;
    }

    // Regra Oficial: Imunidade se o atacante possuir a mesma habilidade de Ruína
    if (attackerAbility === 'vessel-of-ruin') {
        return 1.0;
    }

    return 0.75;
}
