
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o efeito da habilidade Competitivo (Competitive).
 * Aumenta o Atq. Especial do Pokémon em 2 estágios quando um atributo é reduzido pelo oponente.
 */
export function triggerCompetitive(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.spAttack < 6) {
        const oldStage = pokemon.statStages.spAttack;
        pokemon.statStages.spAttack = Math.min(6, pokemon.statStages.spAttack + 2);
        const diff = pokemon.statStages.spAttack - oldStage;
        
        if (diff > 0) {
            log(logs, `A habilidade Competitivo de ${pokemon.name} aumentou muito seu Atq. Especial!`, 'text-blue-600 font-bold');
            return true;
        }
    }
    return false;
}
