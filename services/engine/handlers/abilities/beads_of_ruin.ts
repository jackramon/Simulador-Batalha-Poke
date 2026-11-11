
import { Move } from '../../../../types';

/**
 * Lógica para a habilidade Contas da Ruína (Beads of Ruin).
 * Regra Oficial: Reduz a Defesa Especial de todos os outros Pokémon em campo em 25%.
 * No cálculo de dano (1v1), isso equivale a um multiplicador de ~1.33x (4/3) no dano final especial do portador.
 * Nota: Pokémon com a habilidade Contas da Ruína são imunes a este efeito.
 */
export function getDamageMultiplier(attackerAbility: string | undefined, defenderAbility: string | undefined, move: Move): number {
    // A habilidade só afeta movimentos da categoria Especial
    if (attackerAbility !== 'beads-of-ruin' || move.damageClass !== 'special') {
        return 1.0;
    }

    // Regra Oficial: Imunidade se o alvo possuir a mesma habilidade de Ruína
    if (defenderAbility === 'beads-of-ruin') {
        return 1.0;
    }

    // Reduzir Defesa Especial em 25% (0.75x) resulta em um aumento de dano de 1 / 0.75 = 1.3333...
    return 1.3333;
}
