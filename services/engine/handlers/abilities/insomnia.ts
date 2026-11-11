
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Verifica se o Pokémon é imune ao sono devido à habilidade Insônia (Insomnia).
 */
export function isImmuneToSleep(pokemon: Pokemon): boolean {
    return pokemon.ability === 'insomnia';
}

/**
 * Verifica e cura o sono do Pokémon se ele possuir a habilidade Insônia.
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkInsomnia(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    if (isImmuneToSleep(pokemon) && pokemon.statusEffects.sleep) {
        delete pokemon.statusEffects.sleep;
        log(logs, `${pokemon.name} acordou devido à sua habilidade Insônia!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}
