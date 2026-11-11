
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Adiar (Quash).
 * Categoria: Status.
 * Efeito: Força o alvo a se mover por último no turno atual.
 * Falha se:
 * 1. O alvo já se moveu neste turno.
 */
export function handleQuash(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // Se o defensor já agiu, o movimento falha.
    if (defender.movedThisTurn) {
        log(logs, `Mas falhou! ${defender.name} já agiu.`, 'text-gray-500 italic');
        return;
    }

    // Em batalhas 1v1, se o defensor ainda não agiu e o atacante (usuário do Quash)
    // está agindo agora, o defensor é naturalmente o próximo (e último) a agir.
    // Portanto, o efeito mecânico de reordenar a fila não é visível/necessário no contexto 1v1 atual,
    // pois a ordem já está estabelecida (Atacante -> Defensor).
    // O log serve para indicar o sucesso do movimento.
    
    log(logs, `O movimento de ${defender.name} foi adiado!`, 'text-purple-600 font-bold italic');
}
