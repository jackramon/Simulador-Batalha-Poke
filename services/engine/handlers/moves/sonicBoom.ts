
/**
 * Lógica para o movimento Estrondo Sônico (Sonic Boom).
 * Regra Oficial: Causa sempre 20 pontos de dano fixo.
 * Não afeta Pokémon do tipo Fantasma (Imunidade de tipo Normal).
 */
export function calculateSonicBoomDamage(typeEffectiveness: number): number {
    // Se a eficácia for 0 (Imune), o dano é 0.
    if (typeEffectiveness === 0) return 0;
    
    return 20;
}
