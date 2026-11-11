
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Verifica se o movimento Fingimento (Fake Out) vai falhar.
 * Regra Oficial: Só funciona no primeiro turno em que o Pokémon está em campo (turnsActive == 0).
 */
export function checkFailure(attacker: Pokemon, logs: LogEntry[]): boolean {
    if (attacker.turnsActive > 0) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return true;
    }
    return false;
}
