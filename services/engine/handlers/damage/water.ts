
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Whirlpool from '../moves/whirlpool';
import * as Brine from '../moves/brine';
import * as WaterPledge from '../moves/waterPledge';
import * as WaterSpout from '../moves/waterSpout';
import * as Surf from '../moves/surf';
import * as AquaTail from '../moves/aquaTail';

export function getWaterMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'aqua-tail':
            return AquaTail.handleAquaTail(attacker, defender, move, state);
        case 'whirlpool':
            return Whirlpool.getWhirlpoolPower(defender, basePower);
        case 'surf': {
            const newPower = Surf.getSurfPower(defender, basePower);
            if (newPower > basePower && hitIndex === 0) {
                log(logs, `A onda atingiu ${defender.name} debaixo d'água com força dobrada!`, 'text-blue-700 font-bold italic');
            }
            return newPower;
        }
        case 'brine': {
            const res = Brine.getBrinePower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.BRINE_BOOST(), 'text-blue-600 font-bold italic');
            }
            return res.power;
        }
        case 'water-pledge': {
            return WaterPledge.getWaterPledgePower(attacker, basePower);
        }
        case 'water-spout': {
            const power = WaterSpout.getWaterSpoutPower(attacker);
            if (hitIndex === 0 && attacker.hp < attacker.maxHP) {
                log(logs, `A Tromba d'Água está mais fraca devido ao HP reduzido!`, 'text-gray-500 text-xs italic');
            }
            return power;
        }
        default:
            return basePower;
    }
}
