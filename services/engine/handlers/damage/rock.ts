
import { Pokemon, Move, BattleState } from '../../../../types';
import * as Rollout from '../moves/rollout';

export function getRockMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'rollout':
            return Rollout.getRolloutPower(attacker, basePower);
        default:
            return basePower;
    }
}
