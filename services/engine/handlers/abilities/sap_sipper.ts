
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o bônus de Ataque da habilidade Herbívoro (Sap Sipper).
 * Ocorre quando o Pokémon é alvo de um movimento do tipo Grama.
 */
export function triggerSapSipperBoost(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.attack < 6) {
        pokemon.statStages.attack++;
        log(logs, `O Herbívoro de ${pokemon.name} absorveu o golpe e aumentou seu Ataque!`, 'text-green-600 font-bold');
    } else {
        log(logs, `${pokemon.name} absorveu o golpe de Grama, mas seu Ataque já está no máximo!`, 'text-gray-500 italic text-xs');
    }
}
