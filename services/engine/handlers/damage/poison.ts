
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Venoshock from '../moves/venoshock';

export function getPoisonMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'venoshock': {
            const res = Venoshock.getVenoshockPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.VENOSHOCK_BOOST(), 'text-purple-600 text-xs italic');
            }
            return res.power;
        }
        default:
            return basePower;
    }
}
