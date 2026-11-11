
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o efeito da habilidade Justiceiro (Justified).
 * Aumenta o Ataque do Pokémon em 1 estágio ao ser atingido por um movimento do tipo Noturno.
 */
export function triggerJustified(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.attack < 6) {
        pokemon.statStages.attack++;
        log(logs, `A habilidade Justiceiro de ${pokemon.name} aumentou seu Ataque!`, 'text-green-600 font-bold');
        return true;
    }
    return false;
}
