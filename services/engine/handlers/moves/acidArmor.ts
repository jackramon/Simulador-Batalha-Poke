import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

export function handleAcidArmor(attacker: Pokemon, logs: {message: string, color: string}[], state?: BattleState) {
    StatChanges.applyMoveStatChange(attacker, 'defense-up', logs, false, false, 'acid-armor', state);
}
