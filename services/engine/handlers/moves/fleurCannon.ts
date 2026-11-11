import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { applyMoveStatChange } from '../effects/statChanges';

export function handleFleurCannonEffect(attacker: Pokemon, logs: LogEntry[], state: BattleState) {
    // Fleur Cannon: Reduces the user's Special Attack by 2 stages.
    applyMoveStatChange(
        attacker,
        'spAttack-down',
        logs,
        false, // isOpponentSource = false (Self-inflicted)
        false, // ignoresAbilities (Self-inflicted usually ignores target abilities, but here it's on self)
        'fleur-cannon',
        state
    );
}
