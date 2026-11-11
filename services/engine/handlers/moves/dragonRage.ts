
/**
 * Lógica para o movimento Fúria do Dragão (Dragon Rage).
 * Regra Oficial: Causa sempre 40 pontos de dano fixo.
 * Não afeta Pokémon do tipo Fada (Imunidade de tipo).
 */
export function calculateDragonRageDamage(typeEffectiveness: number): number {
    // Se a eficácia for 0 (Imune), o dano é 0.
    if (typeEffectiveness === 0) return 0;
    
    return 40;
}
