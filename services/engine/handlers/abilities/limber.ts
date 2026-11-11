
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Verifica se o Pokémon é imune à paralisia devido à habilidade Flexibilidade (Limber).
 */
export function isImmuneToParalysis(pokemon: Pokemon): boolean {
    return pokemon.ability === 'limber';
}

/**
 * Verifica e cura a paralisia do Pokémon se ele possuir a habilidade Flexibilidade (Limber).
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkLimber(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    if (isImmuneToParalysis(pokemon) && pokemon.statusEffects.paralysis) {
        delete pokemon.statusEffects.paralysis;
        log(logs, `${pokemon.name} foi curado da paralisia devido à sua Flexibilidade!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}
