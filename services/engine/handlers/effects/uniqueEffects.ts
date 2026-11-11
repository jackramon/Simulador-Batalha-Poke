
import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as TransformMove from '../moves/transform';
import * as HealingMoves from '../moves/healing';

export function handleTransform(user: Pokemon, target: Pokemon, logs: LogEntry[]) {
    TransformMove.executeTransform(user, target, logs);
}

export function handleSelfDestruct(attacker: Pokemon, move: Move, logs: LogEntry[]) {
    if (move.effect?.status === 'self-faint') { 
        attacker.hp = 0; 
        log(logs, `${attacker.name} se autodestruiu!`, 'text-red-900 font-bold'); 
    }
}

export function handleHealingMove(
    pokemon: Pokemon, 
    move: Move, 
    logs: LogEntry[],
    state?: BattleState
) {
    // Delega para o handler centralizado que possui verificação de Heal Block e Clima
    HealingMoves.handleHealingMove(pokemon, move, logs, state);
}
