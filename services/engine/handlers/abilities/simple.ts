
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Simples (Simple).
 * Regra Oficial: Dobra todas as mudanças de atributos que este Pokémon recebe.
 * Ex: Aumento de +1 vira +2. Redução de -1 vira -2.
 */
export function getModifiedStatChange(pokemon: Pokemon, amount: number, isGasActive: boolean = false): number {
    if (pokemon.ability === 'simple' && !isGasActive) {
        return amount * 2;
    }
    return amount;
}
