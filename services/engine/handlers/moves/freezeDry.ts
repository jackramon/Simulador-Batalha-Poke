
/**
 * Lógica para o movimento Liofilização (Freeze-Dry).
 * Regra Oficial: O movimento é do tipo Gelo, mas causa dano Super Efetivo (2x) em Pokémon do tipo Água,
 * invertendo a resistência natural que Água tem contra Gelo.
 */
export function getModifiedEffectiveness(moveName: string, defenderType: string, currentMultiplier: number): number {
    if (moveName === 'freeze-dry' && defenderType.toLowerCase() === 'water') {
        return 2.0;
    }
    return currentMultiplier;
}
