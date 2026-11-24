
import { BattleState, Pokemon, Move, LogEntry } from '../../../../types';
import * as MoldBreaker from '../abilities/mold_breaker';
import * as StatusConditions from './statusConditions';
import * as FieldEffects from './fieldEffects';
import * as UniqueEffects from './uniqueEffects';
import * as StatChanges from './statChanges';
import { getStatusMoveRoute, type StatusMoveResult } from './statusMoveRegistry';

export function handleStatusMove(
    state: BattleState,
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    logs: LogEntry[]
): StatusMoveResult {
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);
    const route = getStatusMoveRoute(move.name);

    if (route) {
        return route.execute({ state, attacker, defender, move, logs, ignoresAbilities });
    }

    if (move.effect) {
        if (move.effect.status === 'weather') FieldEffects.handleFieldMove(state, move, logs);
        else if (move.effect.status === 'heal') UniqueEffects.handleHealingMove(attacker, move, logs, state);
        else if (move.effect.status === 'transform') UniqueEffects.handleTransform(attacker, defender, logs);
        else if (move.effect.status === 'self-faint') UniqueEffects.handleSelfDestruct(attacker, move, logs);
        else if (move.effect.status.includes('-')) {
            if (move.effect.status.includes('-up')) {
                StatChanges.applyMoveStatChange(attacker, move.effect.status, logs, false, false, move.name, state);
            } else {
                StatChanges.applyMoveStatChange(defender, move.effect.status, logs, true, ignoresAbilities, move.name, state);
            }
        } else {
            StatusConditions.applyStatus(defender, move.effect.status, logs, attacker, false, state, move);
        }
    }
    return {};
}
