
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Verifica se o Pokémon é imune ao veneno devido à habilidade Imunidade (Immunity).
 */
export function isImmuneToPoison(pokemon: Pokemon): boolean {
    return pokemon.ability === 'immunity';
}

/**
 * Verifica e cura o veneno do Pokémon se ele possuir a habilidade Imunidade.
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkImmunity(pokemon: Pokemon, logs: LogEntry[]): boolean {
    if (isImmuneToPoison(pokemon) && (pokemon.statusEffects.poison || pokemon.statusEffects.toxic)) {
        delete pokemon.statusEffects.poison;
        delete pokemon.statusEffects.toxic;
        log(logs, `${pokemon.name} foi curado do veneno devido à sua Imunidade!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}
