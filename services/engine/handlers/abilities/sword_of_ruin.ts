import { Move } from '../../../../types';

/**
 * Lógica para a habilidade Espada da Ruína (Sword of Ruin).
 * Regra Oficial: Reduz a Defesa de todos os outros Pokémon em campo em 25%.
 * No cálculo de dano, isso equivale a um multiplicador de ~1.33x no dano final físico.
 * Nota: Pokémon com a habilidade Espada da Ruína são imunes a este efeito.
 */
export function getDamageMultiplier(attackerAbility: string | undefined, defenderAbility: string | undefined, move: Move): number {
    if (attackerAbility !== 'sword-of-ruin' || move.damageClass === 'status') {
        return 1.0;
    }
    
    // Regra Oficial: Imunidade se o alvo possuir a mesma habilidade de Ruína
    if (defenderAbility === 'sword-of-ruin') {
        return 1.0;
    }

    if (move.damageClass === 'physical') {
        return 1.333334;
    }
    return 1.0;
}
