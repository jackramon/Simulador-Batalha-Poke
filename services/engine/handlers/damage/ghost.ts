
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Hex from '../moves/hex';
import * as Astonish from '../moves/astonish';

export function getGhostMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'astonish':
            return Astonish.handleAstonish(attacker, defender, move, state);
        case 'hex': {
            const res = Hex.getHexPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.HEX_BOOST(), 'text-purple-600 text-xs italic');
            }
            return res.power;
        }
        default:
            return basePower;
    }
}
