
import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';

export function handleAllySwitch(attacker: Pokemon, logs: LogEntry[], state: BattleState) {
    // In single battles (current simulator state), Ally Switch fails.
    // It requires a Double/Triple battle context to work.
    log(logs, `Mas falhou!`, 'text-gray-500 italic');
}
