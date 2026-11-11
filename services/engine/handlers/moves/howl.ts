import { Pokemon, LogEntry, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Handler para o movimento Uivo (Howl).
 * Efeito: Aumenta o Ataque do usuário em 1 estágio.
 */
export function handleHowl(attacker: Pokemon, logs: LogEntry[], state?: BattleState) {
    StatChanges.applyMoveStatChange(attacker, 'attack-up', logs, false, false, 'howl', state);
}
