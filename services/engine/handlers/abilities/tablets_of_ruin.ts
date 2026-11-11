import { Move } from '../../../../types';

/**
 * Lógica para a habilidade Tabuletas da Ruína (Tablets of Ruin).
 * Regra Oficial: Reduz o Ataque de todos os outros Pokémon em campo em 25%.
 * No cálculo de dano, isso equivale a um multiplicador de 0.75x no dano final físico do oponente.
 * Nota: Pokémon com a habilidade Tabuletas da Ruína são imunes a este efeito.
 */
export function getDamageMultiplier(defenderAbility: string | undefined, attackerAbility: string | undefined, move: Move): number {
    if (defenderAbility !== 'tablets-of-ruin' || move.damageClass !== 'physical') {
        return 1.0;
    }

    // Regra Oficial: Imunidade se o atacante possuir a mesma habilidade de Ruína
    if (attackerAbility === 'tablets-of-ruin') {
        return 1.0;
    }

    return 0.75;
}
