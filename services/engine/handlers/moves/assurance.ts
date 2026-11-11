
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Garantia (Assurance).
 * Regra Oficial: O poder base dobra (60 -> 120) se o alvo já tiver recebido dano 
 * neste turno (por outro Pokémon ou dano residual/recoil).
 */
export function getAssurancePower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // No motor atual, pokemonList[index].statusEffects['avalanche-tracker'] é usado 
    // para registrar que o Pokémon recebeu dano de um Pokémon neste turno.
    // Futuramente, pode-se expandir para incluir rastreadores de dano residual se implementados.
    const tookDamage = !!defender.statusEffects['avalanche-tracker'];
    
    return {
        power: tookDamage ? basePower * 2 : basePower,
        isBoosted: tookDamage
    };
}
