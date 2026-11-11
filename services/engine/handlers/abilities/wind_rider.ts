
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o bônus de Ataque da habilidade Cavaleiro do Vento (Wind Rider).
 * Oficial: Aumenta o Ataque em 1 estágio ao ser atingido por um movimento de vento 
 * ou quando Tailwind é ativado (Tailwind ainda não implementado como estado de campo).
 */
export function triggerWindRiderBoost(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.statStages.attack < 6) {
        pokemon.statStages.attack++;
        log(logs, `O Cavaleiro do Vento de ${pokemon.name} aproveitou a brisa para aumentar seu Ataque!`, 'text-indigo-600 font-bold');
        return true;
    } else {
        log(logs, `O Ataque de ${pokemon.name} já está no máximo!`, 'text-gray-500 italic text-xs');
    }
    return false;
}
