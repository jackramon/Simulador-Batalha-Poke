
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Chama de Fúria (Temper Flare).
 * Regra Oficial: Dobra o poder base (75 -> 150) se o último movimento usado pelo Pokémon falhou.
 * O status `lastMoveFailed` é atualizado no motor principal quando um golpe erra ou falha.
 */
export function getTemperFlarePower(attacker: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const isBoosted = !!attacker.lastMoveFailed;
    
    return {
        power: isBoosted ? basePower * 2 : basePower,
        isBoosted
    };
}
