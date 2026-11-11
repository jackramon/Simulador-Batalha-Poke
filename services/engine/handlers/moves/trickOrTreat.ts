import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Gostosuras ou Travessuras (Trick-or-Treat).
 * Categoria: Status.
 * Efeito: Adiciona o tipo Fantasma (Ghost) ao alvo.
 * Falha se:
 * 1. O alvo já possuir o tipo Fantasma.
 * 2. O alvo estiver Terastalizado.
 */
export function handleTrickOrTreat(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Falha se o alvo estiver Terastalizado (Gen 9)
    if (defender.isTerastallized) {
        log(logs, `Mas falhou! O alvo está protegido pela energia Terastal.`, 'text-gray-500 italic');
        return;
    }

    // 2. Falha se o alvo já possuir o status Fantasma (Trick-or-Treat) ou o tipo Fantasma nativo
    if (defender.types.includes('ghost') || defender.statusEffects['trick-or-treat']) {
        log(logs, `Mas falhou! ${defender.name} já possui o tipo Fantasma.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status volátil em vez de modificar o array de tipos para evitar quebra de UI
    defender.statusEffects['trick-or-treat'] = { turns: -1 };

    log(logs, `${defender.name} agora também é do tipo Fantasma!`, 'text-purple-600 font-bold italic');
}
