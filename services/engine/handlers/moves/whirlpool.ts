
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Turbilhão (Whirlpool).
 * Regra Oficial: 
 * 1. Causa dano e aprisiona o alvo por 4-5 turnos.
 * 2. O poder base dobra (35 -> 70) se o alvo estiver usando Mergulho (Dive).
 */
export function getWhirlpoolPower(defender: Pokemon, basePower: number): number {
    // Verifica se o defensor está submerso usando Dive
    if (defender.statusEffects['diving']) {
        return basePower * 2;
    }
    
    return basePower;
}
