
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Surf.
 * Regra Oficial: O poder base dobra se o alvo estiver no estado semi-invulnerável
 * de Mergulho (Dive).
 */
export function getSurfPower(defender: Pokemon, basePower: number): number {
    // Verifica se o alvo está submerso (Dive)
    if (defender.statusEffects['diving']) {
        return basePower * 2;
    }
    return basePower;
}
