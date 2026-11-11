import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Verifica se o Pokémon é imune ao congelamento devido à habilidade Armadura de Magma (Magma Armor).
 */
export function isImmuneToFreeze(pokemon: Pokemon): boolean {
    return pokemon.ability === 'magma-armor' && !pokemon.isFainted;
}

/**
 * Verifica e cura o congelamento do Pokémon se ele possuir a habilidade Armadura de Magma.
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkMagmaArmor(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    if (isImmuneToFreeze(pokemon) && pokemon.statusEffects.freeze) {
        delete pokemon.statusEffects.freeze;
        log(logs, `${pokemon.name} foi descongelado devido à sua Armadura de Magma!`, 'text-blue-500 font-bold');
        return true;
    }
    return false;
}