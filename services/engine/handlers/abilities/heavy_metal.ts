
import { Pokemon } from '../../../../types';

/**
 * Calcula o peso efetivo do Pokémon considerando habilidades e Autotomize.
 * @returns Peso em hectogramas (1 hg = 0.1 kg).
 */
export function getEffectiveWeight(pokemon: Pokemon): number {
    if (!pokemon) return 0;
    
    let weight = pokemon.weight;
    
    // Metal Pesado (Heavy Metal): Dobra o peso
    if (pokemon.ability === 'heavy-metal') {
        weight *= 2;
    }
    
    // Metal Leve (Light Metal): Reduz o peso pela metade
    if (pokemon.ability === 'light-metal') {
        weight /= 2;
    }
    
    // Autotomizar (Autotomize): Reduz 100kg (1000hg) por uso
    if (pokemon.statusEffects['autotomize-weight']) {
        const stacks = pokemon.statusEffects['autotomize-weight'].damageAccumulated || 0;
        weight -= (stacks * 1000);
    }
    
    // Peso mínimo oficial é 0.1 kg (1 hg)
    return Math.max(1, weight);
}

/**
 * Retorna o multiplicador de peso bruto da habilidade (legado/suporte).
 */
export function getWeightMultiplier(pokemon: Pokemon): number {
    if (pokemon.ability === 'heavy-metal') return 2;
    if (pokemon.ability === 'light-metal') return 0.5;
    return 1;
}
