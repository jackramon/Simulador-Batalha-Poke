
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Acrobatics from '../moves/acrobatics';
import * as Gust from '../moves/gust';
import * as AerialAce from '../moves/aerialAce';
import * as AirCutter from '../moves/airCutter';

export function getFlyingMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'acrobatics': {
            const res = Acrobatics.getAcrobaticsPower(attacker, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.ACROBATICS_BOOST(), 'text-indigo-600 font-bold italic');
            }
            return res.power;
        }
        case 'gust': {
            const newPower = Gust.getGustPower(defender, basePower);
            if (newPower > basePower && hitIndex === 0) {
                log(logs, `A ventania atingiu ${defender.name} no ar com força dobrada!`, 'text-indigo-600 font-bold italic');
            }
            return newPower;
        }
        case 'aerial-ace':
            return AerialAce.handleAerialAce(attacker, defender, move, state);
        case 'air-cutter':
            return AirCutter.handleAirCutter(attacker, defender, move, state);
        default:
            return basePower;
    }
}
