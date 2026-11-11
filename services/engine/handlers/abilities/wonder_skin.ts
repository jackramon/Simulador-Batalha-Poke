import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Pele Milagrosa (Wonder Skin).
 * Regra Oficial: Altera a precisão de movimentos de status usados contra este Pokémon para 50%.
 */
export function modifyAccuracy(
    accuracy: number | '∞',
    move: Move,
    defender: Pokemon,
    ignoresAbilities: boolean
): number | '∞' {
    // Se a precisão já for infinita (não erra), Wonder Skin não a reduz nos jogos (ex: Swift)
    // No entanto, quase nenhum move de STATUS tem precisão infinita contra o alvo.
    if (accuracy === '∞' || ignoresAbilities || defender.isFainted) {
        return accuracy;
    }

    if (defender.ability === 'wonder-skin' && move.damageClass === 'status') {
        // Se a precisão atual for maior que 50%, ela é reduzida para 50%
        if (typeof accuracy === 'number' && accuracy > 50) {
            return 50;
        }
    }

    return accuracy;
}
