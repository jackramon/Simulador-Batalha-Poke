
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Venochoque (Venoshock).
 * Regra Oficial: O poder base dobra (65 -> 130) se o alvo estiver 
 * sob efeito de Veneno (Poison) ou Tóxico (Toxic).
 */
export function getVenoshockPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const isPoisoned = !!(defender.statusEffects.poison || defender.statusEffects.toxic);
    
    return {
        power: isPoisoned ? basePower * 2 : basePower,
        isBoosted: isPoisoned
    };
}
