
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o efeito da habilidade Assustado (Rattled).
 * Aumenta a velocidade do Pokémon em 1 estágio.
 */
export function triggerRattled(pokemon: Pokemon, logs: LogEntry[], reason: string) {
    if (pokemon.statStages.speed < 6) {
        pokemon.statStages.speed++;
        log(logs, `${pokemon.name} ficou assustado por ${reason} e aumentou sua Velocidade!`, 'text-indigo-600 font-bold');
        return true;
    }
    return false;
}
