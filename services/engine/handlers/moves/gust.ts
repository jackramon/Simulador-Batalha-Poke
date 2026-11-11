
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Ventania (Gust).
 * Regra Oficial: O poder base dobra se o alvo estiver nos estados semi-invulneráveis
 * de Voar (Fly) ou Salto (Bounce).
 */
export function getGustPower(defender: Pokemon, basePower: number): number {
    // Verifica se o alvo está voando ou saltando
    if (defender.statusEffects['flying'] || defender.statusEffects['bouncing']) {
        return basePower * 2;
    }
    return basePower;
}
