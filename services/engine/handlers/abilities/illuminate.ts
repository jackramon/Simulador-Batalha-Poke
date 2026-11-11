import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Iluminação (Illuminate).
 * Regra Oficial (Gen 9+): 
 * 1. O Pokémon é imune à redução de sua Precisão (Accuracy).
 * 2. O Pokémon ignora os aumentos de Evasiva (Evasion) do oponente ao atacar.
 */

export function isAccuracyDropImmune(pokemon: Pokemon, ignoresAbilities: boolean = false): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    return pokemon.ability === 'illuminate';
}

export function shouldIgnoreEvasion(attacker: Pokemon): boolean {
    if (attacker.isFainted) return false;
    return attacker.ability === 'illuminate';
}
