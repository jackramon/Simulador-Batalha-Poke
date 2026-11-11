
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Água Salgada (Brine).
 * Regra Oficial: O poder base dobra (65 -> 130) se o HP do alvo estiver
 * igual ou inferior a 50% do seu máximo.
 */
export function getBrinePower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const isBoosted = defender.hp <= (defender.maxHP / 2);
    
    return {
        power: isBoosted ? basePower * 2 : basePower,
        isBoosted
    };
}
