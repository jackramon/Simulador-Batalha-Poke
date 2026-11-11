
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Lógica para a habilidade Xarope Superdoce (Supersweet Syrup).
 * Regra Oficial: Reduz a evasiva (Evasion) de todos os oponentes em um estágio ao entrar em batalha.
 */
export function triggerSupersweetSyrup(pokemon: Pokemon, opponent: Pokemon | null, logs: LogEntry[]): boolean {
    if (pokemon.ability !== 'supersweet-syrup' || pokemon.isFainted || !opponent || opponent.isFainted) {
        return false;
    }

    if (opponent.statStages.evasion > -6) {
        opponent.statStages.evasion--;
        log(logs, `O Xarope Superdoce de ${pokemon.name} reduziu a evasiva de ${opponent.name}!`, 'text-pink-600 font-bold');
        return true;
    }
    
    return false;
}
