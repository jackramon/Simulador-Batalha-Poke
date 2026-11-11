
import { Pokemon, Move, BattleState } from '../../../../types';
import * as Avalanche from '../moves/avalanche';
import * as IceShard from '../moves/iceShard';
import * as Blizzard from '../moves/blizzard';

export function getIceMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'avalanche':
            return Avalanche.getAvalanchePower(attacker, defender, basePower);
        case 'ice-shard':
            return IceShard.handleIceShard(attacker, defender, move, state);
        case 'blizzard':
            return Blizzard.getBlizzardPower(attacker, basePower);
        default:
            return basePower;
    }
}
