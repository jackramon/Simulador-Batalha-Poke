import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o efeito da habilidade Competitivo (Defiant).
 * Regra Oficial: Aumenta o Ataque do Pokémon em 2 estágios quando um atributo é reduzido pelo oponente.
 */
export function triggerDefiant(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.ability !== 'defiant' || pokemon.isFainted) {
        return false;
    }

    if (pokemon.statStages.attack < 6) {
        const oldStage = pokemon.statStages.attack;
        pokemon.statStages.attack = Math.min(6, pokemon.statStages.attack + 2);
        const diff = pokemon.statStages.attack - oldStage;
        
        if (diff > 0) {
            log(logs, `A habilidade Competitivo de ${pokemon.name} aumentou muito seu Ataque!`, 'text-blue-600 font-bold');
            return true;
        }
    }
    return false;
}
