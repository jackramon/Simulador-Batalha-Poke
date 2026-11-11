import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { applyMoveStatChange } from '../effects/statChanges';

/**
 * Lógica para o movimento Afiar Garras (Hone Claws).
 * Aumenta o Ataque e a Precisão do usuário em 1 estágio.
 */
export function handleHoneClaws(attacker: Pokemon, logs: LogEntry[], state?: BattleState) {
    applyMoveStatChange(attacker, 'attack-up', logs, false, false, 'hone-claws', state);
    applyMoveStatChange(attacker, 'accuracy-up', logs, false, false, 'hone-claws', state);
}
