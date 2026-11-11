
/**
 * Lógica para o movimento Arremesso Sísmico (Seismic Toss).
 * Regra Oficial: Causa dano igual ao nível do usuário.
 * No simulador (nível 50 fixo), causa 50 de dano.
 * Respeita imunidades de tipo (Fantasma).
 */
export function calculateSeismicTossDamage(typeEffectiveness: number): number {
    // Se a eficácia for 0 (Imune - ex: Fantasma), o dano é 0.
    if (typeEffectiveness === 0) return 0;
    
    // Nível padronizado do simulador é 50
    return 50;
}
