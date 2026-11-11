
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o bônus de Velocidade da habilidade Motor Propulsor (Motor Drive).
 * Ocorre quando o Pokémon é alvo de um movimento do tipo Elétrico.
 */
export function triggerMotorDriveBoost(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.speed < 6) {
        pokemon.statStages.speed++;
        log(logs, `O Motor Propulsor de ${pokemon.name} absorveu a eletricidade e aumentou sua Velocidade!`, 'text-yellow-600 font-bold');
    } else {
        log(logs, `${pokemon.name} absorveu o golpe elétrico, mas sua Velocidade já está no máximo!`, 'text-gray-500 italic text-xs');
    }
}
