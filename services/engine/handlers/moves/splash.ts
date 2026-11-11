
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Esguicho (Splash).
 * Regra Oficial: Não faz absolutamente nada.
 * Mensagem: "Mas não aconteceu nada!"
 */
export function handleSplash(attacker: Pokemon, logs: LogEntry[]) {
    log(logs, `Mas não aconteceu nada!`, 'text-gray-500 italic');
}
