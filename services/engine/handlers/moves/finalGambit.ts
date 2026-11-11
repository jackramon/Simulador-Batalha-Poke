
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Aposta Final (Final Gambit).
 * Regra Oficial: Causa dano igual ao HP atual do usuário.
 * O usuário desmaia após o uso (efeito tratado em handleSelfDestruct).
 * Não afeta Pokémon do tipo Fantasma (Imunidade de tipo).
 */
export function calculateFinalGambitDamage(attacker: Pokemon, typeEffectiveness: number): number {
    // Se a eficácia for 0 (Imune), o dano é 0.
    if (typeEffectiveness === 0) return 0;
    
    return attacker.hp;
}
