
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Guarda Rápida (Quick Guard).
 * Regra Oficial (Gen 6+): 
 * Protege o usuário (e aliados em duplas) de todos os movimentos com prioridade aumentada
 * usados pelo oponente.
 * Diferente de Protect, não falha se usado consecutivamente.
 * Prioridade: +3.
 */
export function handleQuickGuard(attacker: Pokemon, logs: LogEntry[]) {
    // Aplica o status 'quick-guard'.
    // Duração: 1 turno (Turno atual). Limpo em turnEnd.ts (protectionStatuses).
    attacker.statusEffects['quick-guard'] = { turns: 1 };
    
    log(logs, `${attacker.name} protegeu-se de ataques com prioridade!`, 'text-blue-500 font-bold');
}
