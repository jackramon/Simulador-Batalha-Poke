
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Terremoto (Earthquake) e Magnitude.
 * Regra Oficial: O poder base dobra se o alvo estiver no estado semi-invulnerável
 * de Escavar (Dig).
 */
export function getEarthquakePower(defender: Pokemon, basePower: number): number {
    // Verifica se o alvo está no subsolo (Dig)
    if (defender.statusEffects['digging']) {
        return basePower * 2;
    }
    return basePower;
}
