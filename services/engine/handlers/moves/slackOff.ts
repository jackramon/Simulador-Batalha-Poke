import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import { handleHealingMove } from './healing';

/**
 * Lógica para o movimento Folga (Slack Off).
 * Tipo: Normal
 * Categoria: Status
 * Poder: 0
 * Precisão: 100
 * Efeito: Restaura 50% do HP máximo do usuário.
 * - Afetado por Heal Block (Ruído Psíquico).
 * - A cura é processada pelo handler genérico de cura.
 */
export function handleSlackOff(attacker: Pokemon, move: Move, logs: LogEntry[], state?: BattleState) {
    handleHealingMove(attacker, move, logs, state);
}
