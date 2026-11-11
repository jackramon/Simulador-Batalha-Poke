
import { Pokemon } from '../../../../types';

/**
 * Verifica se o Pokémon deve ser tratado como se estivesse dormindo para efeitos de golpes.
 * Exemplos: Comedor de Sonhos (Dream Eater) funciona e Hex causa dano dobrado.
 */
export function isTreatedAsAsleep(pokemon: Pokemon): boolean {
    return pokemon.ability === 'comatose';
}

/**
 * Verifica se o Pokémon é imune a condições de status devido ao Comatoso.
 * Oficial: Pokémon com Comatoso não podem receber Burn, Paralysis, Poison, Freeze ou Sleep.
 */
export function isImmuneToStatus(pokemon: Pokemon): boolean {
    return pokemon.ability === 'comatose';
}
