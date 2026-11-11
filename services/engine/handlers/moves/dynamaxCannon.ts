
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Canhão Dynamax (Dynamax Cannon).
 * Regra Oficial: O poder base dobra (100 -> 200) se o alvo estiver na forma Dynamax ou Gigantamax.
 */
export function getDynamaxCannonPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // Como o simulador atualmente não possui um estado booleano 'isDynamaxed' global,
    // verificamos se o Pokémon é Eternatus na forma Eternamax (que é uma forma Dynamax permanente).
    // Futuramente, se a mecânica Dynamax for implementada (ex: statusEffect ou flag), adicionar aqui.
    
    const isDynamaxed = defender.name.includes('Eternamax');

    if (isDynamaxed) {
        return {
            power: basePower * 2,
            isBoosted: true
        };
    }

    return {
        power: basePower,
        isBoosted: false
    };
}
