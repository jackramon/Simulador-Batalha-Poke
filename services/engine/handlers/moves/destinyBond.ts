
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Laço do Destino (Destiny Bond).
 * Regra Oficial: 
 * 1. Aplica o status 'destiny-bond' ao usuário.
 * 2. Se o usuário for nocauteado por um ataque direto enquanto o status estiver ativo, o atacante também desmaia.
 * 3. Falha se usado consecutivamente (Gen 7+).
 * 4. O efeito desaparece na próxima vez que o usuário usar um movimento.
 */
export function handleDestinyBond(attacker: Pokemon, logs: LogEntry[]) {
    // Verifica falha por uso consecutivo
    if (attacker.lastMoveUsed?.name === 'destiny-bond') {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    attacker.statusEffects['destiny-bond'] = { turns: -1 };
    log(logs, `${attacker.name} está tentando levar o oponente consigo!`, 'text-purple-700 font-bold');
}
