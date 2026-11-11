
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o bônus de Ataque Especial da habilidade Para-Raio (Lightning Rod).
 * Ocorre quando o Pokémon é alvo de um movimento do tipo Elétrico.
 */
export function triggerLightningRodBoost(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.spAttack < 6) {
        pokemon.statStages.spAttack++;
        log(logs, `O Para-Raio de ${pokemon.name} absorveu a eletricidade e aumentou seu Atq. Especial!`, 'text-yellow-500 font-bold');
    } else {
        log(logs, `${pokemon.name} absorveu o golpe elétrico, mas seu Atq. Especial já está no máximo!`, 'text-gray-500 italic text-xs');
    }
}
