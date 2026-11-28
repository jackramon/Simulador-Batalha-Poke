import { StatStages } from '../../../../types';

/** Identificador oficial da habilidade (mesmo valor usado em data/abilities_data). */
export const ABILITY_ID = 'vessel-of-ruin';

/** Atributo reduzido pela habilidade. */
export const AFFECTED_STAT: keyof StatStages = 'spAttack';

/**
 * Vaso da Ruína (Vessel of Ruin).
 * Regra Oficial: reduz o Ataque Especial de todos os outros Pokémon em campo em 25% (0.75x).
 *
 * - O portador nunca é reduzido: a habilidade não afeta quem a possui.
 * - Duas cópias da mesma habilidade se anulam, porque cada portador é imune à cópia do outro;
 *   assim o multiplicador é aplicado no máximo uma vez por atributo.
 * - Aplicada no cálculo do atributo (`statCalculator`), de onde o dano deriva. Não existe
 *   segundo multiplicador de dano, o que evita acúmulo com o cálculo principal.
 */
export function getStatMultiplier(
    statType: keyof StatStages,
    targetAbility: string | undefined,
    opponentAbility: string | undefined
): number {
    if (opponentAbility !== ABILITY_ID || statType !== AFFECTED_STAT) {
        return 1.0;
    }

    // Regra Oficial: imunidade recíproca entre portadores da mesma habilidade.
    if (targetAbility === ABILITY_ID) {
        return 1.0;
    }

    return 0.75;
}
