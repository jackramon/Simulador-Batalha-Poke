
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o bônus de Ataque Especial da habilidade Dreno Marítimo (Storm Drain).
 * Ocorre quando o Pokémon é alvo de um movimento do tipo Água.
 */
export function triggerStormDrainBoost(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.spAttack < 6) {
        pokemon.statStages.spAttack++;
        log(logs, `O Dreno Marítimo de ${pokemon.name} aumentou seu Atq. Especial!`, 'text-blue-600 font-bold');
    } else {
        log(logs, `O Atq. Especial de ${pokemon.name} já está no máximo!`, 'text-gray-500 italic text-xs');
    }
}
