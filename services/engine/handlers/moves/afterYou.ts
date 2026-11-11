
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Depois de Você (After You).
 * Categoria: Status.
 * Efeito: O alvo age imediatamente após o usuário, ignorando prioridade e velocidade.
 * Falha se:
 * 1. O alvo já agiu no turno.
 */
export function handleAfterYou(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // Se o alvo já agiu neste turno, o movimento falha.
    // Em 1v1, isso significa que se o oponente foi mais rápido, o golpe falha.
    if (defender.movedThisTurn) {
        log(logs, `Mas falhou! ${defender.name} já agiu.`, 'text-gray-500 italic');
        return;
    }

    // Em batalhas de duplas, isso manipularia a fila de prioridade.
    // Em 1v1, como o alvo ainda não agiu e o usuário acabou de agir, o alvo será naturalmente o próximo.
    // O efeito é principalmente visual/narrativo neste contexto.
    
    log(logs, `${attacker.name} cedeu a vez para ${defender.name}!`, 'text-indigo-600 font-bold');
}
