
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o efeito da habilidade Compactação (Water Compaction).
 * Aumenta a Defesa do Pokémon em 2 estágios ao ser atingido por um golpe de Água.
 */
export function triggerWaterCompaction(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.defense < 6) {
        const oldStage = pokemon.statStages.defense;
        pokemon.statStages.defense = Math.min(6, pokemon.statStages.defense + 2);
        const diff = pokemon.statStages.defense - oldStage;
        
        if (diff > 0) {
            log(logs, `A Compactação de ${pokemon.name} aumentou ${diff === 2 ? 'muito ' : ''}sua Defesa!`, 'text-green-600 font-bold');
            return true;
        }
    }
    return false;
}
