import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Renovação (Refresh).
 * Cura o usuário de queimadura, paralisia ou envenenamento.
 */
export function handleRefresh(attacker: Pokemon, logs: LogEntry[]) {
    const status = attacker.statusEffects;

    // Verifica se tem status curável
    if (status.burn || status.paralysis || status.poison || status.toxic) {
        // Remove os status
        if (status.burn) delete status.burn;
        if (status.paralysis) delete status.paralysis;
        if (status.poison) delete status.poison;
        if (status.toxic) delete status.toxic;

        log(logs, `${attacker.name} curou seu problema de status!`, 'text-green-600 font-bold');
    } else {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
    }
}
