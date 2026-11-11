
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Lógica para o movimento Martelo Gigaton (Gigaton Hammer).
 * Regra Oficial: O usuário não pode usar este movimento duas vezes seguidas.
 */
export function checkFailure(attacker: Pokemon, logs: LogEntry[]): boolean {
    if (attacker.lastMoveUsed?.name === 'gigaton-hammer') {
        log(logs, `${attacker.name} não consegue usar este golpe duas vezes seguidas!`, 'text-gray-500 italic');
        return true;
    }
    return false;
}
