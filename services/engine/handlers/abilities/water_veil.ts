
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Verifica se o Pokémon é imune à queimadura devido à habilidade Véu de Água (Water Veil).
 */
export function isImmuneToBurn(pokemon: Pokemon): boolean {
    return pokemon.ability === 'water-veil';
}

/**
 * Verifica e cura a queimadura do Pokémon se ele possuir a habilidade Véu de Água.
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkWaterVeil(pokemon: Pokemon, logs: LogEntry[]): boolean {
    if (isImmuneToBurn(pokemon) && pokemon.statusEffects.burn) {
        delete pokemon.statusEffects.burn;
        log(logs, `${pokemon.name} foi curado da queimadura devido ao seu Véu de Água!`, 'text-blue-500 font-bold');
        return true;
    }
    return false;
}
