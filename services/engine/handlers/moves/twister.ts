
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Tornado (Twister).
 * Regra Oficial: 
 * 1. Tem 20% de chance de fazer o alvo recuar (Flinch).
 * 2. O poder base dobra (40 -> 80) se o alvo estiver nos estados semi-invulneráveis
 *    de Fly (Voar) ou Bounce (Salto).
 */
export function getTwisterPower(defender: Pokemon, basePower: number): number {
    // Verifica se o alvo está voando ou saltando
    if (defender.statusEffects['flying'] || defender.statusEffects['bouncing']) {
        return basePower * 2;
    }
    return basePower;
}
